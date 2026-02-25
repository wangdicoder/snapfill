// Shim for bundlers (like Metro) that don't support package.json "exports".
// Redirects @snapfill/core/injectable to the built dist file.
module.exports = require('./dist/injectable.js');
