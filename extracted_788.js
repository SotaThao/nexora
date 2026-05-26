const node = await figma.getNodeByIdAsync('42:332');
return node ? node.fills : 'not found';
