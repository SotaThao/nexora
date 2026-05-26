(async () => {
  try {
    const component = await figma.getNodeByIdAsync('3:499');
    if (!component) {
      console.log("COMPONENT_NOT_FOUND: 3:499");
      return;
    }
    console.log("COMPONENT_INFO:", JSON.stringify({
      id: component.id,
      name: component.name,
      type: component.type,
      children: component.children ? component.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : []
    }));
  } catch (err) {
    console.error("COMPONENT_ERROR:", err.toString());
  }
})()