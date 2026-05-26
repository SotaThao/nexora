const instance = await figma.getNodeByIdAsync("42:40");
instance.setProperties({ Type: "Secondary" });
const text = instance.findOne(n => n.type === "TEXT");
if (text) {
  await figma.loadFontAsync(text.fontName);
  text.characters = "Add New Touch Point";
}
instance.setProperties({ Type: "Primary" });
const text2 = instance.findOne(n => n.type === "TEXT");
if (text2) {
  await figma.loadFontAsync(text2.fontName);
  text2.characters = "Add New Touch Point";
}
return { success: true };