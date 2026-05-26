(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    
    // Let's find the avatar inside the header
    const avatar = leftNode.findOne(n => n.name === 'Background' && n.parent && n.parent.name === 'Margin');
    if (!avatar) {
      console.log("AVATAR_NOT_FOUND");
    } else {
      console.log("AVATAR_INFO:", JSON.stringify({
        id: avatar.id,
        name: avatar.name,
        type: avatar.type,
        fills: avatar.fills.map(f => ({
          type: f.type,
          color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
          boundVariables: f.boundVariables ? Object.keys(f.boundVariables).reduce((acc, k) => {
            acc[k] = {
              id: f.boundVariables[k].id,
              type: f.boundVariables[k].type
            };
            return acc;
          }, {}) : null
        }))
      }));
    }

    // Let's find the mode set on the target frame
    console.log("TARGET_FRAME_EXPLICIT_MODES:", JSON.stringify(leftNode.explicitVariableModes));

  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()