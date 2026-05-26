async function runReplacements() {
  const root = await figma.getNodeByIdAsync("37:405");
  if (!root) return { error: "Root node 37:405 not found" };

  const results = [];

  function replaceNode(targetNode, newInstance) {
    const parent = targetNode.parent;
    if (!parent) throw new Error(`Parent not found for node ${targetNode.id}`);
    
    newInstance.x = targetNode.x;
    newInstance.y = targetNode.y;
    newInstance.name = targetNode.name;
    
    if ("layoutAlign" in targetNode) newInstance.layoutAlign = targetNode.layoutAlign;
    if ("layoutGrow" in targetNode) newInstance.layoutGrow = targetNode.layoutGrow;
    
    const index = parent.children.indexOf(targetNode);
    parent.insertChild(index, newInstance);
    
    targetNode.remove();
    return newInstance;
  }

  // Pre-load fonts
  const interRegular = { family: "Inter", style: "Regular" };
  const interBold = { family: "Inter", style: "Bold" };
  await Promise.all([
    figma.loadFontAsync(interRegular),
    figma.loadFontAsync(interBold)
  ]);

  // Load component definitions
  const [compInput, compAvatarM, compBtnP, compBtnS, compAvatarS, compPb] = await Promise.all([
    figma.getNodeByIdAsync("3:483"), // Input field Default
    figma.getNodeByIdAsync("8:64"),  // Avatar Medium Circle
    figma.getNodeByIdAsync("3:471"), // Button Primary
    figma.getNodeByIdAsync("3:473"), // Button Secondary
    figma.getNodeByIdAsync("8:60"),  // Avatar Small Circle
    figma.getNodeByIdAsync("3:506")  // Progress Bar
  ]);

  const whiteVar = await figma.variables.getVariableByIdAsync("VariableID:3:212");
  const primaryVar = await figma.variables.getVariableByIdAsync("VariableID:3:186");

  // Single traversal to locate nodes
  let searchInputText = null;
  let headerAvatarText = null;
  let headerButtonText = null;
  let sidebarProfile = null;
  let sidebarButtonText = null;
  const lbTextNodes = {};

  function findNodes(node) {
    if (node.type ==
<truncated 7153 bytes>