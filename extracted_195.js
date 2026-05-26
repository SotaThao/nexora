const instances = figma.currentPage.findAll(n => n.type === "INSTANCE");
const results = [];
for (const inst of instances) {
  const mainComp = await inst.getMainComponentAsync();
  if (mainComp && (mainComp.id === "3:471" || mainComp.id === "3:473" || (mainComp.parent && mainComp.parent.id === "3:475"))) {
    const textNode = inst.findOne(n => n.type === "TEXT");
    results.push({
      id: inst.id,
      name: inst.name,
      parentName: inst.parent ? inst.parent.name : null,
      parentId: inst.parent ? inst.parent.id : null,
      x: inst.x,
      y: inst.y,
      width: inst.width,
      height: inst.height,
      characters: textNode ? textNode.characters : null
    });
  }
}
return results;