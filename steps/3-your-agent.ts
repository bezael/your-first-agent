// Step 3 — Your agent.
// The same loop as step 2, but inside a conversation that keeps going
// and with the tools in their own file: tools.ts. That's where you add yours.

import { createInterface } from "node:readline/promises";
import { chat, type Message } from "../lib/llm.ts";
import { tools, type ToolContext } from "./tools.ts";

const definitions = tools.map((tool) => tool.definition);
const MAX_STEPS = 10;

const rl = createInterface({ input: process.stdin, output: process.stdout });

// Human in the loop: tools that change things ask before doing it.
const context: ToolContext = {
  confirm: async (question) => (await rl.question(question)).trim().toLowerCase().startsWith("y"),
};

const messages: Message[] = [
  {
    role: "system",
    content:
      "You are a helpful, brief assistant that works with the files in the user's workspace. " +
      "Use the tools when you need them, and look at the files before answering about them. " +
      "If none of the tools helps, say so instead of making up the answer. " +
      "Reply in the user's language.",
  },
];

async function runTool(name: string, rawArgs: string): Promise<string> {
  const tool = tools.find((t) => t.definition.function.name === name);
  if (!tool) return `Error: unknown tool ${name}`;
  try {
    return await tool.run(JSON.parse(rawArgs || "{}"), context);
  } catch (error) {
    // The error goes back to the model as text, so it can fix its call or tell you.
    return `Error running ${name}: ${(error as Error).message}`;
  }
}

async function agentTurn() {
  for (let step = 1; step <= MAX_STEPS; step++) {
    const answer = await chat(messages, definitions);
    messages.push(answer);

    if (!answer.tool_calls?.length) return answer.content;

    for (const call of answer.tool_calls) {
      console.log(`  🔧 ${call.function.name}(${call.function.arguments.slice(0, 80)})`);
      const result = await runTool(call.function.name, call.function.arguments);
      console.log(`     → ${result.split("\n")[0].slice(0, 100)}`);
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }
  return "I ran out of steps. Try asking in a different way.";
}

console.log(`Tools: ${definitions.map((d) => d.function.name).join(", ")}`);
console.log("Type your question (or 'exit').\n");

while (true) {
  const input = (await rl.question("🧑 ")).trim();
  if (!input) continue;
  if (input === "exit") break;
  messages.push({ role: "user", content: input });
  console.log(`🤖 ${await agentTurn()}\n`);
}
rl.close();
