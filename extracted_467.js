(async () => {
  try {
    const comp = await figma.getNodeByIdAsync('3:483');
    if (!comp) {
      console.log("NOT_FOUND: 3:483");
      return;
    }
    
    function getDetails(node) {
      const details = {
        id: node.id,
        name: node.name,
        type: node.type,
      };
      if (node.fills && node.fills.length > 0) {
        details.fills = node.fills.map(f => ({
          type: f.type,
          color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
          opacity: f.opacity,
          boundVariables: f.boundVariables ? Object.keys(f.boundVariables) : []
        }));
      }
      if (node.children) {
        details.children = node.children.map(getDetails);
      }
      return details;
    }

    console.log("DEFAULT_INPUT_DETAILS:", JSON.stringify(getDetails(comp)));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()