const node = await figma.getNodeByIdAsync('48:428');
if (!node) return 'Form Card not found';
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
