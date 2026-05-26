const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\AD\\.gemini\\antigravity\\brain\\915078d9-130e-4ca2-8d8d-bd0f62bbf06b\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
let count = 0;

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'call_mcp_tool' && call.args && call.args.ToolName === 'figma_execute') {
          console.log(`==================== STEP ${data.step_index} (${data.created_at}) ====================`);
          console.log(`ToolAction: ${call.args.toolAction}`);
          let args = call.args.Arguments;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {}
          }
          if (args && args.code) {
            console.log(args.code);
          } else {
            console.log(JSON.stringify(call.args, null, 2));
          }
          count++;
          if (count >= 5) process.exit(0);
        }
      }
    }
  } catch (e) {
    // ignore malformed JSON lines
  }
}
