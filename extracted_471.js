(async () => {
  try {
    const container = await figma.getNodeByIdAsync('3:481');
    if (!container) {
      console.log("NOT_FOUND");
      return;
    }
    const fills = container.fills;
    const bound = fills[0].boundVariables;
    console.log("INPUT_BOUND_VARIABLE:", JSON.stringify(bound));
  } catch (err) {
    console.error("ERROR:", err.toString());
  }
})()