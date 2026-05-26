(async () => {
  try {
    const managePlanNode = await figma.getNodeByIdAsync('42:347');
    if (!managePlanNode) {
      console.log("MOCKUP_MANAGE_PLAN_NOT_FOUND");
      return;
    }
    console.log("MOCKUP_MANAGE_PLAN_INFO:", JSON.stringify({
      id: managePlanNode.id,
      name: managePlanNode.name,
      type: managePlanNode.type,
      characters: managePlanNode.characters,
      fills: managePlanNode.fills.map(f => ({
        type: f.type,
        color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
        boundVariables: f.boundVariables ? Object.keys(f.boundVariables) : []
      })),
      fontSize: managePlanNode.fontSize,
      fontName: managePlanNode.fontName,
      letterSpacing: managePlanNode.letterSpacing,
      lineHeight: managePlanNode.lineHeight,
      textCase: managePlanNode.textCase,
      textDecoration: managePlanNode.textDecoration
    }));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()