const node = await figma.getNodeByIdAsync('48:417');
if (!node) return 'Container 48:417 not found';
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
