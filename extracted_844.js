const container = await figma.getNodeByIdAsync('48:108');
const gridSeg = await figma.getNodeByIdAsync('48:625');
const variables = {
  'color/bg': 'VariableID:3:181',
  'color/surface': 'VariableID:3:182',
  'color/text-primary': 'VariableID:3:183',
  'color/text-muted': 'VariableID:3:184',
  'color/border': 'VariableID:3:185',
  'radius/md': 'VariableID:3:197',
  'radius/sm': 'VariableID:3:196'
};

const varObjects = {};
for (const [name, id] of Object.entries(variables)) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) varObjects[name] = v;
}

const result = [];

async function setCharactersWithFont(textNode, characters) {
  try {
    await figma.loadFontAsync(textNode.fontName);
    textNode.characters = characters;
  } catch(e) {
    result.push(`Failed font load: ${e.toString()}`);
  }
}

// 1. Fix dropdowns inside container
if (container) {
  const dropdowns = container.findAll(n => n.type === 'INSTANCE' && n.name.includes('Dropdown'));
  if (dropdowns.length >= 2) {
    // Dropdown 1: Tất cả vai trò
    const d1 = dropdowns[0];
    const l1 = d1.findOne(n => n.name === 'Label');
    if (l1) l1.visible = false;
    const opt1 = d1.findOne(n => n.name === 'Selected Option');
    if (opt1) await setCharactersWithFont(opt1, 'Tất cả vai trò');
    
    // Dropdown 2: Mới nhất
    const d2 = dropdowns[1];
    const l2 = d2.findOne(n => n.name === 'Label');
    if (l2) l2.visible = false;
    const opt2 = d2.findOne(n => n.name === 'Selected Option');
    if (opt2) await setCharactersWithFont(opt2, 'Mới nhất');
    
    result.push('Fixed dropdown labels and selected options');
  }
}

// 2. Restore/fix segmented control in list view
if (container && gridSeg) {
  // Find bad instance under Margin
  const badMargin = container.children.find(c => c.type === 'INSTANCE' && c.name.includes('Segmented Control'));
  if (badMargin) {
    badMargin.remove();
  }
  
  const segClone = gridSeg.clone();
  container.in
<truncated 1759 bytes>