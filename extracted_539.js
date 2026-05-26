(async () => {
  try {
    const leftSidebar = await figma.getNodeByIdAsync('42:570');
    const borders = leftSidebar.findAll(n => n.name === 'Overlay+Border');
    
    function getSummary(node) {
      return {
        id: node.id,
        name: node.name,
        children: node.children ? node.children.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type
        })) : []
      };
    }
    console.log("ACTUAL_LEFT_BORDERS:", JSON.stringify(borders.map(getSummary)));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()