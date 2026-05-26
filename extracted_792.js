const mockup = await figma.getNodeByIdAsync('42:45');
if (!mockup) return 'Mockup 42:45 not found';
return {
  name: mockup.name,
  children: mockup.children.map(c => ({ id: c.id, name: c.name, type: c.type }))
};
