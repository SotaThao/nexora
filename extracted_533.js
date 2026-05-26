(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    if (!leftNode) {
      console.error("TARGET_NODE_NOT_FOUND");
      return;
    }

    const varSurface = await figma.variables.getVariableByIdAsync('VariableID:3:182'); // color/surface
    const varBorder = await figma.variables.getVariableByIdAsync('VariableID:3:185'); // color/border
    const varPrimary10 = await figma.variables.getVariableByIdAsync('VariableID:3:285'); // color/primary-10
    const varBg = await figma.variables.getVariableByIdAsync('VariableID:3:181'); // color/bg

    if (!varSurface || !varBorder || !varPrimary10 || !varBg) {
      console.error("VARIABLES_NOT_FOUND", {
        varSurface: !!varSurface,
        varBorder: !!varBorder,
        varPrimary10: !!varPrimary10,
        varBg: !!varBg
      });
      return;
    }

    // 1. Bind fills and strokes of card containers
    const cardNames = [
      'KPI 1', 'KPI 2', 'KPI 3', 'KPI 4', 'KPI 5',
      'Chart Area', 'Leaderboard', 'Top Touch Points',
      'Review Routing', 'Live Activity'
    ];

    let boundFillsCount = 0;
    let boundStrokesCount = 0;
    for (const name of cardNames) {
      const card = leftNode.findOne(n => n.name === name);
      if (card) {
        if (card.fills && card.fills.length > 0) {
          card.fills = card.fills.map(f => {
            if (f.type === 'SOLID') {
              boundFillsCount++;
              return figma.variables.setBoundVariableForPaint(f, 'color', varSurface);
            }
            return f;
          });
        }
        if (card.strokes && card.strokes.length > 0) {
          card.strokes = card.strokes.map(s => {
            if (s.type === 'SOLID') {
              boundStrokesCount++;
              return figma.variables.setBoundVariableForPaint(s, 'color', varBorder);
            }
            return s;
          });
        }
      }
    }
    console.log(`BOUND_CARDS: bound ${boundFillsCount} fills and ${boundStrok
<truncated 2779 bytes>