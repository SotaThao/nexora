const page = figma.root.children.find(p => p.name === "Design system" || p.id === "0:1");
if (!page) return { error: "Design system page not found" };

return page.children.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  x: c.x,
  y: c.y,
  width: c.width,
  height: c.height
}));