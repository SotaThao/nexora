const small = await figma.getNodeByIdAsync("8:60");
const medium = await figma.getNodeByIdAsync("8:64");
const large = await figma.getNodeByIdAsync("8:68");
return {
  small: { w: small.width, h: small.height },
  medium: { w: medium.width, h: medium.height },
  large: { w: large.width, h: large.height }
};