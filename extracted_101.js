const dsPage = figma.root.children.find(p => p.name === "Design system" || p.id === "0:1");
if (!dsPage) return { error: "Design system page not found" };

function findDSComponent(name) {
  return dsPage.findOne(n => n.name === name && (n.type === "COMPONENT" || n.type === "COMPONENT_SET"));
}

const buttonSet = findDSComponent("Button");
const inputFieldSet = findDSComponent("Input Field");
const avatarSet = findDSComponent("Avatar");
const progressBarComp = findDSComponent("Progress Bar");
const badgeComp = findDSComponent("Badge");
const cardComp = findDSComponent("Card");

return {
  buttonSet: buttonSet ? buttonSet.id : null,
  inputFieldSet: inputFieldSet ? inputFieldSet.id : null,
  avatarSet: avatarSet ? avatarSet.id : null,
  progressBarComp: progressBarComp ? progressBarComp.id : null,
  badgeComp: badgeComp ? badgeComp.id : null,
  cardComp: cardComp ? cardComp.id : null
};