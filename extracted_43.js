const sideBar = await figma.getNodeByIdAsync("37:627");
function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(sideBar);