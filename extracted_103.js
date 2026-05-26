async function runReplacements() {
  const results = [];

  // Helper to replace node
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

  // 1. Search input (37:409) -> Input Field (3:483)
  try {
    const target = await figma.getNodeByIdAsync("37:409");
    if (target) {
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
      results.push("Search input 37:409 not found");
    }
  } catch (e) {
    results.push(`Error replacing Search input: ${e.message}`);
  }

  // 2. Header avatar (37:423) -> Avatar Medium (8:64)
  try {
    const target = await figma.getNodeByIdAsync("37:423");
    if (target) {
      const comp = await figma.getNodeByIdAsync("8:64");
      const instance = comp.createInstance();
      
      const text = instance.findOne(n => n.type === "TEXT");
      if (text) {
        await figma.loadFontAsync(text.f
<truncated 4622 bytes>