(async () => {
  try {
    const localVariables = await figma.variables.getLocalVariablesAsync();
    const modeLight = '3:0';
    const modeDark = '3:1';

    const updates = {
      'color/bg': {
        [modeLight]: { r: 248/255, g: 250/255, b: 252/255, a: 1 }, // #F8FAFC
        [modeDark]: { r: 5/255, g: 5/255, b: 5/255, a: 1 } // #050505
      },
      'color/primary': {
        [modeLight]: { r: 70/255, g: 72/255, b: 212/255, a: 1 }, // #4648D4
        [modeDark]: { r: 245/255, g: 158/255, b: 11/255, a: 1 } // #F59E0B (Let's make dark mode primary yellow/gold as well to match Sidebar warnings/highlights)
      },
      'color/primary-10': {
        [modeLight]: { r: 70/255, g: 72/255, b: 212/255, a: 0.1 }, // #4648D4 at 10%
        [modeDark]: { r: 245/255, g: 158/255, b: 11/255, a: 0.1 } // #F59E0B at 10%
      },
      'color/border': {
        [modeLight]: { r: 226/255, g: 232/255, b: 240/255, a: 1 }, // #E2E8F0
        [modeDark]: { r: 255/255, g: 255/255, b: 255/255, a: 0.1 } // #FFFFFF at 10%
      },
      'color/success': {
        [modeLight]: { r: 16/255, g: 185/255, b: 129/255, a: 1 }, // #10B981
        [modeDark]: { r: 16/255, g: 185/255, b: 129/255, a: 1 }
      },
      'color/warning': {
        [modeLight]: { r: 245/255, g: 158/255, b: 11/255, a: 1 }, // #F59E0B
        [modeDark]: { r: 245/255, g: 158/255, b: 11/255, a: 1 }
      },
      'color/error': {
        [modeLight]: { r: 239/255, g: 68/255, b: 68/255, a: 1 }, // #EF4444
        [modeDark]: { r: 239/255, g: 68/255, b: 68/255, a: 1 }
      },
      'color/text-primary': {
        [modeLight]: { r: 11/255, g: 28/255, b: 48/255, a: 1 }, // #0B1C30
        [modeDark]: { r: 255/255, g: 255/255, b: 255/255, a: 1 } // #FFFFFF
      },
      'color/text-muted': {
        [modeLight]: { r: 86/255, g: 94/255, b: 116/255, a: 1 }, // #565E74
        [modeDark]: { r: 255/255, g: 255/255, b: 255/255, a: 0.6 } // #FFFFFF at 60%
      }
    };

    let updatedCount = 0;
    for (const v of l
<truncated 384 bytes>