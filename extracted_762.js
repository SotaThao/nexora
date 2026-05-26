const testFrame = figma.createFrame();
const keys = Object.keys(testFrame);
const boundVarsProp = testFrame.boundVariables;
testFrame.remove();
return { keys: keys.filter(k => k.toLowerCase().includes('variable') || k.toLowerCase().includes('bound')), boundVarsProp };
