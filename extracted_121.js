const instance = await figma.getNodeByIdAsync("42:14");
return {
  componentProperties: instance.componentProperties,
  overrides: instance.overrides
};