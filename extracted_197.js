const node = await figma.getNodeByIdAsync("37:425");
const parent = node.parent;
return parent.children.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  x: c.x,
  y: c.y,
  width: c.width,
  height: c.height,
  visible: c.visible
}));