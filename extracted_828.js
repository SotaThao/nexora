const container = await figma.getNodeByIdAsync('48:31');
const bellMock = await figma.getNodeByIdAsync('48:548'); // Bell from grid view
const avatarComp = await figma.getNodeByIdAsync('8:72');

if (!container || !bellMock || !avatarComp) {
  return 'bellMock or avatarComp or container not found';
}

const badAvatar = container.children.find(c => c.type === 'INSTANCE' && c.name.includes('Avatar'));
if (badAvatar) {
  const bellClone = bellMock.clone();
  container.insertBefore(bellClone, badAvatar);
  badAvatar.remove();
}

const oldAvatar = await figma.getNodeByIdAsync('48:35');
if (oldAvatar) {
  const inst = (avatarComp.defaultVariant || avatarComp.children[0]).createInstance();
  inst.setProperties({ 'Size': 'Medium', 'Shape': 'Circle' });
  
  // Load font & set text
  const text = inst.findOne(n => n.type === 'TEXT');
  if (text) {
    await figma.loadFontAsync(text.fontName);
    text.characters = 'A';
  }
  
  const parent = oldAvatar.parent;
  const index = parent.children.indexOf(oldAvatar);
  parent.insertChild(index, inst);
  oldAvatar.remove();
}

return 'Bell restored and avatar replaced correctly!';
