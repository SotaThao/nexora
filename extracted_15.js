const node = await figma.getNodeByIdAsync("37:405");
if (!node) {
  return { error: "Node not found" };
}
return {
  id: node.id,
  name: node.name,
  type: node.type,
  parentName: node.parent ? node.parent.name : null,
  parentId: node.parent ? node.parent.id : null,
  children: node.children ? node.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : []
};