const fs = require('fs');

const config = {
  ci: {
    collect: {
      url: ['http://localhost']
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};

fs.writeFileSync('lighthouserc.js', 'module.exports = ' + JSON.stringify(config, null, 2) + ';');
