const canvas = await figma.getNodeByIdAsync('48:37');
if (!canvas) return 'Canvas 48:37 not found';

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if (n.type === 'TEXT') {
    res += '  '.repeat(depth + 1) + `chars: "${n.characters}"\n`;
  }
  if ('children' in n && depth < 3) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return getSubtree(canvas);
