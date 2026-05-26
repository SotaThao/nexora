const canvas = await figma.getNodeByIdAsync("37:428");
if (!canvas) return { error: "Dashboard Canvas not found" };
return canvas.children.map(c => ({ id: c.id, name: c.name, type: c.type, children: c.children ? c.children.map(cc => ({ id: cc.id, name: cc.name, type: cc.type })) : [] }));