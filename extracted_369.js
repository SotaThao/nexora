(async () => {
  const surfaceVar = await figma.variables.getVariableByIdAsync("VariableID:3:182");
  if (!surfaceVar) {
    console.log("surfaceVar not found");
    return;
  }
  
  console.log("Current valuesByMode:", JSON.stringify(surfaceVar.valuesByMode));
  
  // Update Light Mode (3:0)
  const valLight = surfaceVar.valuesByMode["3:0"];
  if (valLight && typeof valLight === "object") {
    const newVal = { ...valLight, a: 1 };
    surfaceVar.setValueForMode("3:0", newVal);
    console.log("Updated Light Mode to:", JSON.stringify(newVal));
  }
  
  // Update Dark Mode (3:1)
  const valDark = surfaceVar.valuesByMode["3:1"];
  if (valDark && typeof valDark === "object") {
    const newVal = { ...valDark, a: 1 };
    surfaceVar.setValueForMode("3:1", newVal);
    console.log("Updated Dark Mode to:", JSON.stringify(newVal));
  }
})()