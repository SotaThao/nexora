// Load components
const btnComp = await figma.getNodeByIdAsync('3:475');
const inputComp = await figma.getNodeByIdAsync('3:499');
const avatarComp = await figma.getNodeByIdAsync('8:72');
const progressBarComp = await figma.getNodeByIdAsync('3:506');
const badgeComp = await figma.getNodeByIdAsync('3:508');

const mockupAvatar = await figma.getNodeByIdAsync('42:332');
const mockupBtn = await figma.getNodeByIdAsync('42:346');

const result = [];

function createInstanceFromSet(compSet, properties = {}) {
  if (compSet.type === 'COMPONENT') {
    return compSet.createInstance();
  }
  let matchedComponent = null;
  if (Object.keys(properties).length > 0) {
    const propStrings = Object.entries(properties).map(([k, v]) => `${k}=${v}`);
    matchedComponent = compSet.children.find(child => {
      const childProps = child.name.split(',').map(s => s.trim());
      return propStrings.every(ps => childProps.includes(ps));
    });
  }
  if (!matchedComponent) {
    matchedComponent = compSet.defaultVariant || compSet.children[0];
  }
  return matchedComponent.createInstance();
}

async function setCharactersWithFont(textNode, characters) {
  const fontName = textNode.fontName;
  if (fontName === figma.mixed) {
    const len = textNode.characters.length;
    for (let i = 0; i < len; i++) {
      const font = textNode.getRangeFontName(i, i + 1);
      if (font && font !== figma.mixed) {
        await figma.loadFontAsync(font);
      }
    }
  } else {
    await figma.loadFontAsync(fontName);
  }
  textNode.characters = characters;
}

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
  
  parent.insertBefore(instanc
<truncated 3231 bytes>