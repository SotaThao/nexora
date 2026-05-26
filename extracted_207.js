const root = await figma.getNodeByIdAsync("37:405");
const rect = figma.createRectangle();
root.appendChild(rect);
rect.remove();
return { success: true };