const { spawn } = require('child_process');

const url = 'https://framer-mcp-relay.orange-lamp-studio.workers.dev/mcp?userId=9394a7c0e462409d2ce9333aa137203076bcaa60bde22695b590e549a35b73c2';
const mcp = spawn('npx', ['mcp-remote', url], { shell: true });

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

function scaleValue(valStr, scaleFactor) {
  if (!valStr) return undefined;
  if (valStr === 'auto' || valStr.includes('%') || valStr.includes('fr')) {
    return valStr;
  }
  const num = parseFloat(valStr);
  if (isNaN(num)) return valStr;
  return `${num * scaleFactor}px`;
}

async function scaleSlideChildren(origSlideId, clonedSlideId, scaleFactor) {
  const origChildrenRes = await callTool('nodes_getChildren', { nodeId: origSlideId });
  const origChildren = JSON.parse(origChildrenRes.content[0].text).children || [];
  
  const clonedChildrenRes = await callTool('nodes_getChildren', { nodeId: clonedSlideId });
  const clonedChildren = JSON.parse(clonedChildrenRes.content[0].text).children || [];
  
  console.log(`Scaling ${origChildren.length} children for slide ${origSlideId} to clone ${clonedSlideId} (Scale: ${scaleFactor})...`);
  
  // Process SEQUENTIALLY to respect editor speed limit
  for (let k = 0; k < origChildren.length; k++) {
    const origChild = origChildren[k];
    const clonedChild = clonedChildren[k];
    if (!clonedChild) continue;
    
    try {
      const origNodeRes = await callTool('nodes_getNode', { nodeId: origChild.id });
      const origNode = JSON.parse(origNodeRes.content[0].text).node;
      const attrs = origNode.attrs || {};
      
      const updateAttrs = {};
      
      if (attrs.left !== undefined) {
        const scaledLeft = scaleValue(attrs.left, scaleFactor);
        if (scaledLeft !== undefined) updateAttrs.left = scaledLeft;
      }
      if (attrs.top !== undefined) {
        const scaledTop = scaleValue(attrs.top, scaleFactor);
        if (scaledTop !== undefined) updateAttrs.top = scaledTop;
      }
      
      if (origChild.type === 'TextNode') {
        updateAttrs.width = attrs.width;
        updateAttrs.height = attrs.height;
        updateAttrs.fontFamily = 'Space Grotesk';
      } else {
        if (attrs.width !== undefined) {
          const scaledWidth = scaleValue(attrs.width, scaleFactor);
          if (scaledWidth !== undefined) updateAttrs.width = scaledWidth;
        }
        if (attrs.height !== undefined) {
          const scaledHeight = scaleValue(attrs.height, scaleFactor);
          if (scaledHeight !== undefined) updateAttrs.height = scaledHeight;
        }
        if (attrs.borderRadius !== undefined) {
          const scaledRadius = scaleValue(attrs.borderRadius, scaleFactor);
          if (scaledRadius !== undefined) updateAttrs.borderRadius = scaledRadius;
        }
      }
      
      await callTool('nodes_setAttributes', {
        nodeId: clonedChild.id,
        attrs: updateAttrs
      });
    } catch (err) {
      console.error(`Error scaling child ${origChild.id} at index ${k}:`, err.message || JSON.stringify(err));
    }
    
    // Tiny delay between elements to let Framer breathe
    await new Promise(r => setTimeout(r, 100));
  }
}

async function runMigration() {
  const pageId = 'D2ztn0s8R';
  const desktopId = 'E3tazDvva';
  const desktopSpacerId = 'nAuGOtQzx';
  
  const slideIds = [
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
    
    // 2. Create Tablet Stack
    console.log('Creating Tablet stack...');
    const createTabletRes = await callTool('nodes_createFrame', {
      parentId: pageId,
      attrs: {
        name: 'Tablet',
        width: '810px',
        height: '4650px', // 90px spacer + 10 * 456px slides = 4650px
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
    const tabletNode = JSON.parse(createTabletRes.content[0].text).node;
    console.log(`Tablet viewport created with ID: ${tabletNode.id}`);
    
    // 3. Create Mobile Stack
    console.log('Creating Mobile stack...');
    const createMobileRes = await callTool('nodes_createFrame', {
      parentId: pageId,
      attrs: {
        name: 'Mobile',
        width: '390px',
        height: '2290px', // 90px spacer + 10 * 220px slides = 2290px
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
    const mobileNode = JSON.parse(createMobileRes.content[0].text).node;
    console.log(`Mobile viewport created with ID: ${mobileNode.id}`);
    
    // 4. Create Spacers
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
    
    console.log('--- Phase 2: Card styling and Scaling Migration ---');
    
    for (let i = 0; i < slideIds.length; i++) {
      const origSlideId = slideIds[i];
      console.log(`\n=============================================`);
      console.log(`Slide ${i+1}/10: Processing original slide ID: ${origSlideId}`);
      console.log(`=============================================`);
      
      // 1. Style original Desktop slide card
      console.log('Applying rounded border styling to Desktop slide...');
      await callTool('nodes_setAttributes', {
        nodeId: origSlideId,
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
      
      // Update font family of Desktop text nodes to Space Grotesk
      const origChildrenRes = await callTool('nodes_getChildren', { nodeId: origSlideId });
      const origChildren = JSON.parse(origChildrenRes.content[0].text).children || [];
      const origTextNodes = origChildren.filter(c => c.type === 'TextNode');
      console.log(`Updating ${origTextNodes.length} text layers on Desktop slide to Space Grotesk...`);
      for (const tNode of origTextNodes) {
        await callTool('nodes_setAttributes', {
          nodeId: tNode.id,
          attrs: { fontFamily: 'Space Grotesk' }
        });
      }
      
      // 2. Clone to Tablet viewport
      console.log(`Cloning slide ${i+1} to Tablet viewport...`);
      const cloneTabletRes = await callTool('nodes_duplicate', {
        nodeId: origSlideId,
        parentId: tabletNode.id
      });
      const tabSlideNode = JSON.parse(cloneTabletRes.content[0].text).node;
      console.log(`Slide duplicated for Tablet. ID: ${tabSlideNode.id}`);
      
      // Update Tablet slide card attributes
      await callTool('nodes_setAttributes', {
        nodeId: tabSlideNode.id,
        attrs: {
          width: '810px',
          height: '456px',
          borderRadius: '12px',
          border: {
            width: '1px',
            color: 'rgba(0, 0, 0, 0.08)',
            style: 'solid'
          },
          overflow: 'clip'
        }
      });
      
      // Scale children for Tablet slide
      await scaleSlideChildren(origSlideId, tabSlideNode.id, 0.675);
      
      // 3. Clone to Mobile viewport
      console.log(`Cloning slide ${i+1} to Mobile viewport...`);
      const cloneMobileRes = await callTool('nodes_duplicate', {
        nodeId: origSlideId,
        parentId: mobileNode.id
      });
      const mobSlideNode = JSON.parse(cloneMobileRes.content[0].text).node;
      console.log(`Slide duplicated for Mobile. ID: ${mobSlideNode.id}`);
      
      // Update Mobile slide card attributes
      await callTool('nodes_setAttributes', {
        nodeId: mobSlideNode.id,
        attrs: {
          width: '390px',
          height: '220px',
          borderRadius: '8px',
          border: {
            width: '1px',
            color: 'rgba(0, 0, 0, 0.08)',
            style: 'solid'
          },
          overflow: 'clip'
        }
      });
      
      // Scale children for Mobile slide
      await scaleSlideChildren(origSlideId, mobSlideNode.id, 0.325);
    }
    
    console.log('\n--- SUCCESS: Branded responsive layouts implemented! ---');
    mcp.kill();
    process.exit(0);
  } catch (err) {
    console.error('FATAL ERROR during responsive branded migration:', err.message || JSON.stringify(err));
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
