const node = await figma.getNodeByIdAsync("I42:40;3:472");
await figma.loadFontAsync(node.fontName);
node.characters = "Add New Touch Point ";
return { characters: node.characters };