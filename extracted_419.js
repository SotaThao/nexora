(() => {
  const leftNode = figma.getNodeById('37:405');
  const rightNode = figma.getNodeById('42:45');
  return {
    leftNodeExists: !!leftNode,
    leftNodeName: leftNode ? leftNode.name : null,
    leftNodeType: leftNode ? leftNode.type : null,
    rightNodeExists: !!rightNode,
    rightNodeName: rightNode ? rightNode.name : null,
    rightNodeType: rightNode ? rightNode.type : null
  };
})()