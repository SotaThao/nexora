const comp = await figma.getNodeByIdAsync("8:310");
if (!comp) return { error: "Review Routing Card not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(comp);