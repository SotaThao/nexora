const source = await figma.getNodeByIdAsync("42:45");
const target = await figma.getNodeByIdAsync("37:405");

if (!source || !target) return { error: "Nodes not found" };

// Clear target children
for (const child of target.children) {
  child.remove();
}

// Clone children from source and append to target
for (const child of source.children) {
  const clone = child.clone();
  target.appendChild(clone);
}

return { success: true };