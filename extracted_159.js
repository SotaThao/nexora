const instance = await figma.getNodeByIdAsync("42:20");
const detached = instance.detachInstance();
const textNode = detached.findOne(n => n.type === "TEXT");
const chars = textNode.characters;
detached.remove();
return chars;