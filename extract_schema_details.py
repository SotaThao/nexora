import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Log file not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's locate the tools block in the json response
# It's inside a json output, let's extract the tools array
# We can search for the tool definition of pages_createWebPage or pages_createDesignPage
try:
    # Find the JSON block starting with {"id":2
    # In JSON-RPC, the response is: {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
    # Let's find "tools":
    start_idx = content.find('"tools":')
    if start_idx != -1:
        # Let's extract from here to the end and try to parse it
        # Or let's search for "pages_createWebPage" inside the text
        # and print the surrounding 1000 characters
        tool_pos = content.find('"name": "pages_createWebPage"')
        if tool_pos != -1:
            print("--- pages_createWebPage Definition ---")
            print(content[tool_pos - 100 : tool_pos + 1200])
        else:
            print("pages_createWebPage not found in log text")
            
        tool_pos_design = content.find('"name": "pages_createDesignPage"')
        if tool_pos_design != -1:
            print("--- pages_createDesignPage Definition ---")
            print(content[tool_pos_design - 100 : tool_pos_design + 1200])
except Exception as e:
    print("Error:", e)
