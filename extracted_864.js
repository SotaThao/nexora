const btnComp = await figma.getNodeByIdAsync('3:475');
const inputComp = await figma.getNodeByIdAsync('3:499');
const dropdownComp = await figma.getNodeByIdAsync('3:500');

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
  try {
    await figma.loadFontAsync(textNode.fontName);
    textNode.characters = characters;
  } catch(e) {
    result.push(`Failed font load: ${e.toString()}`);
  }
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
  try {
    const instance = await newInstanceCreator(oldNode);
    if (!instance) return null;
    
    const index = parent.children.indexOf(oldNode);
    parent.insertChild(index, instance);
    
    instance.x = oldNode.x;
    instance.y = oldNode.y;
    if (oldNode.layoutAlign) instance.layoutAlign = oldNode.layoutAlign;
    if (oldNode.layoutGrow !== undefined) instance.layoutGrow = oldNode.layoutGrow;
    
    oldNode.remove();
    result.push(`Replaced node ${oldId} successfully`);
    return instance;
  } catch(e) {
    result.push(`Failed replacing node ${oldId}: ${e.toString()}`);

<truncated 5446 bytes>