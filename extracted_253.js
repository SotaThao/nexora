const root = await figma.getNodeByIdAsync("37:405");
if (!root) return { error: "Root node 37:405 not found" };

const map = {};

// Helper to find node by name path
function findByPath(node, path) {
  let current = node;
  for (const name of path) {
    if (!current || !current.children) return null;
    current = current.children.find(c => c.name === name);
  }
  return current;
}

// 1. Search input in TopNavBar
// Path: Header - TopNavBar -> Search -> Input
const searchInput = root.findOne(n => n.name === "Input" && n.parent && n.parent.name === "Search");
map.searchInput = searchInput ? searchInput.id : null;

// 2. Header avatar
// Path: Header - TopNavBar -> Margin -> Background (the avatar)
const headerAvatar = root.findOne(n => n.name === "Background" && n.parent && n.parent.name === "Margin" && n.parent.parent && n.parent.parent.name === "Header - TopNavBar");
map.headerAvatar = headerAvatar ? headerAvatar.id : null;

// 3. Header button
// Path: Header - TopNavBar -> Button:margin -> Button
const headerButton = root.findOne(n => n.name === "Button" && n.parent && n.parent.name === "Button:margin" && n.parent.parent && n.parent.parent.name === "Header - TopNavBar");
map.headerButton = headerButton ? headerButton.id : null;

// 4. Sidebar avatar
// Path: SideNavBar -> Margin -> Container -> Overlay+Border -> Profile
const sidebarAvatar = root.findOne(n => n.name === "Profile" && n.parent && n.parent.name === "Overlay+Border" && n.parent.parent && n.parent.parent.parent && n.parent.parent.parent.name === "SideNavBar");
map.sidebarAvatar = sidebarAvatar ? sidebarAvatar.id : null;

// 5. Sidebar button
// Path: SideNavBar -> Margin -> Container -> Overlay+Border -> Button
const sidebarButton = root.findOne(n => n.name === "Button" && n.parent && n.parent.name === "Overlay+Border" && n.parent.parent && n.parent.parent.parent && n.parent.parent.parent.name === "SideNavBar");
map.sidebarButton = sidebarButton ? sidebarButton.id : nu
<truncated 819 bytes>