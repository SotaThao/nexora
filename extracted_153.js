const node = await figma.getNodeByIdAsync("42:20");
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type, characters: c.type === "TEXT" ? c.characters : null, visible: c.visible }));