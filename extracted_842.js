const b1 = await figma.getNodeByIdAsync('48:627');
const b2 = await figma.getNodeByIdAsync('48:630');
return {
  b1Fills: b1 ? b1.fills : [],
  b2Fills: b2 ? b2.fills : []
};
