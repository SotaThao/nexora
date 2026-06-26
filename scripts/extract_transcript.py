import json
import os

transcript_path = r'C:\Users\AD\.gemini\antigravity\brain\69db3fb6-aea4-4796-8136-1315e0711a00\.system_generated\logs\transcript.jsonl'
full_transcript_path = r'C:\Users\AD\.gemini\antigravity\brain\69db3fb6-aea4-4796-8136-1315e0711a00\.system_generated\logs\transcript_full.jsonl'

def extract(path):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for call in data['tool_calls']:
                        if call['name'] in ['write_to_file', 'replace_file_content', 'write_file', 'edit_file']:
                            target = call['args'].get('TargetFile')
                            print(f"File modified: {target}")
            except Exception as e:
                pass

extract(transcript_path)
