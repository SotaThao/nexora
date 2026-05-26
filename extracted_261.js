async function runReplacements() {
  const root = await figma.getNodeByIdAsync("37:405");
  if (!root) return { error: "Root node 37:405 not found" };

  const results = [];

  function replaceNode(targetNode, newInstance) {
    const parent = targetNode.parent;
    if (!parent) throw new Error(`Parent not found for node ${targetNode.id}`);
    
    newInstance.x = targetNode.x;
    newInstance.y = targetNode.y;
    newInstance.name = targetNode.name;
    
    if ("layoutAlign" in targetNode) newInstance.layoutAlign = targetNode.layoutAlign;
    if ("layoutGrow" in targetNode) newInstance.layoutGrow = targetNode.layoutGrow;
    
    const index = parent.children.indexOf(targetNode);
    parent.insertChild(index, newInstance);
    
    targetNode.remove();
    return newInstance;
  }

  // 1. Search input
  try {
    const textNode = root.findOne(n => n.type === "TEXT" && n.characters.includes("Search tech"));
    if (textNode && textNode.parent) {
      const target = textNode.parent; // this is the "Input" frame
      const comp = await figma.getNodeByIdAsync("3:483");
      const instance = comp.createInstance();
      
      const label = instance.findOne(n => n.name === "Label");
      if (label) label.visible = false;
      
      const placeholder = instance.findOne(n => n.name === "Placeholder");
      if (placeholder) {
        await figma.loadFontAsync(placeholder.fontName);
        placeholder.characters = "Search tech, station, review...";
      }
      
      instance.resize(256, instance.height);
      replaceNode(target, instance);
      results.push("Replaced Search input");
    } else {
      results.push("Search input text node not found");
    }
  } catch (e) {
    results.push(`Error replacing Search input: ${e.message}`);
  }

  // 2. Header avatar
  try {
    const textNode = root.findOne(n => n.type === "TEXT" && n.characters === "A" && n.parent && n.parent.parent && n.parent.parent.parent && n.parent
<truncated 7848 bytes>