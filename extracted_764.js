const testFrame = figma.createFrame();
testFrame.layoutMode = 'HORIZONTAL';
const variableId = 'VariableID:3:193'; // spacing/md
const variable = await figma.variables.getVariableByIdAsync(variableId);

const results = {};

try {
  testFrame.boundVariables = {
    itemSpacing: {
      type: 'VARIABLE_ALIAS',
      id: variableId
    }
  };
  results.byIdAlias = { success: true, val: testFrame.boundVariables };
} catch (e) {
  results.byIdAlias = { success: false, error: e.toString() };
}

try {
  testFrame.boundVariables = {
    itemSpacing: variable
  };
  results.byObject = { success: true, val: testFrame.boundVariables };
} catch (e) {
  results.byObject = { success: false, error: e.toString() };
}

testFrame.remove();
return results;
