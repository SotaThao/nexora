const dashboard = await figma.getNodeByIdAsync("37:405");
const routingNode = dashboard.findOne(n => n.name === "Review Routing");
if (!routingNode) return { error: "Review Routing not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(routingNode);