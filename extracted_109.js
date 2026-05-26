const node = await figma.getNodeByIdAsync("37:405");
const v = await figma.variables.getVariableByIdAsync("VariableID:3:181");
try {
  node.setBoundVariableForPaint("fills", 0, v);
  return { success: true };
} catch(e) {
  return { error: e.message, stack: e.stack };
}