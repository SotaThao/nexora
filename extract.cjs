const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\AD\\.gemini\\antigravity\\brain\\915078d9-130e-4ca2-8d8d-bd0f62bbf06b\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n');

function extractCodeProperty(argumentsStr) {
  const codeIdx = argumentsStr.indexOf('"code"');
  if (codeIdx === -1) return null;
  
  const colonIdx = argumentsStr.indexOf(':', codeIdx);
  if (colonIdx === -1) return null;
  
  const startQuoteIdx = argumentsStr.indexOf('"', colonIdx);
  if (startQuoteIdx === -1) return null;
  
  let val = '';
  let escaped = false;
  
  for (let i = startQuoteIdx + 1; i < argumentsStr.length; i++) {
    const char = argumentsStr[i];
    if (escaped) {
      if (char === 'n') val += '\n';
      else if (char === 'r') val += '\r';
      else if (char === 't') val += '\t';
      else if (char === '"') val += '"';
      else if (char === '\\') val += '\\';
      else val += '\\' + char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      return val;
    } else {
      val += char;
    }
  }
  return val;
}

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'call_mcp_tool' && call.args && (call.args.ToolName || '').includes('figma_execute')) {
          const rawArgs = call.args.Arguments;
          if (typeof rawArgs === 'string') {
            const code = extractCodeProperty(rawArgs);
            if (code) {
              const filename = `extracted_${data.step_index}.js`;
              const filePath = path.join(__dirname, filename);
              fs.writeFileSync(filePath, code, 'utf8');
              console.log(`Saved step ${data.step_index} (${data.created_at}) to ${filename}`);
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}
console.log('Done extracting.');
