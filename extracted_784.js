const margin = await figma.getNodeByIdAsync('48:2016');
if (!margin) return 'Margin 48:2016 not found';

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if (n.type === 'TEXT') {
    res += '  '.repeat(depth + 1) + `chars: "${n.characters}"\n`;
  }
  if ('children' in n) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return getSubtree(margin);
