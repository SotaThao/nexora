const frame = await figma.getNodeByIdAsync("33:230");
return {
  fills: frame.fills,
  explicitVariableModes: frame.explicitVariableModes || null
};