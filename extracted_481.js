(async () => {
  try {
    const sidebar = await figma.getNodeByIdAsync('42:570');
    const wrapper = await figma.getNodeByIdAsync('42:349');
    const body = await figma.getNodeByIdAsync('37:405');

    function getFillInfo(node) {
      if (!node) return "NOT FOUND";
      return (node.fills || []).map(f => {
        if (f.type === 'SOLID') {
          return {
            color: `rgb(${Math.round(f.color.r * 255)}, ${Math.round(f.color.g * 255)}, ${Math.round(f.color.b * 255)})`,
            opacity: f.opacity,
            boundVariables: f.boundVariables ? Object.keys(f.boundVariables).reduce((acc, k) => {
              acc[k] = f.boundVariables[k].id;
              return acc;
            }, {}) : null
          };
        }
        return { type: f.type };
      });
    }

    console.log("SIDEBAR_FILLS:", JSON.stringify(getFillInfo(sidebar)));
    console.log("WRAPPER_FILLS:", JSON.stringify(getFillInfo(wrapper)));
    console.log("BODY_FILLS:", JSON.stringify(getFillInfo(body)));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()