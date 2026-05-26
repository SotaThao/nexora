const testFrame = figma.createFrame();
const keys = [];
let obj = testFrame;
while (obj) {
  keys.push(...Object.getOwnPropertyNames(obj));
  obj = Object.getPrototypeOf(obj);
}
testFrame.remove();
return [...new Set(keys)].filter(k => k.toLowerCase().includes('variable') || k.toLowerCase().includes('bound'));
