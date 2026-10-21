// Step 1 — The first tool.
// We describe to the model a function that lives in OUR code.
// The model doesn't run it: it only asks us to run it.

import { chat, type ToolDefinition } from "../lib/llm.ts";

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

const answer = await chat([{ role: "user", content: "What time is it right now?" }], tools);

console.log("Model text:", answer.content);
console.log("Requested tools:", JSON.stringify(answer.tool_calls, null, 2));

// The text is empty and there's a tool_call instead: "please run get_current_time".
// If nobody runs it, this is where it ends. In step 2 we close the loop.
