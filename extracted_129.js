const node = await figma.getNodeByIdAsync("I42:14;3:482");
return {
  characters: node.characters,
  fontName: node.fontName
};