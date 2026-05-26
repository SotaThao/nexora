const page = figma.currentPage;
const rootNodes = page.children.map(c => ({ id: c.id, name: c.name, type: c.type, x: c.x, y: c.y }));
return rootNodes;
