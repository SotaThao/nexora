const contentArea = await figma.getNodeByIdAsync('48:416');
if (!contentArea) return 'Content Area not found';
return contentArea.children.map(c => ({ id: c.id, name: c.name, type: c.type }));
