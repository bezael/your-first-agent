// Step 0 — Talk to the model.
// An LLM takes a list of messages and returns the next one. That's all.

import { chat } from "../lib/llm.ts";

const answer = await chat([
  { role: "system", content: "You are a brief assistant. Answer in one sentence." },
  { role: "user", content: "What time is it right now?" },
]);

console.log(answer.content);

// Look at the answer: the model doesn't know the time. No clock, no internet, no hands.
// In step 1 we give it a tool.
