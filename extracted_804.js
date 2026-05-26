const sidebar = await figma.getNodeByIdAsync('50:2118');
if (!sidebar) return 'not found';

const navContainer = sidebar.findOne(n => n.name === 'Container' && n.parent.name === 'SideNavBar');
if (!navContainer) return 'navContainer not found';

return navContainer.children.map(c => {
  const textNode = c.findOne(n => n.type === 'TEXT');
  const fills = c.fills;
  return {
    id: c.id,
    name: c.name,
    text: textNode ? textNode.characters : 'no text',
    fills: fills ? fills.map(f => ({ type: f.type, color: f.color, opacity: f.opacity })) : []
  };
});
