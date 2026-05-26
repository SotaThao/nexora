const primaryComp = await figma.getNodeByIdAsync("3:471");
const secondaryComp = await figma.getNodeByIdAsync("3:473");
return {
  primaryDefs: primaryComp ? primaryComp.componentPropertyDefinitions : null,
  secondaryDefs: secondaryComp ? secondaryComp.componentPropertyDefinitions : null,
  primaryRefs: primaryComp ? primaryComp.componentPropertyReferences : null,
  secondaryRefs: secondaryComp ? secondaryComp.componentPropertyReferences : null
};