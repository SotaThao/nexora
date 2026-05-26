const inst1 = await figma.getNodeByIdAsync("42:20");
const inst2 = await figma.getNodeByIdAsync("42:24");
return {
  inst1Props: inst1 ? inst1.componentProperties : null,
  inst2Props: inst2 ? inst2.componentProperties : null
};