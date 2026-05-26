const sidebar = await figma.getNodeByIdAsync('48:1954');
return sidebar ? {
  x: sidebar.x,
  y: sidebar.y,
  width: sidebar.width,
  height: sidebar.height,
  layoutPositioning: sidebar.layoutPositioning,
  layoutAlign: sidebar.layoutAlign,
  layoutGrow: sidebar.layoutGrow
} : 'not found';
