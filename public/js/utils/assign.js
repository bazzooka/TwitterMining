const assign = Object.assign; // Polyfill maybe needed for browser support

const assignToEmpty = (oldObject, newObject) => {
  return assign({}, oldObject, newObject);
};

export default assignToEmpty;
