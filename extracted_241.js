const section = await figma.getNodeByIdAsync("3:358");
if (!section) return { error: "Assembled Screens section not found" };

const frames = section.children.filter(c => c.type === "FRAME");
const result = [];
for (const frame of frames) {
  const sidebar = frame.findOne(n => n.name === "SideNavBar");
  if (sidebar) {
    result.push({
      frameName: frame.name,
      sidebarId: sidebar.id,
      fills: sidebar.fills,
      explicitVariableModes: sidebar.explicitVariableModes || null
    });
  }
}
return result;