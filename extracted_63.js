const avatarComp = await figma.getNodeByIdAsync("8:64"); // Size=Medium, Shape=Circle
if (!avatarComp) return { error: "Avatar Medium Circle not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(avatarComp);