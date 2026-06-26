const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const url = 'https://framer-mcp-relay.orange-lamp-studio.workers.dev/mcp?userId=9394a7c0e462409d2ce9333aa137203076bcaa60bde22695b590e549a35b73c2';
const mcp = spawn('npx', ['mcp-remote', url], { shell: true });

const slidesFile = 'C:\\Users\\AD\\//.gemini/antigravity/scratch/slides_layout.json';
// Let's resolve the path robustly
const slidesPath = path.resolve('C:\\Users\\AD\\.gemini\\antigravity\\scratch\\slides_layout.json');

if (!fs.existsSync(slidesPath)) {
  console.error(`Slides layout file not found at: ${slidesPath}`);
  process.exit(1);
}

const slides = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));
console.log(`Loaded ${slides.length} slides from JSON.`);

let buffer = '';
let initialized = false;
let callId = 1;
const pendingCalls = new Map();

mcp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const json = JSON.parse(line.trim());
        if (json.id === 1) {
          initialized = true;
          mcp.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized'
          }) + '\n');
          
          runMigration();
        } else if (json.id && pendingCalls.has(json.id)) {
          const callback = pendingCalls.get(json.id);
          pendingCalls.delete(json.id);
          callback(json.result || json.error);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e.message);
      }
    }
  }
});

function callTool(name, args) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const attempt = () => {
      attempts++;
      callId++;
      const id = callId;
      
      let timeoutId = setTimeout(() => {
        pendingCalls.delete(id);
        const errMsg = 'Request timeout (no response from relay in 12s)';
        if (attempts < 6) {
          console.log(`[TIMEOUT ERROR] "${name}" (attempt ${attempts}). Retrying in 4s...`);
          setTimeout(attempt, 4000);
        } else {
          reject({ isError: true, content: [{ type: 'text', text: errMsg }] });
        }
      }, 12000);
      
      pendingCalls.set(id, (res) => {
        clearTimeout(timeoutId);
        if (res && res.isError) {
          const errMsg = res.content && res.content[0] && res.content[0].text || JSON.stringify(res);
          const isTransient = errMsg.includes('concurrent') || 
                              errMsg.includes('not connected') || 
                              errMsg.includes('time') || 
                              errMsg.includes('busy') ||
                              errMsg.includes('timeout') ||
                              errMsg.includes('RECONNECTED');
                              
          if (isTransient && attempts < 6) {
            console.log(`[TRANSIENT ERROR] "${name}" (attempt ${attempts}): ${errMsg.substring(0, 150)}. Retrying in 4s...`);
            setTimeout(attempt, 4000);
          } else {
            reject(res);
          }
        } else {
          resolve(res);
        }
      });
      
      mcp.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name, arguments: args }
      }) + '\n');
    };
    attempt();
  });
}

async function createChildNode(slideFramerId, child, scale) {
  const left = Math.round(child.x * scale);
  const top = Math.round(child.y * scale);
  const w = Math.round(child.width * scale);
  const h = Math.round(child.height * scale);
  
  if (child.type === 'RECTANGLE') {
    const attrs = {
      name: child.name,
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: child.borderRadius ? `${Math.round(child.borderRadius * scale)}px` : '0px',
      backgroundColor: child.backgroundColor || null
    };
    
    if (child.border) {
      const borderWidth = Math.max(1, Math.round(parseFloat(child.border.width || 1) * scale));
      attrs.border = {
        width: `${borderWidth}px`,
        color: child.border.color,
        style: child.border.style || 'solid'
      };
    }
    
    await callTool('nodes_createFrame', { parentId: slideFramerId, attrs });
  } else if (child.type === 'LINE') {
    let finalW, finalH;
    let strokeColor = (child.border && child.border.color) ? child.border.color : '#CBD5E1';
    let strokeWidth = (child.border && child.border.width) ? parseFloat(child.border.width) : 1;
    
    const isVertical = child.name.toLowerCase().includes('grid v');
    if (isVertical) {
      finalW = Math.round(strokeWidth * scale);
      finalH = w;
    } else {
      finalW = w;
      finalH = Math.round(strokeWidth * scale);
    }
    
    finalW = Math.max(1, finalW);
    finalH = Math.max(1, finalH);
    
    const attrs = {
      name: child.name,
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${finalW}px`,
      height: `${finalH}px`,
      backgroundColor: strokeColor
    };
    
    await callTool('nodes_createFrame', { parentId: slideFramerId, attrs });
  } else if (child.type === 'ELLIPSE') {
    const attrs = {
      name: child.name,
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: '50%',
      backgroundColor: child.backgroundColor || null
    };
    
    await callTool('nodes_createFrame', { parentId: slideFramerId, attrs });
  } else if (child.type === 'POLYGON') {
    const attrs = {
      name: child.name,
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`
    };
    
    const color = child.backgroundColor || 'rgba(70, 72, 216, 1)';
    const svgString = `<svg viewBox="0 0 ${child.width} ${child.height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><polygon points="0,${child.height} ${child.width / 2},0 ${child.width},${child.height}" fill="${color}"/></svg>`;
    
    await callTool('nodes_addSvg', { parentId: slideFramerId, svg: svgString, attrs });
  } else if (child.type === 'TEXT') {
    const textVal = child.characters || '';
    const fontMultiplier = 9.5; // average width per char in pixels
    const padding = 20;
    const calculatedWidth = Math.max(80, Math.ceil(textVal.length * fontMultiplier + padding));
    
    const attrs = {
      name: child.name,
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${calculatedWidth}px`, // keep safe width so text doesn't wrap
      height: '24px',
      fontFamily: 'Space Grotesk',
      fontWeight: child.fontWeight || 400
    };
    
    await callTool('nodes_addText', { parentId: slideFramerId, text: textVal, attrs });
  }
}

async function runMigration() {
  const pageId = 'D2ztn0s8R';
  const desktopId = 'E3tazDvva';
  const desktopSpacerId = 'nAuGOtQzx';
  
  const desktopSlideIds = [
    'jBn4z50mO', // Nexora 01 - Cover
    'nWocLXcJZ', // Nexora 02 - Problem
    'O2WK7h4u2', // Nexora 03 - Goals
    'I1biaYKXv', // Nexora 04 - Role
    'XDF_MlA53', // Nexora 05 - Process
    'qqbWEjA92', // Nexora 06 - Flow & Wireframe
    'qiHkb9ckp', // Nexora 07 - UI System
    'w_o0rUgDf', // Nexora 08 - Final Design
    'ZuD90qE75', // Nexora 09 - Impact
    'oxoseX1HD'  // Nexora 10 - Collaboration
  ];
  
  try {
    console.log('--- Phase 0: Clean up any old viewports ---');
    const pageChildrenRes = await callTool('nodes_getChildren', { nodeId: pageId });
    const pageChildren = JSON.parse(pageChildrenRes.content[0].text).children || [];
    
    for (const child of pageChildren) {
      if (child.name === 'Tablet' || child.name === 'Mobile') {
        console.log(`Found old viewport "${child.name}" (${child.id}). Deleting...`);
        try {
          await callTool('nodes_remove', { nodeId: child.id });
        } catch (e) {
          console.warn(`Warning: Failed to delete old viewport ${child.id}:`, e.message || JSON.stringify(e));
        }
      }
    }
    
    let tabletNode = null;
    let mobileNode = null;
    let existingTabletSlides = [];
    let existingMobileSlides = [];
    
    console.log('--- Phase 1: Setup Viewport Stacks (Light Mode) ---');
    
    // 1. Update Desktop stack
    console.log('Updating Desktop stack background to White (#FFFFFF)...');
    await callTool('nodes_setAttributes', {
      nodeId: desktopId,
      attrs: { backgroundColor: '#FFFFFF' }
    });
    
    console.log('Updating Desktop Top Spacer background to White (#FFFFFF)...');
    await callTool('nodes_setAttributes', {
      nodeId: desktopSpacerId,
      attrs: { backgroundColor: '#FFFFFF' }
    });
    
    // Update Desktop slide borders (skipping heavy text styling)
    console.log('Applying rounded border styling to Desktop slides...');
    for (const dSlideId of desktopSlideIds) {
      try {
        await callTool('nodes_setAttributes', {
          nodeId: dSlideId,
          attrs: {
            borderRadius: '16px',
            border: {
              width: '1px',
              color: 'rgba(0, 0, 0, 0.08)',
              style: 'solid'
            },
            overflow: 'clip'
          }
        });
      } catch (e) {
        console.warn(`Warning: Failed to update styling on Desktop slide ${dSlideId}:`, e.message || JSON.stringify(e));
      }
      await new Promise(r => setTimeout(r, 150));
    }
    
    // 2. Create Tablet Stack if not exists
    if (!tabletNode) {
      console.log('Creating Tablet stack...');
      const createTabletRes = await callTool('nodes_createFrame', {
        parentId: pageId,
        attrs: {
          name: 'Tablet',
          width: '810px',
          height: '4650px',
          position: 'absolute',
          left: '1300px',
          top: '0px',
          layout: 'stack',
          stackDirection: 'vertical',
          stackAlignment: 'center',
          stackDistribution: 'start',
          gap: '0px',
          padding: '90px 0px 0px 0px',
          overflow: 'clip',
          backgroundColor: '#FFFFFF'
        }
      });
      tabletNode = JSON.parse(createTabletRes.content[0].text).node;
      console.log(`Tablet viewport created with ID: ${tabletNode.id}`);
      
      console.log('Creating Top Spacer for Tablet...');
      await callTool('nodes_createFrame', {
        parentId: tabletNode.id,
        attrs: {
          name: 'Top Spacer',
          width: '810px',
          height: '90px',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          layout: null
        }
      });
    }
    
    // 3. Create Mobile Stack if not exists
    if (!mobileNode) {
      console.log('Creating Mobile stack...');
      const createMobileRes = await callTool('nodes_createFrame', {
        parentId: pageId,
        attrs: {
          name: 'Mobile',
          width: '390px',
          height: '2290px',
          position: 'absolute',
          left: '2200px',
          top: '0px',
          layout: 'stack',
          stackDirection: 'vertical',
          stackAlignment: 'center',
          stackDistribution: 'start',
          gap: '0px',
          padding: '90px 0px 0px 0px',
          overflow: 'clip',
          backgroundColor: '#FFFFFF'
        }
      });
      mobileNode = JSON.parse(createMobileRes.content[0].text).node;
      console.log(`Mobile viewport created with ID: ${mobileNode.id}`);
      
      console.log('Creating Top Spacer for Mobile...');
      await callTool('nodes_createFrame', {
        parentId: mobileNode.id,
        attrs: {
          name: 'Top Spacer',
          width: '390px',
          height: '90px',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          layout: null
        }
      });
    }
    
    console.log('--- Phase 2: Direct Slide Compilation ---');
    
    const tabScale = 810 / 1920; // 0.421875
    const mobScale = 390 / 1920; // 0.203125
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`\n=============================================`);
      console.log(`Slide ${i+1}/10: Processing slide "${slide.name}"`);
      console.log(`=============================================`);
      
      // 1. Compile Tablet Slide if not already existing and fully compiled
      const existingTabSlide = existingTabletSlides.find(s => s.name === slide.name);
      let tabSlideNeedsCompile = true;
      if (existingTabSlide) {
        try {
          const childrenRes = await callTool('nodes_getChildren', { nodeId: existingTabSlide.id });
          const children = JSON.parse(childrenRes.content[0].text).children || [];
          if (children.length >= slide.children.length) {
            console.log(`[INCREMENTAL] Slide "${slide.name}" already exists and is fully compiled on Tablet (${children.length}/${slide.children.length} elements). Skipping...`);
            tabSlideNeedsCompile = false;
          } else {
            console.log(`[INCREMENTAL] Slide "${slide.name}" is partially compiled on Tablet (${children.length}/${slide.children.length} elements). Deleting and recompiling...`);
            await callTool('nodes_remove', { nodeId: existingTabSlide.id });
          }
        } catch (e) {
          console.warn(`Warning: Failed to check children of existing Tablet slide, will recreate:`, e.message);
          await callTool('nodes_remove', { nodeId: existingTabSlide.id });
        }
      }
      
      if (tabSlideNeedsCompile) {
        console.log(`Creating Tablet slide container...`);
        const tabSlideWidth = Math.round(slide.width * tabScale);
        const tabSlideHeight = Math.round(slide.height * tabScale);
        
        const tabSlideRes = await callTool('nodes_createFrame', {
          parentId: tabletNode.id,
          attrs: {
            name: slide.name,
            width: `${tabSlideWidth}px`,
            height: `${tabSlideHeight}px`,
            borderRadius: '12px',
            border: {
              width: '1px',
              color: 'rgba(0, 0, 0, 0.08)',
              style: 'solid'
            },
            overflow: 'clip',
            position: 'relative',
            layout: null,
            backgroundColor: slide.backgroundColor || '#FFFFFF'
          }
        });
        const tabSlideNode = JSON.parse(tabSlideRes.content[0].text).node;
        
        console.log(`Compiling ${slide.children.length} children for Tablet slide...`);
        for (let j = 0; j < slide.children.length; j++) {
          await createChildNode(tabSlideNode.id, slide.children[j], tabScale);
          await new Promise(r => setTimeout(r, 80));
        }
      }
      
      // 2. Compile Mobile Slide if not already existing and fully compiled
      const existingMobSlide = existingMobileSlides.find(s => s.name === slide.name);
      let mobSlideNeedsCompile = true;
      if (existingMobSlide) {
        try {
          const childrenRes = await callTool('nodes_getChildren', { nodeId: existingMobSlide.id });
          const children = JSON.parse(childrenRes.content[0].text).children || [];
          if (children.length >= slide.children.length) {
            console.log(`[INCREMENTAL] Slide "${slide.name}" already exists and is fully compiled on Mobile (${children.length}/${slide.children.length} elements). Skipping...`);
            mobSlideNeedsCompile = false;
          } else {
            console.log(`[INCREMENTAL] Slide "${slide.name}" is partially compiled on Mobile (${children.length}/${slide.children.length} elements). Deleting and recompiling...`);
            await callTool('nodes_remove', { nodeId: existingMobSlide.id });
          }
        } catch (e) {
          console.warn(`Warning: Failed to check children of existing Mobile slide, will recreate:`, e.message);
          await callTool('nodes_remove', { nodeId: existingMobSlide.id });
        }
      }
      
      if (mobSlideNeedsCompile) {
        console.log(`Creating Mobile slide container...`);
        const mobSlideWidth = Math.round(slide.width * mobScale);
        const mobSlideHeight = Math.round(slide.height * mobScale);
        
        const mobSlideRes = await callTool('nodes_createFrame', {
          parentId: mobileNode.id,
          attrs: {
            name: slide.name,
            width: `${mobSlideWidth}px`,
            height: `${mobSlideHeight}px`,
            borderRadius: '8px',
            border: {
              width: '1px',
              color: 'rgba(0, 0, 0, 0.08)',
              style: 'solid'
            },
            overflow: 'clip',
            position: 'relative',
            layout: null,
            backgroundColor: slide.backgroundColor || '#FFFFFF'
          }
        });
        const mobSlideNode = JSON.parse(mobSlideRes.content[0].text).node;
        
        console.log(`Compiling ${slide.children.length} children for Mobile slide...`);
        for (let j = 0; j < slide.children.length; j++) {
          await createChildNode(mobSlideNode.id, slide.children[j], mobScale);
          await new Promise(r => setTimeout(r, 80));
        }
      }
    }
    
    console.log('\n--- SUCCESS: Direct branded responsive layouts compiled! ---');
    mcp.kill();
    process.exit(0);
  } catch (err) {
    console.error('FATAL ERROR during direct responsive migration:', err.message || JSON.stringify(err));
    mcp.kill();
    process.exit(1);
  }
}

// Global timeout (30 minutes total)
setTimeout(() => {
  console.error('Migration script timeout (30 minutes) reached.');
  mcp.kill();
  process.exit(1);
}, 1800000);

setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'framer-mcp-client', version: '1.0.0' }
    }
  }) + '\n');
}, 3000);
