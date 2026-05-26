const node = await figma.getNodeByIdAsync("I42:40;3:472");
return {
  characters: node.characters,
  fontName: node.fontName,
  visible: node.visible,
  opacity: node.opacity,
  fills: node.fills,
  boundVariables: node.boundVariables
};