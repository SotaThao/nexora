const node = await figma.getNodeByIdAsync('48:1712');
if (!node) return '48:1712 not found';
return {
  name: node.name,
  type: node.type,
  children: node.children.map(c => ({ id: c.id, name: c.name, type: c.type }))
};
