(async () => {
  const f1 = await figma.getNodeByIdAsync("37:405");
  const f2 = await figma.getNodeByIdAsync("42:45");
  
  console.log("37:405 explicitModeDecisions:", f1 ? f1.explicitModeDecisions : "none");
  console.log("42:45 explicitModeDecisions:", f2 ? f2.explicitModeDecisions : "none");
})()