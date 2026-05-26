const container = await figma.getNodeByIdAsync("37:510");
if (!container) return { error: "Leaderboard container not found" };

function getTree(node, depth = 0) {
  const result = { id: node.id, name: node.name, type: node.type };
  if (depth < 3 && node.children) {
    result.children = node.children.map(c => getTree(c, depth + 1));
  }
  return result;
}
return getTree(container);