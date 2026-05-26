(async () => {
  try {
    const leftSidebar = await figma.getNodeByIdAsync('42:570');
    const rightSidebar = await figma.getNodeByIdAsync('42:267');

    const leftBorders = leftSidebar.findAll(n => n.name === 'Overlay+Border');
    const rightBorders = rightSidebar.findAll(n => n.name === 'Overlay+Border');

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

    console.log("LEFT_BORDERS:", JSON.stringify(leftBorders.map(getChildrenSummary)));
    console.log("RIGHT_BORDERS:", JSON.stringify(rightBorders.map(getChildrenSummary)));

  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()