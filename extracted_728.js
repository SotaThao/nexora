const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
const nexoraColl = localCollections.find(c => c.name === 'Nexora System');
if (!nexoraColl) return 'Nexora System collection not found';

const localVariables = await figma.variables.getLocalVariablesAsync();
const nexoraVars = localVariables.filter(v => v.variableCollectionId === nexoraColl.id);

const nameToId = {};
nexoraVars.forEach(v => {
  nameToId[v.name] = v.id;
});

return {
  collectionId: nexoraColl.id,
  variables: nameToId
};
