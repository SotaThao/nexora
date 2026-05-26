const wrapper = await figma.getNodeByIdAsync('48:1713');
const sidebar = await figma.getNodeByIdAsync('48:1954');

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if ('children' in n && depth < 3) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return {
  wrapper: wrapper ? getSubtree(wrapper) : 'not found',
  sidebar: sidebar ? getSubtree(sidebar) : 'not found'
};
