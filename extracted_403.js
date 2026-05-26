(async () => {
  const fLeft = await figma.getNodeByIdAsync("37:405");
  const fRight = await figma.getNodeByIdAsync("42:45");
  
  function findFills(node, label) {
    const results = [];
    function traverse(n) {
      if (n.fills && n.fills.length > 0) {
        for (const f of n.fills) {
          if (f.type === "SOLID") {
            const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
            results.push({ id: n.id, name: n.name, type: n.type, hex, opacity: f.opacity ?? 1 });
          }
        }
      }
      if (n.children) {
        for (const child of n.children) {
          traverse(child);
        }
      }
    }
    traverse(node);
    console.log(`=== SOLID FILLS IN ${label} ===`);
    console.log(results.map(r => `${r.name} (${r.id}, type: ${r.type}) color: ${r.hex} (op:${r.opacity})`).join("\n"));
  }
  
  findFills(fLeft, "LEFT (37:405)");
  findFills(fRight, "RIGHT (42:45)");
})()