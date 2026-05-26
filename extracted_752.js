const avatarComp = await figma.getNodeByIdAsync('8:72');
const inst = (avatarComp.defaultVariant || avatarComp.children[0]).createInstance();

function getSubtree(n, depth = 0) {
  let res = '  '.repeat(depth) + n.name + ` [${n.type}] (${n.id}) visible=${n.visible}\n`;
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

const tree = getSubtree(inst);
inst.remove();
return tree;
