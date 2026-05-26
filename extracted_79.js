const leaderboard = await figma.getNodeByIdAsync("37:506");
if (!leaderboard) return { error: "Leaderboard not found" };

// Find all children that contain "Star" or resemble stars
const starsNodes = leaderboard.findAll(n => n.name.toLowerCase().includes("star") || n.name === "★");
return starsNodes.map(n => ({ id: n.id, name: n.name, type: n.type, parentName: n.parent.name }));