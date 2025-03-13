import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

// Configuration
const MODEL = 'claude-3-7-sonnet-20250219';
const TOOL_TYPE = 'text_editor_20250124';
const TOOL_NAME = 'str_replace_editor';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Make sure to set this environment variable
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

// Function to create backups of files before editing
async function backupFile(filePath: string): Promise<void> {
  try {
    const backupPath = `${filePath}.backup`;
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      await fs.copyFile(filePath, backupPath);
      console.log(`📦 Created backup at ${backupPath}`);
    }
  } catch (error) {
    console.error(`❌ Error creating backup: ${error}`);
  }
}

// Function to handle the view command
async function handleViewCommand(filePath: string, viewRange?: [number, number]): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (viewRange) {
      const [start, end] = viewRange;
      const startIdx = Math.max(0, start - 1); // Convert to 0-based index
      const endIdx = end === -1 ? lines.length : Math.min(lines.length, end);
      
      const selectedLines = lines.slice(startIdx, endIdx);
      return selectedLines.map((line, idx) => `${startIdx + idx + 1}: ${line}`).join('\n');
    }
    
    // If no range provided, return the whole file with line numbers
    return lines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return `Error: File not found`;
    }
    return `Error reading file: ${error}`;
  }
}

// Function to handle the str_replace command
async function handleStrReplaceCommand(filePath: string, oldStr: string, newStr: string): Promise<string> {
  try {
    // Create a backup before making changes
    await backupFile(filePath);
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Count matches to ensure exactly one match
    const matchCount = content.split(oldStr).length - 1;
    
    if (matchCount === 0) {
      return `Error: No match found for replacement. Please check your text and try again.`;
    }
    
    if (matchCount > 1) {
      return `Error: Found ${matchCount} matches for replacement text. Please provide more context to make a unique match.`;
    }
    
    // Replace the text
    const newContent = content.replace(oldStr, newStr);
    
    await fs.writeFile(filePath, newContent, 'utf-8');
    return `Successfully replaced text at exactly one location.`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return `Error: File not found`;
    }
    return `Error replacing text: ${error}`;
  }
}

// Function to handle the create command
async function handleCreateCommand(filePath: string, fileText: string): Promise<string> {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Check if file already exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      // Create a backup before overwriting
      await backupFile(filePath);
    }
    
    // Create the file
    await fs.writeFile(filePath, fileText, 'utf-8');
    return `Successfully created file at ${filePath}`;
  } catch (error) {
    return `Error creating file: ${error}`;
  }
}

// Function to handle the insert command
async function handleInsertCommand(filePath: string, insertLine: number, newStr: string): Promise<string> {
  try {
    // Create a backup before making changes
    await backupFile(filePath);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Validate the insert line
    if (insertLine < 0 || insertLine > lines.length) {
      return `Error: Invalid insert line. The file has ${lines.length} lines.`;
    }
    
    // Insert the text at the specified line
    const newLines = [
      ...lines.slice(0, insertLine),
      newStr,
      ...lines.slice(insertLine)
    ];
    
    await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
    return `Successfully inserted text at line ${insertLine}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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
    const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
    
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

// Main function to handle the text editor tool
async function handleEditorTool(toolCall: any): Promise<string> {
  const inputParams = toolCall.input;
  const command = inputParams.command || '';
  const filePath = inputParams.path || '';
  
  console.log(`🔧 Executing ${command} command on ${filePath}...`);
  
  switch (command) {
    case 'view':
      return handleViewCommand(filePath, inputParams.view_range);
    
    case 'str_replace':
      return handleStrReplaceCommand(filePath, inputParams.old_str, inputParams.new_str);
    
    case 'create':
      return handleCreateCommand(filePath, inputParams.file_text);
    
    case 'insert':
      return handleInsertCommand(filePath, inputParams.insert_line, inputParams.new_str);
    
    case 'undo_edit':
      return handleUndoEditCommand(filePath);
    
    default:
      return `Error: Unknown command '${command}'`;
  }
}

// Process Claude's response and handle any tool use
async function processClaudeResponse(response: any, messages: any[]): Promise<{ updatedMessages: any[], isComplete: boolean }> {
  const content = response.content;
  let hasToolUse = false;
  let updatedMessages = [...messages];
  
  // Print Claude's non-tool-use content
  for (const item of content) {
    if (item.type === 'text') {
      console.log(`\n🤖 Claude: ${item.text}`);
    } else if (item.type === 'tool_use') {
      hasToolUse = true;
      const command = item.input.command;
      console.log(`\n🔧 Claude is using the ${item.name} tool with command '${command}'...`);
      
      // Execute the tool use
      const result = await handleEditorTool(item);
      
      // Log a preview of the result
      const previewResult = result.length > 100 
        ? `${result.substring(0, 100)}...` 
        : result;
      console.log(`📋 Tool result: ${previewResult}`);
      
      // Add the tool use to the messages
      updatedMessages.push({
        role: 'assistant' as 'assistant',
        content: [item]
      });
      
      // Add the tool result to the messages
      updatedMessages.push({
        role: 'user' as 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: item.id,
            content: result
          }
        ]
      });
      
      // Break after the first tool use to handle them one at a time
      break;
    }
  }
  
  // If there was no tool use, add Claude's response and mark as complete
  if (!hasToolUse) {
    updatedMessages.push({
      role: 'assistant' as 'assistant',
      content: content
    });
    return { updatedMessages, isComplete: true };
  }
  
  return { updatedMessages, isComplete: false };
}

// Main function to run the refactoring task
async function runRefactoringTask(fileToRefactor: string, refactoringTask: string): Promise<void> {
  console.log(`\n🚀 Starting refactoring task for: ${fileToRefactor}`);
  console.log(`📝 Task: ${refactoringTask}\n`);
  
  // Initial message to Claude
  let messages = [
    {
      role: 'user' as 'user', // Type assertion to ensure TypeScript knows this is specifically 'user'
      content: `I need you to help refactor my ${fileToRefactor} file. ${refactoringTask}. Please use the text editor tool to view and modify the file.`
    }
  ];
  
  let isComplete = false;
  
  while (!isComplete) {
    try {
      // Send the message to Claude
      console.log('🔄 Sending request to Claude...');
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        tools: [
          {
            type: TOOL_TYPE,
            name: TOOL_NAME
          }
        ],
        messages: messages
      });
      
      // Process Claude's response
      const { updatedMessages, isComplete: taskComplete } = await processClaudeResponse(response, messages);
      messages = updatedMessages;
      isComplete = taskComplete;
      
      if (isComplete) {
        console.log('\n✅ Refactoring task completed!');
      }
    } catch (error) {
      console.error('\n❌ Error:', error);
      
      // Ask if the user wants to continue
      const answer = await askQuestion('\nDo you want to continue? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        isComplete = true;
      }
    }
  }
  
  rl.close();
}

// Main execution
async function main() {
  try {
    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is not set.');
      console.log('Please set it with: export ANTHROPIC_API_KEY=your_key_here');
      process.exit(1);
    }
    
    // Use the fixed path to the poorly written code file
    const fileToRefactor = 'fixtures/poorly-written-code.ts';
    
    // Validate file path
    try {
      await fs.access(fileToRefactor);
    } catch (error) {
      console.error(`❌ File not found: ${fileToRefactor}`);
      process.exit(1);
    }
    
    // Get the refactoring task from command line or user input
    let refactoringTask = process.argv[3];
    if (!refactoringTask) {
      refactoringTask = await askQuestion('Describe the refactoring task: ');
    }
    
    await runRefactoringTask(fileToRefactor, refactoringTask);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();