const inputComp = await figma.getNodeByIdAsync('3:499');
const btnComp = await figma.getNodeByIdAsync('3:475');
const avatarComp = await figma.getNodeByIdAsync('8:72');
const badgeComp = await figma.getNodeByIdAsync('3:508');

const inputInst = createInstance(inputComp);
const btnInst = createInstance(btnComp);
const avatarInst = createInstance(avatarComp);

function createInstance(compSet) {
  return compSet.type === 'COMPONENT' ? compSet.createInstance() : (compSet.defaultVariant || compSet.children[0]).createInstance();
}

const props = {
  input: inputInst.componentProperties,
  btn: btnInst.componentProperties,
  avatar: avatarInst.componentProperties
};

inputInst.remove();
btnInst.remove();
avatarInst.remove();

return props;
