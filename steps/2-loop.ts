// Step 2 — The loop. This is where the agent is born.
// 1. Send the messages and the tools to the model.
// 2. If it asks for tools, run them and send back the result.
// 3. Repeat until it answers with text.

import { chat, type Message, type ToolDefinition } from "../lib/llm.ts";

const tools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Returns the current date and time in Barcelona.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function runTool(name: string): string {
  if (name === "get_current_time") {
    return new Date().toLocaleString("en-GB", { timeZone: "Europe/Madrid" });
  }
  return `Error: unknown tool ${name}`;
}

const messages: Message[] = [{ role: "user", content: "What time is it? Do I have time for lunch before 3 pm?" }];

const MAX_STEPS = 5; // handbrake: an agent without a limit can loop forever (and spend money)

for (let step = 1; step <= MAX_STEPS; step++) {
  const answer = await chat(messages, tools);
  messages.push(answer);

  if (!answer.tool_calls?.length) {
    console.log(`\n🤖 ${answer.content}`);
    break;
  }

  for (const call of answer.tool_calls) {
    const result = runTool(call.function.name);
    console.log(`🔧 ${call.function.name}() → ${result}`);
    messages.push({ role: "tool", tool_call_id: call.id, content: result });
  }
}
