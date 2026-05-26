(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    const rightNode = await figma.getNodeByIdAsync('42:45');

    function getShortNodeInfo(node) {
      if (!node) return null;
      const info = {
        id: node.id,
        name: node.name,
        type: node.type,
      };
      if (node.type === 'INSTANCE') {
        info.mainComponent = {
          id: node.mainComponent.id,
          name: node.mainComponent.name
        };
        info.componentProperties = node.componentProperties;
      }
      if (node.fills && node.fills.length > 0) {
        info.fills = node.fills.map(f => {
          if (f.type === 'SOLID') {
            return {
              type: f.type,
              color: '#' + f.color.r.toString(16) + f.color.g.toString(16) + f.color.b.toString(16),
              opacity: f.opacity,
              boundVariables: f.boundVariables
            };
          }
          return { type: f.type };
        });
      }
      return info;
    }

    // Let's print the top-level children of both nodes to compare their overall layout.
    const leftChildren = leftNode.children ? leftNode.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : [];
    const rightChildren = rightNode.children ? rightNode.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : [];

    console.log("LEFT_CHILDREN:", JSON.stringify(leftChildren));
    console.log("RIGHT_CHILDREN:", JSON.stringify(rightChildren));

  } catch (err) {
    console.error("COMPARE_ERROR:", err.toString());
  }
})()