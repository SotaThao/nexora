const compSet = await figma.getNodeByIdAsync("3:499");
const comp = await figma.getNodeByIdAsync("3:483");
const instance = await figma.getNodeByIdAsync("42:14");
return {
  compSetProperties: compSet ? compSet.componentPropertyDefinitions : null,
  compReferences: comp ? comp.componentPropertyReferences : null,
  instanceProperties: instance ? instance.componentProperties : null
};