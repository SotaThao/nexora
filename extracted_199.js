const node = await figma.getNodeByIdAsync("I42:40;3:472");
figma.currentPage.selection = [node];
figma.viewport.scrollAndZoomIntoView([node]);
return { success: true };