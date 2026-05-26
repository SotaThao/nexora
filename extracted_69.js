const node = await figma.getNodeByIdAsync("37:509");
if (!node) return { error: "Text node not found" };
return { parentId: node.parent.id, parentName: node.parent.name, siblings: node.parent.children.map(c => ({ id: c.id, name: c.name, type: c.type })) };