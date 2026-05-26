const comp = await figma.getNodeByIdAsync("3:483");
if (!comp) return { error: "Input Field State=Default not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(comp);