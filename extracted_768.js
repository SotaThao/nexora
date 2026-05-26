const keys = [];
let obj = figma.variables;
while (obj) {
  keys.push(...Object.getOwnPropertyNames(obj));
  obj = Object.getPrototypeOf(obj);
}
return [...new Set(keys)];
