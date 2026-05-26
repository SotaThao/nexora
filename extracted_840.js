const seg = await figma.getNodeByIdAsync('48:625');
if (!seg) return 'Segmented control mockup in grid view not found';

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id})\n`;
  if ('children' in n) {
    n.children.forEach(c => {
      res += getSubtree(c, depth + 1);
    });
  }
  return res;
}

return getSubtree(seg);
