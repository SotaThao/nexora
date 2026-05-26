(async () => {
  try {
    const leftSidebar = await figma.getNodeByIdAsync('42:570');
    const rightSidebar = await figma.getNodeByIdAsync('42:267');

    const leftOverlayBorder = leftSidebar.findOne(n => n.name === 'Overlay+Border' && n.parent && n.parent.name === 'Container');
    const rightOverlayBorder = rightSidebar.findOne(n => n.name === 'Overlay+Border' && n.parent && n.parent.name === 'Container');

    function getChildrenSummary(node) {
      if (!node) return "NOT FOUND";
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        children: node.children ? node.children.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          children: c.children ? c.children.map(cc => ({ id: cc.id, name: cc.name, type: cc.type })) : []
        })) : []
      };
    }

    console.log("LEFT_OVERLAY_BORDER:", JSON.stringify(getChildrenSummary(leftOverlayBorder)));
    console.log("RIGHT_OVERLAY_BORDER:", JSON.stringify(getChildrenSummary(rightOverlayBorder)));

  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()