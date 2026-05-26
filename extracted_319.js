(async () => {
  const leftCanvas = await figma.getNodeByIdAsync("42:371");
  const rightCanvas = await figma.getNodeByIdAsync("42:68");
  
  function inspectCanvasChildren(canvas, label) {
    console.log(`=== CANVAS ${label} ===`);
    if (!canvas || !canvas.children) return;
    for (const child of canvas.children) {
      const fills = (child.fills || []).map(f => {
        if (f.type === "SOLID") {
          const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
          const bound = child.getBoundVariableForPaint ? child.getBoundVariableForPaint("fills") : null;
          return `${hex} (op:${f.opacity ?? 1})${bound ? ` bound:${bound.id}` : ""}`;
        }
        return f.type;
      }).join(", ");
      
      console.log(`- ${child.name} (${child.id}) fills: [${fills}]`);
      if (child.children) {
        for (const gc of child.children) {
          const gcFills = (gc.fills || []).map(f => {
            if (f.type === "SOLID") {
              const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
              const bound = gc.getBoundVariableForPaint ? gc.getBoundVariableForPaint("fills") : null;
              return `${hex} (op:${f.opacity ?? 1})${bound ? ` bound:${bound.name}` : ""}`;
            }
            return f.type;
          }).join(", ");
          console.log(`  - ${gc.name} (${gc.id}) fills: [${gcFills}]`);
        }
      }
    }
  }
  
  inspectCanvasChildren(leftCanvas, "LEFT");
  inspectCanvasChildren(rightCanvas, "RIGHT");
})()