const headerButtonParent = await figma.getNodeByIdAsync("37:425");
const sidebarButtonParent = await figma.getNodeByIdAsync("37:699");

const getInstText = async (parent) => {
  if (!parent) return "parent not found";
  const inst = parent.findOne(n => n.type === "INSTANCE");
  if (!inst) return "instance not found";
  const textNodes = inst.findAll(n => n.type === "TEXT");
  return textNodes.map(t => ({ id: t.id, name: t.name, characters: t.characters, overriddenFields: inst.overrides.find(o => o.id === t.id) }));
};

return {
  headerButton: await getInstText(headerButtonParent),
  sidebarButton: await getInstText(sidebarButtonParent)
};