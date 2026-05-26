const getDims = async (id) => {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) return null;
  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
    children: node.children ? node.children.map(c => ({ id: c.id, name: c.name, type: c.type, width: c.width })) : []
  };
};

return {
  tech1_pb: await getDims("37:518"),
  tech2_pb: await getDims("37:533"),
  tech3_pb: await getDims("37:548")
};