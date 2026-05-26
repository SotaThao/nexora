(async () => {
  try {
    const componentSets = [];
    const components = [];

    // Traverse the document tree to find components
    function traverse(node) {
      if (node.type === 'COMPONENT_SET') {
        componentSets.push({
          id: node.id,
          name: node.name,
          variants: node.children.map(c => ({ id: c.id, name: c.name }))
        });
      } else if (node.type === 'COMPONENT') {
        // Only add if not part of a component set
        if (node.parent && node.parent.type !== 'COMPONENT_SET') {
          components.push({
            id: node.id,
            name: node.name
          });
        }
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    traverse(figma.root);
    console.log("LIBRARY_COMPONENTS:", JSON.stringify({ componentSets, components }));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()