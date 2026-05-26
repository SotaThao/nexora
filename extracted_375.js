(async () => {
  const collection = await figma.variables.getVariableCollectionByIdAsync("VariableCollectionId:3:180");
  const sidebar = await figma.getNodeByIdAsync("42:570");
  if (!sidebar) {
    console.log("Sidebar 42:570 not found");
    return;
  }
  if (!collection) {
    console.log("Collection not found");
    return;
  }
  
  sidebar.setExplicitVariableModeForCollection(collection, "3:1");
  console.log("Successfully set explicit mode to Dark Mode (3:1) for sidebar 42:570");
})()