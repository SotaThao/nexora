const components = figma.currentPage.findAll(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
return components.map(c => ({ id: c.id, name: c.name, type: c.type }));