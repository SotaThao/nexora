const node = await figma.getNodeByIdAsync("42:14");
const textNodes = [];
function findTextNodes(n) {
  if (n.type === "TEXT") {
    textNodes.push({ id: n.id, name: n.name, characters: n.characters, visible: n.visible });
  }
  if (n.children) {
    n.children.forEach(findTextNodes);
  }
}
findTextNodes(node);
return textNodes;