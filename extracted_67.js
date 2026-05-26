const dashboard = await figma.getNodeByIdAsync("37:405");
const leaderboardNode = dashboard.findOne(n => n.name === "Nail Tech Leaderboard");
if (!leaderboardNode) return { error: "Nail Tech Leaderboard not found" };

function getTree(node) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (node.children) {
    result.children = node.children.map(getTree);
  }
  return result;
}
return getTree(leaderboardNode);