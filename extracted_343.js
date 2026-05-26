(async () => {
  const f1 = await figma.getNodeByIdAsync("37:405");
  const f2 = await figma.getNodeByIdAsync("42:45");
  console.log("37:405 position:", f1 ? { x: f1.x, y: f1.y } : "not found");
  console.log("42:45 position:", f2 ? { x: f2.x, y: f2.y } : "not found");
})()