const rootNode = await figma.getNodeByIdAsync("37:405");
if (!rootNode) return { error: "Node 37:405 not found" };

const report = [];

function checkBound(node, prop, value, boundObject) {
  if (boundObject) {
    return { status: "bound", value, bound: boundObject };
  } else {
    return { status: "hardcoded", value };
  }
}

async function scan(node, depth = 0) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth,
  };

  if (node.type === "INSTANCE") {
    const mainComponent = await node.getMainComponentAsync();
    info.mainComponent = {
      id: mainComponent ? mainComponent.id : null,
      name: mainComponent ? mainComponent.name : null,
      parentName: (mainComponent && mainComponent.parent) ? mainComponent.parent.name : null
    };
  }

  // Check bindings
  const bindings = {};
  if ("fills" in node && node.fills !== figma.mixed) {
    bindings.fills = node.fills.map((fill, idx) => {
      // For Figma API, bindings are accessed via node.getBoundVariableForPaint or style
      // Let's check getBoundVariableForPaint
      let variable = null;
      try {
        variable = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("fills", idx) : null;
      } catch(e) {}
      let styleId = node.fillStyleId;
      return {
        type: fill.type,
        color: fill.color,
        opacity: fill.opacity,
        variable: variable ? { id: variable.id } : null,
        styleId: styleId || null
      };
    });
  }

  if ("strokes" in node && node.strokes !== figma.mixed) {
    bindings.strokes = node.strokes.map((stroke, idx) => {
      let variable = null;
      try {
        variable = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("strokes", idx) : null;
      } catch(e) {}
      let styleId = node.strokeStyleId;
      return {
        type: stroke.type,
        color: stroke.color,
        variable: variable ? { id: variable.id } : null,
        styleId:
<truncated 865 bytes>