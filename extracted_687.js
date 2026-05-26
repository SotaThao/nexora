const ids = ['48:20', '48:349', '48:536'];
const results = {};

for (const id of ids) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) {
    results[id] = { error: 'Not found' };
    continue;
  }
  
  const elements = [];
  function describe(n, depth = 0) {
    const info = {
      id: n.id,
      name: n.name,
      type: n.type,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      depth
    };
    
    if (n.type === 'TEXT') {
      info.text = n.characters;
    }
    
    // Check if it's a potential mockup element (e.g. starts with "Button", "Badge", "Input", "Avatar", "Dropdown", "Checkbox")
    const isMock = /button|badge|input|avatar|dropdown|checkbox|select|tabs|segmented/i.test(n.name) || 
                   n.type === 'INSTANCE' ||
                   (n.fills && n.fills.length > 0 && n.name.includes('Frame')) ||
                   n.name === 'Tag' || n.name === 'Status' || n.name === 'Rating';
    
    if (isMock || depth <= 2) {
      elements.push(info);
    }
    
    if ('children' in n && depth < 5) {
      n.children.forEach(c => describe(c, depth + 1));
    }
  }
  
  describe(node);
  results[id] = {
    name: node.name,
    elements
  };
}

return results;
