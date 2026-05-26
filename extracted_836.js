const comp = await figma.getNodeByIdAsync('3:524');
if (!comp) return 'not found';

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

return getSubtree(comp);
