const parent = await figma.getNodeByIdAsync('48:1712');
const oldSidebar = await figma.getNodeByIdAsync('48:1954');
const mockupSidebar = await figma.getNodeByIdAsync('42:267');

if (!parent || !oldSidebar || !mockupSidebar) {
  return { success: false, msg: 'Parent, old sidebar, or mockup sidebar not found' };
}

const clone = mockupSidebar.clone();
parent.appendChild(clone);
clone.layoutPositioning = 'ABSOLUTE';
clone.x = 0;
clone.y = 0;
clone.resize(clone.width, parent.height);

oldSidebar.remove();
return { success: true };
