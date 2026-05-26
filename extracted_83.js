const tech1 = await figma.getNodeByIdAsync("37:511");
if (!tech1) return { error: "Tech 1 not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.type === "TEXT") {
    result.characters = node.characters;
  }
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(tech1);