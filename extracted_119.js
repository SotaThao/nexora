const node = await figma.getNodeByIdAsync("I42:14;3:481");
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type, characters: c.type === "TEXT" ? c.characters : null }));