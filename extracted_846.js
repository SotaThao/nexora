const node = await figma.getNodeByIdAsync('48:401');
if (!node) return 'Header - TopNavBar not found';
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
