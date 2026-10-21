// One function to talk to the model. No SDK: just a fetch to /chat/completions.
// Gemini and OpenAI accept the same format, so switching providers means switching the URL.

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type Message =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: object };
};

type Provider = {
  name: string;
  baseURL: string;
  apiKey: string | undefined;
  model: string;
  extraBody?: object;
};

const providers: Record<string, Provider> = {
  gemini: {
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
  },
  openai: {
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    // GPT-6 only supports tools on /chat/completions with gpt-6-luna and reasoning turned off.
    // gpt-6-astra and gpt-6.1-sol need the Responses API for tool calling.
    model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
    extraBody: { reasoning_effort: "none" },
  },
};

function pickProviders(): Provider[] {
  const first = process.env.PROVIDER ?? "gemini";
  const order = first === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
  const available = order.map((name) => providers[name]).filter((p) => p.apiKey);
  if (available.length === 0) {
    throw new Error("No API key found. Copy .env.example to .env and set GEMINI_API_KEY.");
  }
  return available;
}

async function callProvider(provider: Provider, messages: Message[], tools?: ToolDefinition[]) {
  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({ model: provider.model, messages, tools, ...provider.extraBody }),
  });

  if (!response.ok) {
    const error = new Error(`${provider.name} returned ${response.status}: ${await response.text()}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.choices[0].message as Extract<Message, { role: "assistant" }>;
}

// If Gemini is rate limited (429) or down (5xx) and there is an OpenAI key, retry with OpenAI.
export async function chat(messages: Message[], tools?: ToolDefinition[]) {
  const [primary, backup] = pickProviders();
  try {
    return await callProvider(primary, messages, tools);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 0;
    const retryable = status === 429 || status >= 500;
    if (!backup || !retryable) throw error;
    console.warn(`⚠️  ${primary.name} is not responding (${status}). Trying ${backup.name}…`);
    return await callProvider(backup, messages, tools);
  }
}
