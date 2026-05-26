const components = [];
for (const page of figma.root.children) {
  const pageComps = page.findAll(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
  components.push(...pageComps.map(c => ({ id: c.id, name: c.name, type: c.type, page: page.name })));
}
return components;