const headerAvatarParent = await figma.getNodeByIdAsync("37:422");
const sidebarAvatarParent = await figma.getNodeByIdAsync("37:691");

const getAvatarInfo = async (parent) => {
  if (!parent) return "parent not found";
  const inst = parent.findOne(n => n.type === "INSTANCE");
  if (!inst) return "instance not found";
  const textNode = inst.findOne(n => n.type === "TEXT");
  return {
    id: inst.id,
    name: inst.name,
    visible: inst.visible,
    textNode: textNode ? {
      id: textNode.id,
      name: textNode.name,
      characters: textNode.characters,
      visible: textNode.visible,
      fills: textNode.fills
    } : null
  };
};

return {
  headerAvatar: await getAvatarInfo(headerAvatarParent),
  sidebarAvatar: await getAvatarInfo(sidebarAvatarParent)
};