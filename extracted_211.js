const node = await figma.getNodeByIdAsync("3:471");
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));