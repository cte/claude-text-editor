import { Anthropic } from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";

const MODEL = "claude-3-7-sonnet-20250219";
const TOOL_TYPE = "text_editor_20250124";
const TOOL_NAME = "str_replace_editor";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string) =>
  new Promise<string>((resolve) => rl.question(query, resolve));

async function handleViewCommand(
  filePath: string,
  viewRange?: [number, number]
) {
  try {
    console.log({ filePath, viewRange });

    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    if (viewRange) {
      const [start, end] = viewRange;
      const startIdx = Math.max(0, start - 1); // Convert to 0-based index
      const endIdx = end === -1 ? lines.length : Math.min(lines.length, end);

      const selectedLines = lines.slice(startIdx, endIdx);
      return selectedLines
        .map((line, idx) => `${startIdx + idx + 1}: ${line}`)
        .join("\n");
    }

    return lines.map((line, idx) => `${idx + 1}: ${line}`).join("\n");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return `Error: File not found`;
    }

    return `Error reading file: ${error}`;
  }
}

async function handleStrReplaceCommand(
  filePath: string,
  oldStr: string,
  newStr?: string
) {
  try {
    console.log({ filePath, oldStr, newStr });

    if (!newStr) {
      return `Error: No new string provided.`;
    }

    const content = await fs.readFile(filePath, "utf-8");
    const matchCount = content.split(oldStr).length - 1;

    if (matchCount === 0) {
      return `Error: No match found for replacement. Please check your text and try again.`;
    }

    if (matchCount > 1) {
      return `Error: Found ${matchCount} matches for replacement text. Please provide more context to make a unique match.`;
    }

    const newContent = content.replace(oldStr, newStr);
    await fs.writeFile(filePath, newContent, "utf-8");
    return `Successfully replaced text at exactly one location.`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return `Error: File not found`;
    }
    return `Error replacing text: ${error}`;
  }
}

async function handleCreateCommand(
  filePath: string,
  fileText: string
): Promise<string> {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });

    // Create the file
    await fs.writeFile(filePath, fileText, "utf-8");
    return `Successfully created file at ${filePath}`;
  } catch (error) {
    return `Error creating file: ${error}`;
  }
}

async function handleInsertCommand(
  filePath: string,
  insertLine: number,
  newStr: string
) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    // Validate the insert line
    if (insertLine < 0 || insertLine > lines.length) {
      return `Error: Invalid insert line. The file has ${lines.length} lines.`;
    }

    // Insert the text at the specified line
    const newLines = [
      ...lines.slice(0, insertLine),
      newStr,
      ...lines.slice(insertLine),
    ];

    await fs.writeFile(filePath, newLines.join("\n"), "utf-8");
    return `Successfully inserted text at line ${insertLine}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return `Error: File not found`;
    }
    return `Error inserting text: ${error}`;
  }
}

// Function to handle the undo_edit command
async function handleUndoEditCommand(filePath: string): Promise<string> {
  try {
    const backupPath = `${filePath}.backup`;

    // Check if backup exists
    const backupExists = await fs
      .access(backupPath)
      .then(() => true)
      .catch(() => false);

    if (!backupExists) {
      return `Error: No backup found for ${filePath}`;
    }

    // Restore from backup
    await fs.copyFile(backupPath, filePath);
    return `Successfully restored ${filePath} from backup`;
  } catch (error) {
    return `Error undoing edit: ${error}`;
  }
}

async function handleEditorTool(toolCall: any): Promise<string> {
  const inputParams = toolCall.input;
  const command = inputParams.command || "";
  const filePath = inputParams.path || "";

  console.log(`🔧 Executing ${command} command on ${filePath}...`, inputParams);

  switch (command) {
    case "view":
      return handleViewCommand(filePath, inputParams.view_range);

    case "str_replace":
      return handleStrReplaceCommand(
        filePath,
        inputParams.old_str,
        inputParams.new_str
      );

    case "create":
      return handleCreateCommand(filePath, inputParams.file_text);

    case "insert":
      return handleInsertCommand(
        filePath,
        inputParams.insert_line,
        inputParams.new_str
      );

    case "undo_edit":
      return handleUndoEditCommand(filePath);

    default:
      return `Error: Unknown command '${command}'`;
  }
}

async function processClaudeResponse(response: any, messages: any[]) {
  const content = response.content;
  let hasToolUse = false;
  let updatedMessages = [...messages];

  for (const item of content) {
    if (item.type === "text") {
      console.log(`\n🤖 Claude: ${item.text}`);
    } else if (item.type === "tool_use") {
      hasToolUse = true;

      const result = await handleEditorTool(item);
      console.log(`📋 Tool result:`, result);

      updatedMessages.push({ role: "assistant", content: [item] });

      updatedMessages.push({
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: item.id, content: result },
        ],
      });

      break;
    }
  }

  if (!hasToolUse) {
    updatedMessages.push({
      role: "assistant" as "assistant",
      content: content,
    });
    return { updatedMessages, isComplete: true };
  }

  return { updatedMessages, isComplete: false };
}

async function runRefactoringTask(
  fileToRefactor: string,
  refactoringTask: string
) {
  const content =
    `I need you to help refactor my ${fileToRefactor} file. ` +
    refactoringTask +
    ` Please use the text editor tool to view and modify the file.`;

  console.log(`\n🚀 You: ${content}`);

  let messages: MessageParam[] = [{ role: "user", content }];

  while (true) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        tools: [{ type: TOOL_TYPE, name: TOOL_NAME }],
        messages,
      });

      const { updatedMessages, isComplete } = await processClaudeResponse(
        response,
        messages
      );

      messages = updatedMessages;

      if (isComplete) {
        console.log("\n✅ Refactoring task completed!");
        break;
      }
    } catch (error) {
      console.error("\n❌ Error:", error);
      const answer = await askQuestion("\nDo you want to continue? (y/n): ");

      if (answer.toLowerCase() !== "y") {
        break;
      }
    }
  }

  rl.close();
}

async function main() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY environment variable is not set.");
      console.log("Please set it with: export ANTHROPIC_API_KEY=your_key_here");
      process.exit(1);
    }

    const fileToRefactor = "./fixtures/poorly-written-code.ts";

    try {
      await fs.access(fileToRefactor);
    } catch (error) {
      console.error(`❌ File not found: ${fileToRefactor}`);
      process.exit(1);
    }

    let refactoringTask = process.argv[3];

    if (!refactoringTask) {
      // refactoringTask = await askQuestion('Describe the refactoring task: ');
      refactoringTask =
        "Refactor the code to be more readable and maintainable.";
    }

    await runRefactoringTask(fileToRefactor, refactoringTask);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
