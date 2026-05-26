const designSystemPage = figma.root.children.find(p => p.name === "Design system" || p.id === "0:1");
if (!designSystemPage) return { error: "Design system page not found" };

const components = designSystemPage.findAll(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
const compDetails = [];

for (const comp of components) {
  if (comp.type === 'COMPONENT_SET') {
    compDetails.push({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      componentProperties: comp.componentPropertyDefinitions,
      variants: comp.children.map(v => ({ id: v.id, name: v.name }))
    });
  } else if (comp.type === 'COMPONENT' && (!comp.parent || comp.parent.type !== 'COMPONENT_SET')) {
    // Top-level component not inside a set
    compDetails.push({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      componentProperties: comp.componentPropertyDefinitions
    });
  }
}
return compDetails;