(async () => {
  try {
    const leftNode = await figma.getNodeByIdAsync('37:405');
    const rightNode = await figma.getNodeByIdAsync('42:45');
    console.log("EXEC_RESULT:", JSON.stringify({
      leftNodeExists: !!leftNode,
      leftNodeName: leftNode ? leftNode.name : null,
      leftNodeType: leftNode ? leftNode.type : null,
      rightNodeExists: !!rightNode,
      rightNodeName: rightNode ? rightNode.name : null,
      rightNodeType: rightNode ? rightNode.type : null
    }));
  } catch (err) {
    console.error("EXEC_ERROR:", err.toString());
  }
})()