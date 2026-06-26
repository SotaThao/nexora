import json
import os

slides_path = r"C:\Users\AD\.gemini\antigravity\scratch\slides_layout.json"

if not os.path.exists(slides_path):
    print("Slides file not found!")
    exit(1)

with open(slides_path, "r", encoding="utf-8") as f:
    slides = json.load(f)

print(f"Total slides in layout: {len(slides)}")
for i, slide in enumerate(slides):
    print(f"Slide {i+1} ({slide.get('name')}):")
    print(f"  Width: {slide.get('width')}, Height: {slide.get('height')}")
    print(f"  Background: {slide.get('backgroundColor')}")
    # Let's count child types
    children = slide.get("children", [])
    types = {}
    for c in children:
        t = c.get("type")
        types[t] = types.get(t, 0) + 1
    print(f"  Children: {len(children)} - Types: {types}")
