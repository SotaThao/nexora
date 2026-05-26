const node = await figma.getNodeByIdAsync("I42:40;3:472");
return node ? node.characters : "not found";