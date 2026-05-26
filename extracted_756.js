const testRect = figma.createRectangle();
const variable = await figma.variables.getVariableByIdAsync('VariableID:3:186'); // color/primary
if (!variable) return 'Variable not found';

try {
  testRect.setBoundVariableForPaint('fills', variable);
  const bound = testRect.getBoundVariableForPaint('fills');
  testRect.remove();
  return { success: true, boundId: bound.id };
} catch (e) {
  testRect.remove();
  return { success: false, error: e.toString() };
}
