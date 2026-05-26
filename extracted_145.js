const primaryComp = await figma.getNodeByIdAsync("3:471");
const secondaryComp = await figma.getNodeByIdAsync("3:473");
return {
  primaryRefs: primaryComp ? primaryComp.componentPropertyReferences : null,
  secondaryRefs: secondaryComp ? secondaryComp.componentPropertyReferences : null
};