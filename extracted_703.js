const ids = ['3:475', '3:499', '3:508', '3:500', '8:72', '3:513', '3:529', '3:524'];
const res = {};
for (const id of ids) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) {
    res[id] = 'Not found';
    continue;
  }
  res[id] = {
    name: node.name,
    type: node.type,
    properties: node.componentPropertyDefinitions || null,
    children: node.type === 'COMPONENT_SET' ? node.children.map(c => ({ id: c.id, name: c.name })) : null
  };
}
return res;
