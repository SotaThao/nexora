(async () => {
  const btnCompSet = await figma.getNodeByIdAsync("3:475");
  if (!btnCompSet) {
    console.log("Button Component Set 3:475 not found");
    return;
  }
  
  console.log("Button Component Set name:", btnCompSet.name);
  if (btnCompSet.children) {
    console.log("Button components:", btnCompSet.children.map(c => `${c.name} (${c.id})`));
  }
})()