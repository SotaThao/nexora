const ids = ['48:1712', '48:20', '48:349', '48:536'];
const nodes = await Promise.all(ids.map(id => figma.getNodeByIdAsync(id)));
const audit = [];

for (const node of nodes) {
  if (!node) {
    audit.push({ id: null, error: 'Node not found' });
    continue;
  }
  
  const textNodes = [];
  const instances = [];
  const unboundColors = [];
  const unboundSpacing = [];
  
  function traverse(n) {
    if (n.type === 'TEXT') {
      textNodes.push({ id: n.id, name: n.name, characters: n.characters });
    }
    if (n.type === 'INSTANCE') {
      instances.push({ id: n.id, name: n.name, mainComponent: n.mainComponent ? n.mainComponent.name : null });
    }
    // Check fills
    if (n.fills && n.fills.length > 0) {
      n.fills.forEach(fill => {
        if (fill.type === 'SOLID') {
          const bound = n.getBoundVariableForPaint && n.getBoundVariableForPaint('fills');
          if (!bound) {
            unboundColors.push({ id: n.id, name: n.name, type: 'fill', color: fill.color });
          }
        }
      });
    }
    // Check strokes
    if (n.strokes && n.strokes.length > 0) {
      n.strokes.forEach(stroke => {
        if (stroke.type === 'SOLID') {
          const bound = n.getBoundVariableForPaint && n.getBoundVariableForPaint('strokes');
          if (!bound) {
            unboundColors.push({ id: n.id, name: n.name, type: 'stroke', color: stroke.color });
          }
        }
      });
    }
    // Check border radius
    if (n.cornerRadius !== undefined && typeof n.cornerRadius === 'number' && n.cornerRadius > 0) {
      const bound = n.getBoundVariableForProperty && n.getBoundVariableForProperty('topLeftRadius'); // check one corner
      if (!bound) {
        unboundSpacing.push({ id: n.id, name: n.name, property: 'cornerRadius', value: n.cornerRadius });
      }
    }
    // Check layout gaps & paddings
    if (n.layoutMode && n.layoutMode !== 'NONE') {
      if (n.itemSpacing && typeof n.itemSpacing === 'number' && n.itemSpacing > 
<truncated 1242 bytes>