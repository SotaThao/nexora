const ph = await figma.getNodeByIdAsync('48:418');
const fc = await figma.getNodeByIdAsync('48:428');

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if ('children' in n && depth < 2) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return {
  ph: ph ? getSubtree(ph) : 'null',
  fc: fc ? getSubtree(fc) : 'null'
};
