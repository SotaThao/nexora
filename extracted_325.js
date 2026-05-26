(async () => {
  const node = await figma.getNodeByIdAsync("37:405");
  if (!node) {
    console.log("Node 37:405 not found");
    return;
  }
  console.log("Node 37:405 name:", node.name);
  console.log("Node 37:405 type:", node.type);
  console.log("Node 37:405 children count:", node.children ? node.children.length : 0);
  if (node.children) {
    console.log("Children names & IDs:", node.children.map(c => `${c.name} (${c.id})` + (c.visible ? "" : " [HIDDEN]")));
  }
})()