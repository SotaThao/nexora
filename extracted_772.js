const testFrame = figma.createFrame();
testFrame.layoutMode = 'HORIZONTAL';
const variableId = 'VariableID:3:193'; // spacing/md
const variable = await figma.variables.getVariableByIdAsync(variableId);

const results = {};

try {
  testFrame.setBoundVariable('itemSpacing', variable);
  results.byObject = { success: true, val: testFrame.boundVariables };
} catch (e) {
  results.byObject = { success: false, error: e.toString() };
}

try {
  testFrame.setBoundVariable('itemSpacing', variableId);
  results.byId = { success: true, val: testFrame.boundVariables };
} catch (e) {
  results.byId = { success: false, error: e.toString() };
}

testFrame.remove();
return results;
