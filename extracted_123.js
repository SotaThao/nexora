const compSet = await figma.getNodeByIdAsync("3:499");
const comp = await figma.getNodeByIdAsync("3:483");
return {
  compSetProperties: compSet ? compSet.componentPropertyDefinitions : null,
  compProperties: comp ? comp.componentPropertyDefinitions : null,
  instanceProperties: (await figma.getNodeByIdAsync("42:14")).componentProperties
};