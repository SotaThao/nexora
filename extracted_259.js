const root = await figma.getNodeByIdAsync("37:405");
if (!root) return { error: "Root not found" };

const textNodes = root.findAll(n => n.type === "TEXT");
return textNodes.map(t => {
  let path = [t.name];
  let p = t.parent;
  while (p && p.id !== root.id) {
    path.unshift(p.name);
    p = p.parent;
  }
  return {
    id: t.id,
    characters: t.characters,
    path: path.join(" → ")
  };
}).filter(t => t.characters.includes("Add") || t.characters === "A" || t.characters === "B" || t.characters === "MT" || t.characters === "VL" || t.characters === "AP" || t.characters === "Manage Plan");