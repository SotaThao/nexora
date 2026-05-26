const section = await figma.getNodeByIdAsync("3:358");
if (!section) return { error: "Assembled Screens section not found" };

return section.children.map(c => ({ id: c.id, name: c.name, type: c.type }));