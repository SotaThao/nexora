const n1 = await figma.getNodeByIdAsync('48:402');
const n2 = await figma.getNodeByIdAsync('48:409');

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
  n1: n1 ? getSubtree(n1) : 'null',
  n2: n2 ? getSubtree(n2) : 'null'
};
