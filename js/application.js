!(function(root) {
  'use strict';

  root.app = {
    init: function() {
      this.loadNews();
    },

    loadNews: function() {
      lazyNews('#news', {        
        endpoint: {
          url: 'http://www.stellarbiotechnologies.com/media/press-releases/json',
          limit: 8
        }
      });
    }
  };

  app.init();

}(this));
