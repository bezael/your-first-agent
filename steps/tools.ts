// The agent's tools. Each one has two parts:
// - definition: what the model READS (name, what it's for, which parameters it takes)
// - run: what YOUR code EXECUTES
// The description matters more than the code: it's the only thing the model sees to decide.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { ToolDefinition } from "../lib/llm.ts";

export type ToolContext = {
  // Asks the human in the terminal. Returns true if they answer yes.
  confirm: (question: string) => Promise<boolean>;
};

type Tool = {
  definition: ToolDefinition;
  run: (args: Record<string, any>, context: ToolContext) => Promise<string> | string;
};

// The agent can only touch files inside this folder.
const WORKSPACE = resolve("workspace");

// Without this check, the model could ask for "../../.ssh/id_rsa" and we would read it.
function safePath(path: string): string {
  const fullPath = resolve(WORKSPACE, path);
  const insidePath = relative(WORKSPACE, fullPath);
  if (insidePath.startsWith("..") || isAbsolute(insidePath)) {
    throw new Error(`"${path}" is outside the workspace`);
  }
  return fullPath;
}

const getCurrentTime: Tool = {
  definition: {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Returns the current date and time in Barcelona. Use it to work out deadlines and days left.",
      parameters: { type: "object", properties: {} },
    },
  },
  run: () => new Date().toLocaleString("en-GB", { timeZone: "Europe/Madrid", dateStyle: "full", timeStyle: "short" }),
};

const listFiles: Tool = {
  definition: {
    type: "function",
    function: {
      name: "list_files",
      description: "Lists every file in the workspace. Call it first when you don't know which files exist.",
      parameters: { type: "object", properties: {} },
    },
  },
  run: async () => {
    const entries = await readdir(WORKSPACE, { recursive: true, withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => relative(WORKSPACE, resolve(entry.parentPath, entry.name)).replaceAll("\\", "/"));
    return files.length ? files.join("\n") : "The workspace is empty";
  },
};

const readFileTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "read_file",
      description: "Returns the full content of a text file in the workspace.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Path relative to the workspace, e.g. tasks.md" } },
        required: ["path"],
      },
    },
  },
  run: ({ path }) => readFile(safePath(path), "utf-8"),
};

// Writing changes the world, so a human approves it first.
const writeFileTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Creates or overwrites a text file in the workspace. The user has to approve it, " +
        "so if they reject it, don't try again: ask them what to change.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the workspace, e.g. plan.md" },
          content: { type: "string", description: "Full content of the file" },
        },
        required: ["path", "content"],
      },
    },
  },
  run: async ({ path, content }, { confirm }) => {
    const fullPath = safePath(path);
    const preview = content.split("\n").slice(0, 15).join("\n");
    const approved = await confirm(`\n--- ${path} ---\n${preview}\n---\nWrite this file? (y/n) `);
    if (!approved) return "The user rejected the write. Nothing was saved.";

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
    return `Saved ${path} (${content.length} characters)`;
  },
};

// 👉 Add your tool here and put it in the list below. Ideas in the README.

export const tools: Tool[] = [getCurrentTime, listFiles, readFileTool, writeFileTool];
