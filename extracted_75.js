const cardComp = await figma.getNodeByIdAsync("3:476");
if (!cardComp) return { error: "Card component not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(cardComp);