(async () => {
  const leftKPI = await figma.getNodeByIdAsync("42:378");
  const rightKPI = await figma.getNodeByIdAsync("42:75");
  
  function dumpChildrenNames(node) {
    if (!node || !node.children) return [];
    return node.children.map(c => `${c.name} (${c.id}, type: ${c.type}, visible: ${c.visible})`);
  }
  
  console.log("LEFT KPI 1 children:", dumpChildrenNames(leftKPI));
  console.log("RIGHT KPI 1 children:", dumpChildrenNames(rightKPI));
  
  // Find child named "Overlay" or containing shapes
  const leftOverlay = leftKPI ? leftKPI.findOne(c => c.name.includes("Overlay") || c.name.includes("Badge") || c.name.includes("Dot")) : null;
  const rightOverlay = rightKPI ? rightKPI.findOne(c => c.name.includes("Overlay") || c.name.includes("Badge") || c.name.includes("Dot")) : null;
  
  function getPaintInfo(node) {
    if (!node) return "not found";
    const fills = (node.fills || []).map(f => {
      if (f.type === "SOLID") {
        const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
        const bound = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("fills") : null;
        return `SOLID ${hex} (op:${f.opacity ?? 1})${bound ? ` bound:${bound.name}` : ""}`;
      }
      return f.type;
    }).join(", ");
    return `${node.name} (${node.id}) type:${node.type} fills:[${fills}] width:${node.width} height:${node.height}`;
  }
  
  console.log("LEFT Overlay info:", getPaintInfo(leftOverlay));
  console.log("RIGHT Overlay info:", getPaintInfo(rightOverlay));
  
  // Let's also print children of the overlay
  if (leftOverlay && leftOverlay.children) {
    console.log("LEFT Overlay children:", leftOverlay.children.map(c => getPaintInfo(c)));
  }
  if (rightOverlay && rightOverlay.children) {
    console.log("RIGHT Overlay children:", rightOverlay.children.map(c => getPaintInfo(c)));
  }
})()