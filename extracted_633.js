(async () => {
  try {
    const nodeIds = ['48:1712', '48:20', '48:349', '48:536'];
    const auditResults = {};

    for (const id of nodeIds) {
      const rootNode = await figma.getNodeByIdAsync(id);
      if (!rootNode) {
        auditResults[id] = { exists: false };
        continue;
      }

      const issues = [];
      let totalNodes = 0;
      let autoLayoutFrames = 0;
      let nonAutoLayoutFrames = 0;
      let boundFills = 0;
      let unboundFills = 0;
      let boundStrokes = 0;
      let unboundStrokes = 0;
      let boundSpacings = 0;
      let unboundSpacings = 0;
      let boundRadii = 0;
      let unboundRadii = 0;
      let rawFauxComponents = 0; // Raw shapes mimicking buttons, inputs, etc.

      async function auditNode(node, path = '') {
        totalNodes++;
        const currentPath = path ? `${path} > ${node.name}` : node.name;

        // 1. Auto Layout Check for Frames
        if (node.type === 'FRAME') {
          if (node.layoutMode && node.layoutMode !== 'NONE') {
            autoLayoutFrames++;
            
            // Check spacing and padding bindings
            const spacingProps = ['itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
            spacingProps.forEach(prop => {
              if (node[prop] !== undefined && node[prop] > 0) {
                if (node.boundVariables && node.boundVariables[prop]) {
                  boundSpacings++;
                } else {
                  unboundSpacings++;
                  // Only report large or suspicious unbound spacings to avoid spam
                  if (node[prop] !== 0 && node[prop] !== 4 && node[prop] !== 8 && node[prop] !== 12 && node[prop] !== 16 && node[prop] !== 24 && node[prop] !== 32 && node[prop] !== 40 && node[prop] !== 80 && node[prop] !== 120) {
                    issues.push({
                      path: currentPath,
                      type: 'UNBOUND_SPACING',
                      detail: `${prop} = ${node[prop]}px is
<truncated 4501 bytes>