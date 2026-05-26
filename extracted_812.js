const row = await figma.getNodeByIdAsync('48:146');
if (!row) return 'not found';
return row.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
