(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    // Force select the target node
    figma.currentPage.selection = [leftNode];
    console.log("SELECTED_NODE_TO_FORCE_SYNC:", leftNode.id);
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()