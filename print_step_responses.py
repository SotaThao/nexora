import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file not found!")
    exit(1)

target_steps = {58, 59, 68, 69, 117, 118}
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get("step_index")
            if step in target_steps:
                print(f"==================================================")
                print(f"Step {step} | Type: {data.get('type')} | Source: {data.get('source')} | Status: {data.get('status')}")
                print(f"==================================================")
                print(data.get("content", ""))
                print("\n")
        except Exception as e:
            pass
