const rootNode = await figma.getNodeByIdAsync("42:45");
if (!rootNode) return { error: "Root node 42:45 not found" };

const report = [];

async function scan(node, depth = 0) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth,
  };

  const bindings = {};
  if ("fills" in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    bindings.fills = node.fills.map((fill, idx) => {
      let variable = null;
      try {
        variable = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("fills", idx) : null;
      } catch(e) {}
      return {
        type: fill.type,
        color: fill.color,
        variable: variable ? { id: variable.id, name: variable.name } : null
      };
    });
  }

  if ("strokes" in node && node.strokes !== figma.mixed && Array.isArray(node.strokes)) {
    bindings.strokes = node.strokes.map((stroke, idx) => {
      let variable = null;
      try {
        variable = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("strokes", idx) : null;
      } catch(e) {}
      return {
        type: stroke.type,
        color: stroke.color,
        variable: variable ? { id: variable.id, name: variable.name } : null
      };
    });
  }

  const layoutProps = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "itemSpacing", "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
  for (const prop of layoutProps) {
    if (prop in node) {
      let variable = null;
      try {
        variable = node.getBoundVariable ? node.getBoundVariable(prop) : null;
      } catch(e) {}
      if (variable) {
        bindings[prop] = {
          value: node[prop],
          variable: { id: variable.id, name: variable.name }
        };
      }
    }
  }

  if (Object.keys(bindings).length > 0) {
    info.bindings = bindings;
    report.push(info);
  }

  if ("children" in node) {
    for (const child of node.
<truncated 120 bytes>