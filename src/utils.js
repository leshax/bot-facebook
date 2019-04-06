/**
 * Checks if an object is a valid JSON.
 * @param {string} jsonString - stringed JSON for validation
 * @param {bool} isJSON - result of JSON verification
 */

function isJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}
  return false;
};

return module.exports = {
  isJSON: isJSON
};