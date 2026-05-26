const node = await figma.getNodeByIdAsync("42:20");
return {
  x: node.x,
  y: node.y,
  width: node.width,
  height: node.height,
  visible: node.visible,
  parentId: node.parent ? node.parent.id : null,
  parentName: node.parent ? node.parent.name : null
};