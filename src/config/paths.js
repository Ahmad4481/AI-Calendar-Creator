// Project Paths Configuration
const paths = {
  // Frontend paths
  frontend: {
    pages: 'src/frontend/pages/',
    assets: {
      css: {
        base: 'src/frontend/assets/css/base/',
        components: 'src/frontend/assets/css/components/',
        pages: 'src/frontend/assets/css/pages/'
      },
      js: {
        core: 'src/frontend/assets/js/core/',
        components: 'src/frontend/assets/js/components/',
        pages: 'src/frontend/assets/js/pages/',
        utils: 'src/frontend/assets/js/utils/'
      },
      fonts: 'src/frontend/assets/fonts/'
    }
  },
  
  // Backend paths
  backend: {
    api: 'src/backend/api/',
    models: 'src/backend/models/',
    utils: 'src/backend/utils/'
  },
  
  // Documentation
  docs: 'src/docs/'
};

module.exports = paths;
