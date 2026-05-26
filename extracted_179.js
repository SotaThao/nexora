const compSet = await figma.getNodeByIdAsync("3:475");
return {
  keys: Object.keys(compSet),
  propDefs: compSet.componentPropertyDefinitions
};