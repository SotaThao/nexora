const parent = await figma.getNodeByIdAsync("37:408");
if (!parent) return { error: "Search parent not found" };

const tree = [];
for (const child of parent.children) {
  tree.push({
    id: child.id,
    name: child.name,
    type: child.type,
    children: child.children ? child.children.map(c => ({ id: c.id, name: c.name, type: c.type, characters: c.type === "TEXT" ? c.characters : null })) : []
  });
}
return tree;