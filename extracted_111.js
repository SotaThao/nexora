const node = await figma.getNodeByIdAsync("37:405");
const v = await figma.variables.getVariableByIdAsync("VariableID:3:181");
try {
  const fills = node.fills;
  const newFill = figma.variables.setBoundVariableForPaint(fills[0], "color", v);
  node.fills = [newFill];
  return { success: true };
} catch(e) {
  return { error: e.message };
}