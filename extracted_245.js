const frame = await figma.getNodeByIdAsync("33:229");
if (!frame) return { error: "Frame 33:229 not found" };

const sidebar = frame.findOne(n => n.name === "SideNavBar");
if (!sidebar) return { error: "SideNavBar not found in 33:229" };

return {
  sidebarId: sidebar.id,
  fills: sidebar.fills,
  explicitVariableModes: sidebar.explicitVariableModes || null
};