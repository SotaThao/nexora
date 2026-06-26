import json
import os

schema_path = r"C:\Users\AD\.gemini\antigravity\scratch\tool_schemas.json"

if not os.path.exists(schema_path):
    print("Schema file not found!")
    exit(1)

with open(schema_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Let's inspect the keys and structure
if isinstance(data, dict):
    print("Keys in JSON:", data.keys())
    if "tools" in data:
        tools = data["tools"]
    elif "content" in data:
        # maybe MCP tool list response format
        tools = data.get("content", [])
        if len(tools) > 0 and "text" in tools[0]:
            try:
                parsed_inner = json.loads(tools[0]["text"])
                tools = parsed_inner.get("tools", [])
            except:
                pass
    else:
        tools = []
else:
    tools = data

print(f"Total tools found: {len(tools)}")
for t in tools:
    if isinstance(t, dict):
        print(f"  {t.get('name')}")
    else:
        print(f"  {t}")
