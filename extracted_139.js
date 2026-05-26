const node = await figma.getNodeByIdAsync("3:482");
return node ? node.characters : "not found";