(async () => {
  try {
    const profileNode = await figma.getNodeByIdAsync('42:332');
    if (!profileNode) {
      console.log("MOCKUP_PROFILE_NOT_FOUND");
      return;
    }
    console.log("MOCKUP_PROFILE_INFO:", JSON.stringify({
      id: profileNode.id,
      name: profileNode.name,
      type: profileNode.type,
      fills: profileNode.fills.map(f => ({
        type: f.type,
        opacity: f.opacity,
        scaleMode: f.scaleMode
      })),
      children: profileNode.children ? profileNode.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : []
    }));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()