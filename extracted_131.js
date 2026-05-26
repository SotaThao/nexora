const instance = await figma.getNodeByIdAsync("42:14");
figma.currentPage.selection = [instance];
figma.viewport.scrollAndZoomIntoView([instance]);
const node = await figma.getNodeByIdAsync("I42:14;3:482");
await figma.loadFontAsync(node.fontName);
node.characters = "Search tech, station, review...";
return { selected: true, characters: node.characters };