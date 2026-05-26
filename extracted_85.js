const node = await figma.getNodeByIdAsync("37:513");
return { width: node.width, height: node.height };