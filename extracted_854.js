const node = await figma.getNodeByIdAsync('48:418');
if (!node) return 'Page Header 48:418 not found';
return node.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
