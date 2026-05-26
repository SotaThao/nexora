(async () => {
  const profile = await figma.getNodeByIdAsync("42:665");
  if (!profile) {
    console.log("Profile not found");
    return;
  }
  
  const fillsBound = profile.getBoundVariableForPaint ? profile.getBoundVariableForPaint("fills") : null;
  console.log("Profile fillsBound:", fillsBound ? { id: fillsBound.id, name: fillsBound.name } : "none");
  console.log("Profile fills:", JSON.stringify(profile.fills));
  
  // Let's also check resolved values inside the instance if we can
  const children = profile.children || [];
  console.log("Profile children:", children.map(c => `${c.name} (${c.id}) fills: ${JSON.stringify(c.fills)}`));
})()