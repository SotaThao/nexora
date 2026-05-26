const s1 = await figma.getNodeByIdAsync('48:1954');
const s2 = await figma.getNodeByIdAsync('42:267');
return {
  s1: s1 ? { constraints: s1.constraints, layoutPositioning: s1.layoutPositioning, x: s1.x, y: s1.y, width: s1.width, height: s1.height } : null,
  s2: s2 ? { constraints: s2.constraints, layoutPositioning: s2.layoutPositioning, x: s2.x, y: s2.y, width: s2.width, height: s2.height } : null
};
