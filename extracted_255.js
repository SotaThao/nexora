const root = await figma.getNodeByIdAsync("37:405");
if (!root) return { error: "Root node 37:405 not found" };

const map = {};

// Helper to find parent of a text node with specific characters
function findParentOfText(characters) {
  const textNode = root.findOne(n => n.type === "TEXT" && n.characters.trim() === characters);
  return textNode ? textNode.parent : null;
}

// 1. Search input: parent of text node "Search tech, station, review..."
const searchInputText = root.findOne(n => n.type === "TEXT" && n.characters.includes("Search tech"));
map.searchInput = searchInputText ? searchInputText.parent.id : null;

// 2. Header avatar: parent of text node "A"
const headerAvatarText = root.findOne(n => n.type === "TEXT" && n.characters === "A");
map.headerAvatar = headerAvatarText ? headerAvatarText.parent.id : null;

// 3. Header button: parent of text node "Add New Touch Point"
const headerButtonText = root.findOne(n => n.type === "TEXT" && n.characters === "Add New Touch Point");
map.headerButton = headerButtonText ? headerButtonText.parent.id : null;

// 4. Sidebar avatar: the frame named "Profile" inside SideNavBar
const sidebarProfile = root.findOne(n => n.name === "Profile" && n.parent && n.parent.name === "Overlay+Border");
map.sidebarAvatar = sidebarProfile ? sidebarProfile.id : null;

// 5. Sidebar button: the frame named "Button" inside "Overlay+Border"
const sidebarButtonText = root.findOne(n => n.type === "TEXT" && n.characters === "Manage Plan");
if (sidebarButtonText) {
  map.sidebarButton = sidebarButtonText.parent.id;
} else {
  // If not found, look for button inside the sidebar plan box
  const planBox = root.findOne(n => n.name === "Overlay+Border" && n.parent && n.parent.parent && n.parent.parent.parent.name === "SideNavBar");
  if (planBox) {
    const btn = planBox.findOne(n => n.name === "Button");
    map.sidebarButton = btn ? btn.id : null;
  }
}

// 6. Leaderboard Avatars & Pbs
const lb = {};

<truncated 633 bytes>