const testRect = figma.createRectangle();
const variableId = 'VariableID:3:186'; // color/primary

try {
  const paint = {
    type: 'SOLID',
    color: { r: 0, g: 0, b: 0 },
    boundVariables: {
      color: {
        type: 'VARIABLE_ALIAS',
        id: variableId
      }
    }
  };
  testRect.fills = [paint];
  
  // Read it back
  const fills = testRect.fills;
  const boundId = fills[0].boundVariables.color.id;
  testRect.remove();
  return { success: true, boundId };
} catch (e) {
  testRect.remove();
  return { success: false, error: e.toString() };
}
