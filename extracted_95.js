const badge = await figma.getNodeByIdAsync("3:508");
const progress = await figma.getNodeByIdAsync("3:506");

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.type === "TEXT") result.characters = node.characters;
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}

return {
  badge: badge ? getTree(badge) : null,
  progress: progress ? getTree(progress) : null
};