const c1 = await figma.getNodeByIdAsync('48:429');
const c2 = await figma.getNodeByIdAsync('48:506');

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if ('children' in n) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return {
  c1: c1 ? getSubtree(c1) : 'null',
  c2: c2 ? getSubtree(c2) : 'null'
};
