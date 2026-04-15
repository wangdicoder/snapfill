// Shim for bundlers (like Metro) that don't support package.json "exports".
// Resolves @snap-fill/core/injectable to the built dist file.
//
// In the monorepo, Metro watches packages/ so rebuilds pick up changes.
// When published, consumers use the "exports" map in package.json instead.
module.exports = require('./dist/injectable.js');
