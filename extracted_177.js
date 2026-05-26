const node = await figma.getNodeByIdAsync("37:425");
return {
  layoutMode: node.layoutMode,
  width: node.width,
  height: node.height,
  children: node.children.map(c => ({ id: c.id, name: c.name, type: c.type, x: c.x, y: c.y, width: c.width, height: c.height }))
};