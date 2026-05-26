const cardComp = await figma.getNodeByIdAsync("3:476");
if (!cardComp) return { error: "Card component not found" };

return {
  id: cardComp.id,
  name: cardComp.name,
  type: cardComp.type,
  layoutMode: cardComp.layoutMode,
  itemSpacing: cardComp.itemSpacing,
  paddingLeft: cardComp.paddingLeft,
  paddingRight: cardComp.paddingRight,
  paddingTop: cardComp.paddingTop,
  paddingBottom: cardComp.paddingBottom,
  fills: cardComp.fills,
  strokes: cardComp.strokes,
  cornerRadius: cardComp.cornerRadius,
  effects: cardComp.effects
};