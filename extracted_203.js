const node = await figma.getNodeByIdAsync("37:406");
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type, x: c.x, y: c.y, width: c.width, height: c.height }));