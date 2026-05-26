const node = await figma.getNodeByIdAsync('48:22');
if (!node) return 'Header - TopAppBar not found';
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
