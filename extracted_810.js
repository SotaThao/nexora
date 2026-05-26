const node = await figma.getNodeByIdAsync('48:147');
if (!node) return 'not found';
return {
  name: node.name,
  type: node.type,
  children: node.children.map(c => ({ id: c.id, name: c.name, type: c.type, fills: c.fills ? c.fills.map(f => f.type) : [] }))
};
