const badge = await figma.getNodeByIdAsync("3:508");
if (!badge) return { error: "Badge not found" };

const textNode = badge.findOne(n => n.type === "TEXT");
return {
  fills: badge.fills,
  strokes: badge.strokes,
  cornerRadius: badge.cornerRadius,
  textFills: textNode ? textNode.fills : null
};