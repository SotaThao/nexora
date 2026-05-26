(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    const rightNode = await figma.getNodeByIdAsync('42:45');

    async function getNodeTree(node) {
      if (!node) return null;
      const data = {
        id: node.id,
        name: node.name,
        type: node.type,
      };

      if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE') {
        const children = [];
        if (node.children) {
          for (const child of node.children) {
            children.push(await getNodeTree(child));
          }
        }
        data.children = children;
      }
      
      // Let's add some visual traits
      if (node.fills && node.fills.length > 0) {
        data.fills = node.fills.map(f => {
          if (f.type === 'SOLID') {
            return {
              type: f.type,
              color: `rgb(${Math.round(f.color.r * 255)}, ${Math.round(f.color.g * 255)}, ${Math.round(f.color.b * 255)})`,
              opacity: f.opacity,
              boundVariables: f.boundVariables ? Object.keys(f.boundVariables) : []
            };
          }
          return { type: f.type };
        });
      }
      if (node.type === 'INSTANCE') {
        data.componentName = node.mainComponent ? node.mainComponent.name : 'Unknown';
        data.componentId = node.mainComponent ? node.mainComponent.id : '';
        data.componentProperties = node.componentProperties;
      }
      return data;
    }

    const leftTree = await getNodeTree(leftNode);
    const rightTree = await getNodeTree(rightNode);

    // Let's trace nodes by path and compare
    function compareTrees(left, right, path = '') {
      const currentPath = path ? `${path} > ${left.name}` : left.name;
      const diffs = [];

      if (left.type !== right.type) {
        diffs.push({
          path: currentPath,
          type: 'TYPE_MISMATCH',
          left: left.type,
          right: right.type
        });
      }

      if (left.
<truncated 2247 bytes>