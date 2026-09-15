const path = require('path');

module.exports = {
  resolve: {
    alias: {
      'globalize$': path.resolve(__dirname, 'node_modules/globalize/dist/globalize.js'),
      'globalize/number': path.resolve(__dirname, 'node_modules/globalize/dist/globalize/number.js'),
      'globalize/date': path.resolve(__dirname, 'node_modules/globalize/dist/globalize/date.js'),
      'globalize/currency': path.resolve(__dirname, 'node_modules/globalize/dist/globalize/currency.js'),
      'globalize/message': path.resolve(__dirname, 'node_modules/globalize/dist/globalize/message.js'),
      'globalize/plural': path.resolve(__dirname, 'node_modules/globalize/dist/globalize/plural.js'),
      'cldr$': path.resolve(__dirname, 'node_modules/cldrjs/dist/cldr.js'),
      'cldr/event': path.resolve(__dirname, 'node_modules/cldrjs/dist/cldr/event.js'),
      'cldr/supplemental': path.resolve(__dirname, 'node_modules/cldrjs/dist/cldr/supplemental.js'),
      'cldr/unresolved': path.resolve(__dirname, 'node_modules/cldrjs/dist/cldr/unresolved.js'),
    },
  },
};
