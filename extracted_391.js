(async () => {
  const avatarCompSet = await figma.getNodeByIdAsync("8:72");
  if (!avatarCompSet) {
    console.log("Avatar Component Set 8:72 not found");
    return;
  }
  
  console.log("Avatar Component Set name:", avatarCompSet.name);
  console.log("Avatar Component Set type:", avatarCompSet.type);
  if (avatarCompSet.children) {
    console.log("Avatar components:", avatarCompSet.children.map(c => `${c.name} (${c.id})`));
  }
})()