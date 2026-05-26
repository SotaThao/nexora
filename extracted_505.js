(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    const instances = [];

    async function traverse(node) {
      if (node.type === 'INSTANCE') {
        const mainComp = await node.getMainComponentAsync();
        const parentSet = mainComp ? mainComp.parent : null;
        instances.push({
          id: node.id,
          name: node.name,
          componentName: mainComp ? mainComp.name : 'Unknown',
          componentSetName: parentSet && parentSet.type === 'COMPONENT_SET' ? parentSet.name : null,
          fills: (node.fills || []).map(f => ({
            type: f.type,
            color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
            boundVariables: f.boundVariables ? Object.keys(f.boundVariables) : []
          }))
        });
      }
      if (node.children) {
        for (const child of node.children) {
          await traverse(child);
        }
      }
    }

    await traverse(leftNode);
    console.log("ALL_INSTANCES:", JSON.stringify(instances));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()