const ma = await figma.getNodeByIdAsync('42:332');
const mb = await figma.getNodeByIdAsync('42:346');
return {
  ma: ma ? { name: ma.name, type: ma.type, width: ma.width, height: ma.height } : 'not found',
  mb: mb ? { name: mb.name, type: mb.type, width: mb.width, height: mb.height } : 'not found'
};
