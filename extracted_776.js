const root = await figma.getNodeByIdAsync('48:1712');
if (!root) return 'Root 48:1712 not found';

const variables = {
  'color/bg': 'VariableID:3:181',
  'color/surface': 'VariableID:3:182',
  'color/text-primary': 'VariableID:3:183',
  'color/text-muted': 'VariableID:3:184',
  'color/border': 'VariableID:3:185',
  'color/primary': 'VariableID:3:186',
  'color/success': 'VariableID:3:187',
  'color/warning': 'VariableID:3:188',
  'color/error': 'VariableID:3:189',
  'spacing/xxs': 'VariableID:3:190',
  'spacing/xs': 'VariableID:3:191',
  'spacing/sm': 'VariableID:3:192',
  'spacing/md': 'VariableID:3:193',
  'spacing/lg': 'VariableID:3:194',
  'spacing/xl': 'VariableID:3:195',
  'radius/sm': 'VariableID:3:196',
  'radius/md': 'VariableID:3:197',
  'radius/lg': 'VariableID:3:198',
  'radius/xl': 'VariableID:3:199',
  'radius/full': 'VariableID:3:200',
  'color/text-on-primary': 'VariableID:3:212',
  'color/primary-10': 'VariableID:3:285',
  'spacing/40': 'VariableID:23:205',
  'spacing/80': 'VariableID:23:206',
  'spacing/120': 'VariableID:23:207',
  'radius/inputs': 'VariableID:23:208',
  'radius/buttons': 'VariableID:23:209',
  'radius/navitems': 'VariableID:23:210'
};

const varObjects = {};
for (const [name, id] of Object.entries(variables)) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) varObjects[name] = v;
}

const stats = { boundColors: 0, boundProperties: 0 };

function rgbToHex(r, g, b) {
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

function traverse(node) {
  // Bind fills
  if (node.fills && node.fills.length > 0) {
    let modified = false;
    const newFills = node.fills.map(fill => {
      if (fill.type === 'SOLID') {
        const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        let targetVarId = null;
        
        if (hex === '#ffffff') targetVarId = variables['color/surface'];
        else if (hex
<truncated 4116 bytes>