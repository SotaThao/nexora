(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    
    // Let's find all instances of components in the tree
    const avatars = [];
    
    function traverse(node) {
      if (node.type === 'INSTANCE') {
        const compName = node.mainComponent ? node.mainComponent.name : 'Unknown';
        if (compName.includes('Avatar') || node.name.includes('Avatar') || node.name.includes('Profile')) {
          avatars.push({
            id: node.id,
            name: node.name,
            compName: compName,
            parentName: node.parent ? node.parent.name : null,
            fills: (node.fills || []).map(f => ({
              type: f.type,
              color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
              boundVariables: f.boundVariables ? Object.keys(f.boundVariables) : []
            }))
          });
        }
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    
    traverse(leftNode);
    console.log("ALL_AVATARS:", JSON.stringify(avatars));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()