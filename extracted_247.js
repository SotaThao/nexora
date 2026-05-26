const frame = await figma.getNodeByIdAsync("33:229");
if (!frame) return { error: "Frame 33:229 not found" };

return frame.children.map(c => ({ id: c.id, name: c.name, type: c.type }));