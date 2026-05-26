(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    const cardNames = [
      'KPI 1', 'KPI 2', 'KPI 3', 'KPI 4', 'KPI 5',
      'Chart Area', 'Leaderboard', 'Top Touch Points',
      'Review Routing', 'Live Activity'
    ];

    const cardsInfo = [];
    for (const name of cardNames) {
      const card = leftNode.findOne(n => n.name === name);
      if (card) {
        cardsInfo.push({
          name: card.name,
          id: card.id,
          fills: (card.fills || []).map(f => ({
            type: f.type,
            color: f.type === 'SOLID' ? `rgb(${Math.round(f.color.r*255)}, ${Math.round(f.color.g*255)}, ${Math.round(f.color.b*255)})` : null,
            boundVariables: f.boundVariables ? Object.keys(f.boundVariables).reduce((acc, k) => {
              acc[k] = f.boundVariables[k].id;
              return acc;
            }, {}) : null
          }))
        });
      }
    }

    console.log("CARDS_FILLS_INFO:", JSON.stringify(cardsInfo));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()