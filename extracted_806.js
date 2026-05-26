const link1 = await figma.getNodeByIdAsync('50:2130'); // Dashboard
const link2 = await figma.getNodeByIdAsync('50:2135'); // Staff

const t1 = link1.findOne(n => n.type === 'TEXT');
const t2 = link2.findOne(n => n.type === 'TEXT');

return {
  t1: t1 ? { characters: t1.characters, fills: t1.fills } : null,
  t2: t2 ? { characters: t2.characters, fills: t2.fills } : null
};
