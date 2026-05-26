const buttonVariants = ["3:471", "3:473"];
const instances = figma.currentPage.findAll(n => n.type === "INSTANCE" && n.mainComponent && buttonVariants.includes(n.mainComponent.id));

return instances.map(inst => {
  const textNode = inst.findOne(n => n.type === "TEXT");
  return {
    id: inst.id,
    name: inst.name,
    parentName: inst.parent ? inst.parent.name : null,
    parentId: inst.parent ? inst.parent.id : null,
    x: inst.x,
    y: inst.y,
    width: inst.width,
    height: inst.height,
    characters: textNode ? textNode.characters : null
  };
});