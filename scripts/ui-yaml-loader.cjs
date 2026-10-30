// Webpack and Turbopack load their shared build-time loader through CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseDocument } = require("yaml");

module.exports = function loadUiYaml(source) {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length) throw document.errors[0];
  return `export default ${JSON.stringify(document.toJS({ maxAliasCount: 0 }))};`;
};
