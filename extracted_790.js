const node = await figma.getNodeByIdAsync('50:2064');
return node ? node.fills : 'not found';
