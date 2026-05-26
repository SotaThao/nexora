(async () => {
  const f1 = await figma.getNodeByIdAsync("42:349"); // Main Content Wrapper (Left)
  const f2 = await figma.getNodeByIdAsync("42:46");  // Main Content Wrapper (Right)
  
  function dumpNode(node, depth = 0) {
    if (!node) return null;
    const indent = "  ".repeat(depth);
    const fillsInfo = (node.fills || []).map(f => {
      if (f.type === "SOLID") {
        const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
        const boundVar = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("fills") : null;
        return `SOLID ${hex} (op:${f.opacity ?? 1})${boundVar ? ` bound:${JSON.stringify(boundVar)}` : ""}`;
      }
      return f.type;
    }).join(", ");
    
    const strokesInfo = (node.strokes || []).map(s => {
      if (s.type === "SOLID") {
        return "SOLID";
      }
      return s.type;
    }).join(", ");
    
    let info = `${indent}- [${node.type}] ${node.name} (${node.id}) w:${Math.round(node.width)} h:${Math.round(node.height)}`;
    if (fillsInfo) info += ` | Fills: [${fillsInfo}]`;
    if (strokesInfo) info += ` | Strokes: [${strokesInfo}]`;
    if (node.effects && node.effects.length > 0) {
      info += ` | Effects: ${node.effects.map(e => e.type).join(", ")}`;
    }
    if (node.layoutMode && node.layoutMode !== "NONE") {
      info += ` | AutoLayout: ${node.layoutMode} padding(t:${node.paddingTop},r:${node.paddingRight},b:${node.paddingBottom},l:${node.paddingLeft}) gap:${node.itemSpacing}`;
    }
    
    console.log(info);
    
    if (node.children) {
      for (const child of node.children) {
        dumpNode(child, depth + 1);
      }
    }
  }

  console.log("=== DUMP LEFT (42:349) ===");
  dumpNode(f1);
  console.log("=== DUMP RIGHT (42:46) ===");
  dumpNode(f2);
})()