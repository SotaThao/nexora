(async () => {
  try {
    const mockup = await figma.getNodeByIdAsync('42:45');
    if (!mockup) {
      console.log("MOCKUP_NOT_FOUND");
      return;
    }

    const colorRoles = {};

    function traverse(node) {
      if (node.fills && node.fills.length > 0) {
        node.fills.forEach(f => {
          if (f.type === 'SOLID') {
            const hex = rgbToHex(f.color);
            const key = `${hex}_op_${Math.round(f.opacity * 100) / 100}`;
            if (!colorRoles[key]) colorRoles[key] = [];
            colorRoles[key].push({
              nodeName: node.name,
              nodeId: node.id,
              nodeType: node.type,
              property: 'fill'
            });
          }
        });
      }
      if (node.strokes && node.strokes.length > 0) {
        node.strokes.forEach(s => {
          if (s.type === 'SOLID') {
            const hex = rgbToHex(s.color);
            const key = `${hex}_op_${Math.round(s.opacity * 100) / 100}`;
            if (!colorRoles[key]) colorRoles[key] = [];
            colorRoles[key].push({
              nodeName: node.name,
              nodeId: node.id,
              nodeType: node.type,
              property: 'stroke'
            });
          }
        });
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    function rgbToHex({r, g, b}) {
      const toHex = val => {
        const hex = Math.round(val * 255).toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
      };
      return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    traverse(mockup);

    console.log("MOCKUP_COLORS:", JSON.stringify(colorRoles));

  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()