async function bindTokens() {
  const rootNode = await figma.getNodeByIdAsync("37:405");
  if (!rootNode) return { error: "Root node 37:405 not found" };

  let boundFills = 0;
  let boundStrokes = 0;
  let boundLayout = 0;
  let skipped = 0;

  function findColorVariableId(color, nodeType, opacity) {
    if (color.b > 0.75 && color.r < 0.35 && color.g < 0.4) return "VariableID:3:186";
    if (color.g > 0.6 && color.r < 0.2 && color.b < 0.5) return "VariableID:3:187";
    if (color.r > 0.8 && color.g > 0.5 && color.b < 0.3) return "VariableID:3:188";
    if (color.r > 0.8 && color.g < 0.3 && color.b < 0.3) return "VariableID:3:189";
    if (Math.abs(color.r - 0.9) < 0.05 && Math.abs(color.g - 0.9) < 0.05 && Math.abs(color.b - 0.94) < 0.05) return "VariableID:3:185";
    if (Math.abs(color.r - 0.96) < 0.04 && Math.abs(color.g - 0.97) < 0.04 && Math.abs(color.b - 0.98) < 0.04) return "VariableID:3:181";
    if (color.r > 0.98 && color.g > 0.98 && color.b > 0.98) {
      return nodeType === "TEXT" ? "VariableID:3:212" : "VariableID:3:182";
    }
    if (color.r < 0.06 && color.g < 0.12 && color.b < 0.22) return "VariableID:3:183";
    if (Math.abs(color.r - 0.42) < 0.1 && Math.abs(color.g - 0.47) < 0.1 && Math.abs(color.b - 0.55) < 0.1) return "VariableID:3:184";
    return null;
  }

  function findSpacingVariableId(value, prop) {
    if (prop.toLowerCase().includes("radius")) {
      if (value === 4) return "VariableID:3:196";
      if (value === 8) return "VariableID:3:197";
      if (value === 12) return "VariableID:3:198";
      if (value === 16) return "VariableID:3:199";
      if (value >= 9999) return "VariableID:3:200";
      if (value === 6) return "VariableID:23:210";
    } else {
      if (value === 4) return "VariableID:3:190";
      if (value === 8) return "VariableID:3:191";
      if (value === 12) return "VariableID:3:192";
      if (value === 16) return "VariableID:3:193";
      if (value === 24) return "V
<truncated 4113 bytes>