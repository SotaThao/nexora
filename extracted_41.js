const sideBar = await figma.getNodeByIdAsync("37:627");
if (!sideBar) return { error: "SideNavBar not found" };

return {
  id: sideBar.id,
  name: sideBar.name,
  type: sideBar.type,
  children: sideBar.children.map(c => ({ id: c.id, name: c.name, type: c.type }))
};