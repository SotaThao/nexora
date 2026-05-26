const parent = await figma.getNodeByIdAsync("37:425");
if (!parent) return { error: "Parent 37:425 not found" };

// Clear any existing children in the parent first to avoid duplicates
for (const child of parent.children) {
  child.remove();
}

const comp = await figma.getNodeByIdAsync("3:471"); // Type=Primary
const instance = comp.createInstance();
parent.appendChild(instance);

instance.name = "Button";
if ("layoutAlign" in parent) instance.layoutAlign = "STRETCH";

const text = instance.findOne(n => n.type === "TEXT");
if (text) {
  await figma.loadFontAsync(text.fontName);
  text.characters = "Add New Touch Point";
}

return {
  success: true,
  id: instance.id,
  characters: text ? text.characters : null
};