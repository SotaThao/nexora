// Pre-load common fonts
await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(e => {}),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }).catch(e => {}),
  figma.loadFontAsync({ family: "Inter", style: "Medium" }).catch(e => {}),
  figma.loadFontAsync({ family: "Outfit", style: "Regular" }).catch(e => {}),
  figma.loadFontAsync({ family: "Outfit", style: "Bold" }).catch(e => {}),
  figma.loadFontAsync({ family: "Outfit", style: "Medium" }).catch(e => {})
]);

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
        await figma.loadFontAsync(font).catch(e => {});
      }
    }
  } else 
<truncated 3849 bytes>