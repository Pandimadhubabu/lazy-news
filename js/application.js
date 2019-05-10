!(function(root) {
  'use strict';

  root.app = {
    init: function() {
      this.loadNews();
    },

    loadNews: function() {
      lazyNews('#news', {        
        endpoint: {
          url: 'https://fed757.herokuapp.com/?url=https://feeds.feedburner.com/01/ar/a',
          limit: 8
        }
      });
    }
  };

  app.init();

}(this));
