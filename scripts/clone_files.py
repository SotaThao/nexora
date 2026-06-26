import json
import os

transcript_path = r'C:\Users\AD\.gemini\antigravity\brain\69db3fb6-aea4-4796-8136-1315e0711a00\.system_generated\logs\transcript_full.jsonl'
output_dir = 'cloned_content'
os.makedirs(output_dir, exist_ok=True)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    if call['name'] in ['write_to_file']:
                        target = call['args'].get('TargetFile')
                        content = call['args'].get('CodeContent')
                        if target and content:
                            # write to cloned_content with the basename
                            basename = os.path.basename(target)
                            out_path = os.path.join(output_dir, basename)
                            with open(out_path, 'w', encoding='utf-8') as out_f:
                                out_f.write(content)
                            print(f"Cloned {basename} to {out_path} ({len(content)} bytes)")
                    elif call['name'] == 'replace_file_content':
                        target = call['args'].get('TargetFile')
                        rep_content = call['args'].get('ReplacementContent')
                        if target and rep_content:
                            basename = os.path.basename(target) + ".diff"
                            out_path = os.path.join(output_dir, basename)
                            with open(out_path, 'w', encoding='utf-8') as out_f:
                                out_f.write(rep_content)
                            print(f"Cloned diff for {basename} to {out_path} ({len(rep_content)} bytes)")
        except Exception as e:
            pass
