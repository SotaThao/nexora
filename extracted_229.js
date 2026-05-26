const betterRoot = await figma.getNodeByIdAsync("42:45");
const ourRoot = await figma.getNodeByIdAsync("37:405");

if (!betterRoot) return { error: "Better root not found" };

// Find SideNavBar in both
const betterSidebar = betterRoot.findOne(n => n.name === "SideNavBar");
const ourSidebar = ourRoot.findOne(n => n.name === "SideNavBar");

const getInfo = (node) => {
  if (!node) return null;
  return {
    id: node.id,
    name: node.name,
    fills: node.fills,
    explicitModeId: node.explicitModeId || null,
    // Check mode override if it's set in Figma API:
    // In Figma, a node can have explicitVariableModes
    explicitVariableModes: node.explicitVariableModes || null
  };
};

return {
  betterSidebar: getInfo(betterSidebar),
  ourSidebar: getInfo(ourSidebar)
};