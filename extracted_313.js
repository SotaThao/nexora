(async () => {
  const fLeft = await figma.getNodeByIdAsync("42:349");
  const fRight = await figma.getNodeByIdAsync("42:46");
  
  function getSimpleTree(node) {
    if (!node) return null;
    const res = {
      id: node.id,
      name: node.name,
      type: node.type,
      fills: (node.fills || []).map(f => {
        if (f.type === "SOLID") {
          const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
          const bound = node.getBoundVariableForPaint ? node.getBoundVariableForPaint("fills") : null;
          return `${hex} (op:${f.opacity ?? 1})${bound ? ` bound:${bound.id}` : ""}`;
        }
        return f.type;
      }),
      boundVariables: node.boundVariables ? Object.keys(node.boundVariables).reduce((acc, k) => {
        acc[k] = node.boundVariables[k];
        return acc;
      }, {}) : null
    };
    if (node.children) {
      res.children = node.children.map(c => getSimpleTree(c));
    }
    return res;
  }
  
  // Log specific nodes instead of the whole tree to avoid truncation
  console.log("LEFT_HEADER_CHILDREN:", fLeft.children.map(c => c.name + " (" + c.id + ")"));
  console.log("RIGHT_HEADER_CHILDREN:", fRight.children.map(c => c.name + " (" + c.id + ")"));
  
  // Find card wrappers
  const leftCards = fLeft.findAll(c => ["KPI Cards Row", "Tips Over Time", "Nail Tech Leaderboard", "Bottom Row"].includes(c.name));
  const rightCards = fRight.findAll(c => ["KPI Cards Row", "Tips Over Time", "Nail Tech Leaderboard", "Bottom Row"].includes(c.name));
  
  console.log("LEFT CARDS:");
  for (const c of leftCards) {
    console.log(`- ${c.name} (${c.id}) fills: ${JSON.stringify(c.fills ? c.fills.map(f => f.color ? f.color : f.type) : [])}`);
  }
  console.log("RIGHT CARDS:");
  for (const c of rightCards) {
    console.log(`- ${c.name} (${c.id}) fills: ${JSON.stringify(c.fills ? c.fills.map(f => f.color ? f.co
<truncated 36 bytes>