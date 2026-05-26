const btnComp = await figma.getNodeByIdAsync('3:475');
const inputComp = await figma.getNodeByIdAsync('3:499');
const avatarComp = await figma.getNodeByIdAsync('8:72');
const badgeComp = await figma.getNodeByIdAsync('3:508');
const dropdownComp = await figma.getNodeByIdAsync('3:500');

const mockupSidebar = await figma.getNodeByIdAsync('42:267');

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
  'spacing/40': 'VariableID:23:205',
  'spacing/80': 'VariableID:23:206',
  'spacing/120': 'VariableID:23:207'
};

const varObjects = {};
for (const [name, id] of Object.entries(variables)) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) varObjects[name] = v;
}

const result = [];

function createInstanceFromSet(compSet, properties = {}) {
  if (compSet.type === 'COMPONENT') {
    return compSet.createInstance();
  }
  let matchedComponent = null;
  if (Object.keys(properties).length > 0) {
    const propStrings = Object.entries(properties).map(([k, v]) => `${k}=${v}`);
    matchedComponent = compSet.children.find(child => {
      const childProps = child.name.split(',').map(s => s.trim());
      return propStrings.every(ps => childProps.includes(ps));
    });
  }
  if (!matchedComponent) {
    matchedComponent = compSet.defaultVarian
<truncated 14545 bytes>