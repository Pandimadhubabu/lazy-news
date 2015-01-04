/*! 
 * Lazy News
 * http://istocode.github.io/
 * Copyright (c) 2015 Billy Onjea.
 * Licensed under the MIT license.
 */
;(function(root) {
  'use strict';

  // Common vars
  var $ = root.jQuery;
  var $window = $(root);
  var $document = $(root.document);


  // Default settings
  var defaults = LazyNews.defaults = {
    // Endpoint settings
    endpoint: {
      url: '/',
      offset: 0,
      limit: 10,
    },

    // Scroll event settings
    scroll: {
      // Milliseconds to wait before handling the `scroll` event.
      // 
      // It prevents calling the scroll handler too many times. It also means 
      // that the loading of the next items will begin after the User has stopped
      // scrolling and this delay has ended.
      delay: 200,

      // The offset in pixels before reaching bottom of the page.
      // 
      // It triggers the loading of the next items 300 pixels before reaching the 
      // bottom of the document.
      offset: 250,

      // Done callback fires after the `scroll` event has been handled and the 
      // new items have been loaded.
      done: function(data, jqXHR) {},

      // Fail callback after the `scroll` event has been handled but the Ajax 
      // request has failed.
      fail: function(jqXHR, textStatus, errorThrown) {}
    }
  };


  // The constructor
  function LazyNews(el, options) {
    this._settings = $.extend(true, {}, defaults, options);

    this.$element = el.jquery ? el : $(el);
    this.$alert = $('.alert');

    this._init();
  }

  LazyNews.prototype = {
    constructor: LazyNews,

    _init: function() {
      this._attachScroll();
    },

    _attachScroll: function() {
      var self = this;
      
      // It won't handle the event if we're scrolling too fast because we're clearing the timeout.
      $window.off('scroll.lazyNews').on('scroll.lazyNews', function() {
        self._timer && window.clearTimeout(self._timer);
        self._timer = window.setTimeout(self._scrollHandler.bind(self), self._settings.scroll.delay);
      });

      // In case the document isn't very tall and there is no scroll bar.
      $window.trigger('scroll');
    },

    _hasReachedBottom: function() {
      return $window.scrollTop() > ($document.height() - $window.height() - this._settings.scroll.offset);
    },

    // Trigger the loading of the next items once the user has reached the bottom of the document.
    _scrollHandler: function() {
      if (this._hasReachedBottom()) {
        this.showAlert();
        this.loadNext();
      }
    },

    showAlert: function() {
      this.$alert.fadeIn();
    },

    hideAlert: function() {
      var self = this;
      
      root.setTimeout(function() {
        self.$alert.fadeOut();
      }, 750);
    },

    endpoint: function() {
      var query = {
        offset: this._settings.endpoint.offset,
        limit: this._settings.endpoint.limit
      };

      return this._settings.endpoint.url + '?' + $.param(query);
    },

    // Sort news items by date in ascending order.
    _ascendByDate: function(news) {
      return news.sort(function(a, b) {
        var d1 = new Date(a.published), d2 = new Date(b.published);
        return d2 > d1 ? 1 : (d2 < d1 ? -1 : 0);
      });
    },

    getMonthName: function(date) {
      return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ][(date || new Date()).getMonth()];
    },

    parseTemplate: function(str, data) {
      return str.replace(/\$\{(\w+)\}/gi, function(match, parensMatch) {
        if (data[parensMatch] !== undefined) {
          return data[parensMatch];
        }

        return match;
      });
    },

    _itemHtml: function() {
      var html = '<div class="panel-body"><h3 class="lead">${title}</h3>';

      html += '<time datetime="${published}">';
      html += '<span class="glyphicon glyphicon-time"></span> ';
      html += '<span class="month">${monthName}</span> ';
      html += '<span class="day">${day}</span>, ';
      html += '<span class="year">${year}</span></time></div>';

      return html;
    },

    _buildHtml: function(items) {
      var self = this;
      var $fragment = $(document.createDocumentFragment());

      $.each(items, function(i, item) {
        var node = document.createElement('article');
        var date = new Date(item.published.replace(/-/gi, '/'));

        // Build item data
        $.extend(item, {
          monthName: self.getMonthName(date),
          day: date.getDate(),
          year: date.getFullYear()
        });
        
        // Build item HTML
        node.className = 'panel panel-default story';
        node.innerHTML = self.parseTemplate(self._itemHtml(), item);
        
        // Append it
        $fragment.append(node);
      });

      // Append this batch
      this.$element.append($fragment);
    },

    loadNext: function() {
      var self = this;

      // It assumes the backend has enabled CORS
      this.$xhr = $.ajax({
        url: this.endpoint(),
        dataType: 'json',
        cache: false
      });

      // Success
      this.$xhr.done(function(data, textStatus, jqXHR) {
        if (data && data.news && data.news.length) {
          // Sort & built the html
          self._ascendByDate(data.news);
          self._buildHtml(data.news);

          // Yield to `done` option
          self._settings.scroll.done.call(self, data.news, jqXHR);

          // Move to the next batch
          self._settings.endpoint.offset += self._settings.endpoint.limit;
        }
      });

      // Failure
      this.$xhr.fail(this._settings.scroll.fail);

      // Always
      this.$xhr.always(function() {
        self.hideAlert();
      });
    }
  };


  // Export
  root.lazyNews = function() {
    return new LazyNews(arguments[0], arguments[1]);
  };

}(this));
