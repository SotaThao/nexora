(async () => {
  const leftBg = await figma.getNodeByIdAsync("42:383");
  const rightBg = await figma.getNodeByIdAsync("42:80");
  
  console.log("LEFT Background (42:383) cornerRadius:", leftBg ? leftBg.cornerRadius : "not found");
  console.log("RIGHT Background (42:80) cornerRadius:", rightBg ? rightBg.cornerRadius : "not found");
  
  // Let's print other layout properties for both
  if (leftBg) {
    console.log("LEFT Background layout:", {
      x: leftBg.x, y: leftBg.y, width: leftBg.width, height: leftBg.height,
      boundVariables: leftBg.boundVariables ? Object.keys(leftBg.boundVariables) : null
    });
  }
  if (rightBg) {
    console.log("RIGHT Background layout:", {
      x: rightBg.x, y: rightBg.y, width: rightBg.width, height: rightBg.height,
      boundVariables: rightBg.boundVariables ? Object.keys(rightBg.boundVariables) : null
    });
  }
})()