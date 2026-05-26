const testFrame = figma.createFrame();
testFrame.layoutMode = 'HORIZONTAL';
const variableId = 'VariableID:3:193'; // spacing/md
const variable = await figma.variables.getVariableByIdAsync(variableId);

const results = {};

try {
  testFrame.setBoundVariableForProperty('itemSpacing', variable);
  results.byObject = { success: true };
} catch (e) {
  results.byObject = { success: false, error: e.toString() };
}

try {
  testFrame.setBoundVariableForProperty('itemSpacing', variableId);
  results.byId = { success: true };
} catch (e) {
  results.byId = { success: false, error: e.toString() };
}

testFrame.remove();
return results;
