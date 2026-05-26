(async () => {
  try {
    const nodeIds = ['48:1712', '48:20', '48:349', '48:536'];
    const results = [];
    
    for (const id of nodeIds) {
      const node = await figma.getNodeByIdAsync(id);
      if (node) {
        // Find which page the node belongs to
        let parentNode = node.parent;
        let pageName = 'Unknown';
        while (parentNode) {
          if (parentNode.type === 'PAGE') {
            pageName = parentNode.name;
            break;
          }
          parentNode = parentNode.parent;
        }
        
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          page: pageName,
          childrenCount: node.children ? node.children.length : 0
        });
      } else {
        results.push({ id, exists: false });
      }
    }
    
    console.log("NODES_CHECK_RESULT:", JSON.stringify(results));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()