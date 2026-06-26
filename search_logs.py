import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        try:
            data = json.loads(line)
        except:
            continue
            
        tool_calls = data.get("tool_calls", [])
        for tc in tool_calls:
            tc_str = json.dumps(tc)
            if "framer" in tc_str.lower() or "orange-lamp-studio" in tc_str.lower():
                print(f"Step {data.get('step_index')}:")
                print("  Tool name:", tc.get("name"))
                # Print only relevant parts of arguments
                args = tc.get("args", {})
                for k, v in args.items():
                    val_str = str(v)
                    if len(val_str) > 200:
                        val_str = val_str[:200] + "..."
                    print(f"    {k}: {val_str}")
                print("\n")
                
                # Check for output of this tool call in next step if possible
