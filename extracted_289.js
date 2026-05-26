(() => {
  const f1 = figma.getNodeById("37:405");
  const f2 = figma.getNodeById("42:45");
  
  function getChildrenSummary(node) {
    if (!node) return "not found";
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      children: (node.children || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        visible: c.visible,
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height
      }))
    };
  }
  
  console.log("F1_SUMMARY:", JSON.stringify(getChildrenSummary(f1)));
  console.log("F2_SUMMARY:", JSON.stringify(getChildrenSummary(f2)));
})()