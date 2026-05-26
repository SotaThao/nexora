(async () => {
  const frames = figma.currentPage.findAll(n => n.name === "Html → Body");
  return frames.map(f => ({ id: f.id, name: f.name, x: f.x, y: f.y, width: f.width, height: f.height }));
})()