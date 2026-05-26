const starComp = await figma.getNodeByIdAsync("3:529");
if (!starComp) return { error: "Rating Stars not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(starComp);