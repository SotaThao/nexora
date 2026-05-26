const parent = await figma.getNodeByIdAsync('48:1712');
if (!parent) return 'not found';
return parent.children.map(c => ({ id: c.id, name: c.name, type: c.type, x: c.x, y: c.y }));
