const designSystemPage = figma.root.children.find(p => p.name === "Design system" || p.id === "0:1");
if (!designSystemPage) return { error: "Design system page not found" };
const components = designSystemPage.findAll(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
return components.map(c => ({ id: c.id, name: c.name, type: c.type }));