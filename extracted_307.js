(async () => {
  const ids = {
    left: ["42:349"], // Left Main Content Wrapper
    right: ["42:46"] // Right Main Content Wrapper
  };
  
  async function inspectCards(wrapperId, label) {
    const wrapper = await figma.getNodeByIdAsync(wrapperId);
    if (!wrapper) {
      console.log(label, "not found");
      return;
    }
    
    // Find all nodes in the wrapper with "shadow" in name or cards
    const cards = [];
    function traverse(node) {
      if (node.name.includes("Top Touch Points") || node.name.includes("Review Routing") || node.name.includes("Live Activity") || node.name.includes("Tips Over Time") || node.name.includes("Nail Tech Leaderboard") || node.name.includes("KPI")) {
        cards.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(wrapper);
    
    console.log(`=== CARDS FOR ${label} ===`);
    for (const card of cards) {
      const fills = (card.fills || []).map(f => {
        if (f.type === "SOLID") {
          const hex = "#" + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
          const boundVar = card.getBoundVariableForPaint ? card.getBoundVariableForPaint("fills") : null;
          return `SOLID ${hex} (op:${f.opacity ?? 1})${boundVar ? ` bound:${boundVar.id}` : ""}`;
        }
        return f.type;
      }).join(", ");
      
      const boundSpacing = {
        paddingTop: card.getBoundVariableForLayout ? card.getBoundVariableForLayout("paddingTop") : null,
        paddingRight: card.getBoundVariableForLayout ? card.getBoundVariableForLayout("paddingRight") : null,
        paddingBottom: card.getBoundVariableForLayout ? card.getBoundVariableForLayout("paddingBottom") : null,
        paddingLeft: card.getBoundVariableForLayout ? card.getBoundVariableForLayout("paddingLeft") : null,
        itemSpacing: card.g
<truncated 887 bytes>