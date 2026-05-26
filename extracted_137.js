const compSet = await figma.getNodeByIdAsync("3:499");
return {
  keys: Object.keys(compSet),
  propDefs: compSet.componentPropertyDefinitions
};