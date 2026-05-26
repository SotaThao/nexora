const node = await figma.getNodeByIdAsync("3:472");
return {
  characters: node.characters,
  propRefs: node.componentPropertyReferences
};