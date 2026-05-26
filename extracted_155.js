const node = await figma.getNodeByIdAsync("I42:20;3:472");
return {
  fontName: node.fontName,
  characters: node.characters
};