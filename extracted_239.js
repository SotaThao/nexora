const masterAvatar = await figma.getNodeByIdAsync("8:64");
const textNode = masterAvatar.findOne(n => n.type === "TEXT");
return {
  avatarFills: masterAvatar.fills,
  textFills: textNode ? textNode.fills : null
};