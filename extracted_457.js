(async () => {
  try {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const localVariables = await figma.variables.getLocalVariablesAsync();

    const collections = localCollections.map(c => ({
      id: c.id,
      name: c.name,
      modes: c.modes,
      defaultModeId: c.defaultModeId
    }));

    const variables = localVariables.map(v => ({
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      valuesByMode: v.valuesByMode,
      variableCollectionId: v.variableCollectionId
    }));

    console.log("FRESH_VARIABLES:", JSON.stringify({ collections, variables }));
  } catch (err) {
    console.error("VARIABLES_ERROR:", err.toString());
  }
})()