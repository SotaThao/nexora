// Let's load the components first
const btnComp = await figma.getNodeByIdAsync('3:475');
const inputComp = await figma.getNodeByIdAsync('3:499');
const avatarComp = await figma.getNodeByIdAsync('8:72');
const progressBarComp = await figma.getNodeByIdAsync('3:506');
const badgeComp = await figma.getNodeByIdAsync('3:508');

// Also find mockup nodes to clone for sidebar profile and button
const mockupAvatar = await figma.getNodeByIdAsync('42:332');
const mockupBtn = await figma.getNodeByIdAsync('42:346');

const result = [];

async function replaceNode(oldId, newInstanceCreator) {
  const oldNode = await figma.getNodeByIdAsync(oldId);
  if (!oldNode) {
    result.push(`Node ${oldId} not found`);
    return null;
  }
  const parent = oldNode.parent;
  if (!parent) {
    result.push(`Node ${oldId} has no parent`);
    return null;
  }
  const instance = await newInstanceCreator(oldNode);
  if (!instance) return null;
  
  parent.insertBefore(instance, oldNode);
  instance.x = oldNode.x;
  instance.y = oldNode.y;
  if (oldNode.layoutAlign) instance.layoutAlign = oldNode.layoutAlign;
  if (oldNode.layoutGrow !== undefined) instance.layoutGrow = oldNode.layoutGrow;
  
  oldNode.remove();
  result.push(`Replaced node ${oldId} successfully`);
  return instance;
}

// 1. Search Input
await replaceNode('48:1716', (oldNode) => {
  const inst = inputComp.createInstance();
  inst.setProperties({ 'State': 'Default' });
  inst.resize(oldNode.width, oldNode.height);
  // Find internal text nodes to configure placeholder
  const placeholder = inst.findOne(n => n.type === 'TEXT');
  if (placeholder) placeholder.characters = 'Search tech, station, review...';
  return inst;
});

// 2. Header Avatar
await replaceNode('48:1730', (oldNode) => {
  const inst = avatarComp.createInstance();
  inst.setProperties({ 'Size': 'Medium', 'Shape': 'Circle' });
  const text = inst.findOne(n => n.type === 'TEXT');
  if (text) text.characters = 'A';
  return inst;
});

// 3. Header 
<truncated 2178 bytes>