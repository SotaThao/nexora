(async () => {
  const sidebarLeft = await figma.getNodeByIdAsync("42:570");
  const sidebarRight = await figma.getNodeByIdAsync("42:267");
  
  function inspectSidebar(sidebar, label) {
    console.log(`=== SIDEBAR ${label} ===`);
    if (!sidebar) {
      console.log("not found");
      return;
    }
    
    // Find all nodes inside sidebar
    const nodes = [];
    function traverse(node) {
      nodes.push(node);
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(sidebar);
    
    for (const n of nodes) {
      const fills = (n.fills || []).map(f => {
        if (f.type === "SOLID") {
          const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
          const bound = n.getBoundVariableForPaint ? n.getBoundVariableForPaint("fills") : null;
          return `${hex} (op:${f.opacity ?? 1})${bound ? ` bound:${bound.name}` : ""}`;
        }
        return f.type;
      }).join(", ");
      
      const boundVariables = n.boundVariables ? Object.keys(n.boundVariables).map(k => `${k}: ${n.boundVariables[k].id || n.boundVariables[k]}`).join(", ") : "";
      
      if (fills || boundVariables || n.type === "INSTANCE") {
        console.log(`- ${n.name} (${n.id}, type: ${n.type}) | Fills: [${fills}] | BoundVars: [${boundVariables}]`);
      }
    }
  }
  
  inspectSidebar(sidebarLeft, "LEFT (42:570)");
  inspectSidebar(sidebarRight, "RIGHT (42:267)");
})()