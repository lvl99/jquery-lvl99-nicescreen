/* Modernizr */
var Modernizr = require('./modernizr.js');

var lvl99 = window.lvl99 || {};

(function ($, lvl99, document, window, undefined) {
  
  'use strict';

  if ( !window.jQuery ) throw new Error('Nice Screen fatal error: jQuery isn\'t installed');
  
  var $doc = $(document),
      $html = $('html'),
      $body = $('body'),
      $win = $(window),
      __eventsAnimStart__ = 'animationstart mozAnimationStart webkitAnimationStart msAnimationStart oAnimationStart',
      __eventsAnimEnd__ = 'animationend mozAnimationEnd webkitAnimationEnd msAnimationEnd oAnimationEnd';
  
  /**
  Nice Screen Plugin
  
  @module nicescreen
  @package lvl99.nicescreen
  **/
  $.extend(lvl99, {
    nicescreen: {
      /**
      Nice Screen version
      
      @property
      @type {String}
      **/
      version: '0.1.0.20160124',
      
      /**
      Nice Screen global plugin options
      
      @property options
      @type {Object}
      **/
      options: {
      
        /**
        Enable/disable the hashchange event
        
        @property allowHashChange
        @type {Boolean}
        **/
        allowHashChange: true,
        
        /**
        Enable/disable the NiceScreen refresh event on window resize
        
        @property allowResizeRefresh
        @type {Boolean}
        **/
        allowResizeRefresh: true,
        
        /**
        The time in milliseconds to trigger the resize refresh
        
        @property checkResizingTime
        @type {Number}
        **/
        checkResizingTime: 150,
        
        /**
        Do a persistent check for refresh
        
        @property persistentRefresh
        @type {Boolean}
        **/
        persistentRefresh: false,
        
        /**
        Persistent refresh time in milliseconds
        
        @property persistentRefreshTime
        @type {Number}
        **/
        persisentRefreshTime: 6000,
        
        /**
        Defaults for new NiceScreen elements
        
        @property defaults
        @type {Object}
        **/
        defaults: {
          group: 'default', // string
          row: 0, // int
          column: 0 // int
        },
        
        /**
        The attributes to detect on elements to then carry through to the options set when establishing a new NiceScreen.
        [key] is the attribute to check for, [value] is the option name to set it to
        
        @property attributeOptions
        @type {Object}
        **/
        attributeOptions: {
          group: 'data-nicescreen-group',
          row: 'data-nicescreen-row',
          column: 'data-nicescreen-column'
        }
      },
      
      /**
      Nice Screen global tracking variables
      
      @property track
      @type {Object}
      **/
      track: {
        /**
        Window width for checking the resizing
        
        @property windowWidth
        @type {Number}
        **/
        windowWidth: $win.width(),
        
        /**
        Window height for checking the resizing
        
        @property windowHeight
        @type {Number}
        **/
        windowHeight: $win.height(),
        
        /**
        NiceScreen groups for tracking the row/column values
        
        @property groups
        @type {Object}
        **/
        groups: {},
        /* e.g. {
          default: {
            row: 0,
            column: 0
          }
        } */
        
        /**
        Currently active screens
        
        @property screens
        @type {jQuery Object}
        **/
        screens: $(''),
        
        /**
        The timer for the checkResizing function
        
        @property checkResizingTimer
        @type {Number}
        **/
        checkResizingTimer: 0,
        
        /**
        The setInterval var for persistent refreshing
        
        @property persistentRefreshTimer
        @type {Number}
        **/
        persistentRefreshTimer: 0
      },
      
      /**
      Nice Screen utility methods
      
      @property utils
      @type {Object}
      **/
      utils: {
      
        /**
        Starts to check if the window is being resizes
        
        @method startCheckResizing
        @returns {Void}
        **/
        startCheckResizing: function () {
          clearTimeout(lvl99.nicescreen.track.checkResizingTimer);
          
          $html.addClass('ui-nicescreen-resizing');
          lvl99.nicescreen.utils.checkResizing();
        },
      
        /**
        Checks if the window is being resized
        
        @method checkResizing
        @returns {Void}
        **/
        checkResizing: function () {
          var windowWidth = $win.width(),
            windowHeight = $win.height();
          
          clearTimeout(lvl99.nicescreen.track.checkResizingTimer);
          
          if ( $html.is('.ui-nicescreen-resizing') ) {
            if ( windowWidth === lvl99.nicescreen.track.windowWidth && windowHeight === lvl99.nicescreen.track.windowHeight ) {
              lvl99.nicescreen.utils.resizeRefresh();
            } else {
              lvl99.nicescreen.track.windowWidth = windowWidth;
              lvl99.nicescreen.track.windowHeight = windowHeight;
              lvl99.nicescreen.track.checkResizingTimer = setTimeout(function () {
                lvl99.nicescreen.utils.checkResizing();
              }, lvl99.nicescreen.options.checkResizingTime );
            }
          } else {
            lvl99.nicescreen.utils.resizeRefresh();
          }
        },
        
        /**
        Resizes all the nicescreen screens after the window has finished resizing
        
        @method resizeRefresh
        @returns {Void}
        **/
        resizeRefresh: function () {
          lvl99.nicescreen.track.windowWidth = $win.width();
          lvl99.nicescreen.track.windowHeight = $win.height();
          $html.removeClass('ui-nicescreen-resizing');
          clearTimeout(lvl99.nicescreen.track.checkResizingTimer);
          $('[data-nicescreen="true"]').trigger('event-nicescreen-refresh');
          $doc.trigger('event-nicescreen-resize-refresh', [ lvl99.nicescreen.track.windowWidth, lvl99.nicescreen.track.windowHeight ]);
        },
        
        /**
        Starts the persistent refresh
        
        @method startPersistentRefresh
        **/
        startPersistentRefresh: function () {
          var self = lvl99.nicescreen;
          
          self.utils.stopPersistentRefresh();
          
          self.track.persistentRefreshTimer = setInterval(function () {
            if ( !$html.is('.ui-nicescreen-resizing') ) {
              lvl99.nicescreen.utils.resizeRefresh();
              $doc.trigger('event-nicescreen-persistent-refresh');
            }
          }, self.options.persistentRefreshTime);
        },
        
        /**
        Stops the persistent refresh
        
        @method stopPersistentRefresh
        **/
        stopPersistentRefresh: function () {
          clearInterval(lvl99.nicescreen.track.persistentRefreshTimer);
        },
        
        /**
        Relative to absolute number formats
        
        @property relativeToActualFormats
        @type {Object}
        **/
        relativeToActualFormats: {
          percentage: {
            re: /^([\-\d\.]+)%$/i,
            method: function (relative, maxActual) {
              relative = lvl99.nicescreen.utils.convertStringToNumber(relative);
              return (relative/100)*maxActual;
            }
          },
          pixels: {
            re: /^([\-\d\.]+)px$/i,
            method: function (relative) {
              relative = lvl99.nicescreen.utils.convertStringToNumber(relative);
              return relative;
            }
          },
          alignment: {
            re: /^(left|center|right|top|middle|bottom)$/i,
            method: function (relative, maxActual) {
              switch (relative) {
              case 'left':
              case 'top':
                relative = 0;
                break;
              case 'center':
              case 'middle':
                relative = 0.5;
                break;
              case 'right':
              case 'bottom':
                relative = 1;
                break;
              }
              return relative*maxActual;
            }
          },
          seconds: {
            re: /^[\-\d\.]+s$/i,
            method: function (relative) {
              relative = lvl99.nicescreen.utils.convertStringToNumber(relative);
              return relative*1000;
            }
          },
          milliseconds: {
            re: /^([\-\d\.]+)ms$/i,
            method: function (relative) {
              relative = lvl99.nicescreen.utils.convertStringToNumber(relative);
              return relative;
            }
          },
          ems: {
            re: /^([\-\d\.]+)em$/i,
            method: function (relative, maxActual) {
              relative = lvl99.nicescreen.utils.convertStringToNumber(relative);
              return (relative/1)*maxActual;
            }
          }
        },
        
        /**
        Converts a string value to a number. Detects whether to convert to int or float
        
        @method convertStringToNumber
        @param {String} input
        @returns {Number}
        **/
        convertStringToNumber: function (input) {
          var output = input;
          
          // If it's not a string, assume type already set
          if (typeof input !== 'string') {
            return input;
          }
          
          // Output float
          if (input.match(/\./)) {
            output = parseFloat(input.replace(/[^\d\-\.]+/g, ''));
            
          // No leading zero, output int
          } else if (!input.match(/^0/)) {
            output = parseInt(input.replace(/[^\d\-]+/g, ''), 10);
          }
          
          //console.log('convertStringToNumber', input, typeof input, output, typeof output);
          
          return output;
        },
        
        /**
        Converts a string value to its JS primitive (number, boolean, undefined, null)
        
        @method convertStringToPrimitive
        @param {String} input
        @returns output
        **/
        convertStringToPrimitive: function (input) {
          var output = input;
          
          // If it's not a string, assume type already set
          if (typeof input !== 'string') {
            return input;
          }
          
          // Boolean/undefined/null check
          if (input === 'true') {
            output = true;
          } else if (input === 'false') {
            output = false;
          } else if (input === 'undefined') {
            output = undefined;
          } else if (input === 'null') {
            output = null;
          }
          
          // Number check
          if (input.match(/^[\d\-\.]+$/)) {
            output = lvl99.nicescreen.utils.convertStringToNumber(input);
          }
          
          //console.log('convertStringToPrimitive', input, typeof input, output, typeof output);
          
          return output;
        },
        
        /**
        Converts a relative value (always a string) to an actual number value (optional: you can pass a maximum actual value)
        
        @method convertRelativeToActual
        @param {String} relative
        @param {Number} maxActual
        @returns {Number}
        **/
        convertRelativeToActual: function (relative, maxActual) {
          var output,
              RTAFormat,
              RTAMatch,
              i;
          
          // Go through each relativeToActualFormats to check to see which one the relative value matches against
          for (i in lvl99.nicescreen.utils.relativeToActualFormats) {
            RTAFormat = lvl99.nicescreen.utils.relativeToActualFormats[i];
            
            // Check for match
            if (relative.match(RTAFormat.re)) {
              output = RTAFormat.method.call(lvl99.nicescreen, relative, maxActual);
              break;
            }
          }
          
          //console.log('convertRelativeToActual', relative, maxActual, output);
          
          return output;
        },
        
        /**
        Gets certain attributes from an HTML element (see lvl99.nicescreen.options.attributeOptions for reference)
        
        @method getAttributesFromElement
        @param {HTMLElement} elem
        @returns {Object}
        **/
        getAttributesFromElement: function (elem) {
          var $elem = $(elem),
              attr,
              options = {},
              i;
          
          // No such element exists
          if ($elem.length === 0) {
            return options;
          }
          
          // Process the attributeOptions to check the elem for each attribute set
          for (i in lvl99.nicescreen.options.attributeOptions) {
            attr = $elem.attr(lvl99.nicescreen.options.attributeOptions[i]);
            if (typeof attr !== 'undefined') {
              options[i] = lvl99.nicescreen.utils.convertStringToPrimitive(attr);
            }
          }
          
          return options;
        }
      },
      
      /**
      Nice Screen Constructor
      Attaches an Nice Screen handler to the element, effectively turning the element into a screen for use.
      
      @class NiceScreen
      @constructor
      @param {HTMLElement} elem
      @param {Object} options
      **/
      NiceScreen: function (elem, options) {
        var self = this,
            $elem = $(elem),
            $viewport = $elem.parents('.ui-nicescreen-viewport').first(),
            group = $elem.parents('[data-nicescreen-group]').first().attr('data-nicescreen-group');
        
        // Make sure elem exists
        if ($elem.length === 0 || elem.nicescreen) return;
        
        // Create elem's quick reference to NiceScreen handler
        elem.nicescreen = self;
        
        // Make sure that NiceScreen handler has quick access to the elem too
        self.elem = elem;
        
        // Build the options for the NiceScreen handler
        self.options = $.extend(
          {},
          lvl99.nicescreen.options.defaults, // The default options set
          lvl99.nicescreen.utils.getAttributesFromElement($viewport), // Get options set on the viewport HTML element
          lvl99.nicescreen.utils.getAttributesFromElement(elem), // Get options set on the screen's HTML element
          options // Get options set via JS call
        );
        if ( group ) self.options.group = group;
        
        // Create new tracking object for the group's rows and columns
        if ( !lvl99.nicescreen.track.groups[group] ) {
          lvl99.nicescreen.track.groups[group] = {
            row: 0,
            column: 0
          };
        }
        
        // Add to the global tracking screens object
        lvl99.nicescreen.track.screens.push(elem);
        
        // Set attributes/properties/classes on the screen element
        $elem
          // Add class
          .addClass('ui-nicescreen')
          // Set the group name per screen
          .attr('data-nicescreen-group', self.options.group);
          
        // Check that an item is set, if not set it
        if ( $viewport.find('.ui-nicescreen-active').length === 0 ) {
          $viewport.children().filter('.ui-nicescreen').first().addClass('ui-nicescreen-active').show();
        }
        
        // Methods
        
        /**
        Refreshes the screen dimensions and positions
        
        @method refresh
        */
        self.refresh = function () {
          var self = this,
              $elem = $(self.elem),
              $viewport = $elem.parents('.ui-nicescreen-viewport').first(),
              viewportGroup = $viewport.attr('data-nicescreen-group'),
              viewportWidth = $viewport.outerWidth(),
              viewportHeight = $viewport.outerHeight();
          
          $elem.trigger('event-nicescreen-set-dimensions', [ $viewport[0], viewportWidth, viewportHeight ]);
        };
        
        /**
        Shows a screen without a transition
        
        @method show
        **/
        self.show = function () {
          var self = this,
              $elem = $(self.elem),
              $activeElem = $('[data-nicescreen="true"][data-nicescreen-group="'+self.options.group+'"].ui-nicescreen-active'),
              current;
          
          // Abort transition as screen is already transitioning
          if ($html.is('.ui-nicescreen-transitioning') || $elem[0] === $activeElem[0]) {
            return;
          }
          
          // Track global transition action
          $doc.trigger('event-nicescreen-show-start', [self.elem]);

          // Hide the active screen
          $activeElem.trigger('event-nicescreen-hide');
          
          // Enter the next element
          $elem
            // Prep before transition
            .addClass('ui-nicescreen-active');

          // Untrack global transition action
          $doc.trigger('event-nicescreen-show-end', [self.elem]);
        };

        /**
        Hides the screen without a transition

        @method hide
        **/
        self.hide = function () {
          var self = this,
              $elem = $(self.elem);

          // Exit the active elems
          $elem
            .trigger('event-nicescreen-hide-start')
            .removeClass('ui-nicescreen-active')
            .trigger('event-nicescreen-hide-end');
        };
        
        /**
        Reveal the screen by transition
        
        @method reveal
        */
        self.reveal = function () {
          var self = this,
              $elem = $(self.elem),
              $activeElem = $('[data-nicescreen="true"][data-nicescreen-group="'+self.options.group+'"].ui-nicescreen-active'),
              current,
              enterCssClass,
              exitCssClass,
              dirX, dirY;
          
          // Abort transition as screen is already transitioning
          if ($html.is('.ui-nicescreen-transitioning') || $elem[0] === $activeElem[0]) {
            return;
          }
          
          // Get direction of entry
          if ($activeElem.length > 0) {
            current = $activeElem[0].nicescreen;
            
            // Figure out which has bigger different to transition on axis
            dirX = current.options.column - self.options.column;
            dirY = current.options.row - self.options.row;

            // Transition by Y axis
            if (Math.abs(dirY) > Math.abs(dirX) ) {
              if (self.options.row > current.options.row) {
                enterCssClass = 'ui-nicescreen-animation-enterfrombottom';
                exitCssClass = 'ui-nicescreen-animation-exittotop';
              } else {
                enterCssClass = 'ui-nicescreen-animation-enterfromtop';
                exitCssClass = 'ui-nicescreen-animation-exittobottom';
              }
            // Transition by X axis
            } else {
              if (self.options.column > current.options.column) {
                enterCssClass = 'ui-nicescreen-animation-enterfromright';
                exitCssClass = 'ui-nicescreen-animation-exittoleft';
              } else {
                enterCssClass = 'ui-nicescreen-animation-enterfromleft';
                exitCssClass = 'ui-nicescreen-animation-exittoright';
              }
            }
          }
          
          // console.log('current='+$activeElem.attr('id')+': r='+current.options.row+', c='+current.options.column+', a='+exitCssClass+';\nnew='+$elem.attr('id')+': r='+self.options.row+', c='+self.options.column+', a='+enterCssClass);
          
          // Track global transition action
          $html.addClass('ui-nicescreen-transitioning');
          $doc.trigger('event-nicescreen-transition-start', [self.elem]);
          
          // Exit the active elems
          $activeElem
            // Prep before transition
            .one(__eventsAnimEnd__, function (event) {
              $(this)
                .removeClass('ui-nicescreen-transitioning ui-nicescreen-exiting ui-nicescreen-animation '+exitCssClass)
                .trigger('event-nicescreen-hide')
                .trigger('event-nicescreen-exit-end');
            })
            // Start transition
            .addClass('ui-nicescreen-transitioning ui-nicescreen-exiting ui-nicescreen-animation '+exitCssClass)
            .trigger('event-nicescreen-exit-start');
          
          // Enter the next element
          $elem
            // Prep before transition
            .one(__eventsAnimEnd__, function (event) {
              $(this)
                .removeClass('ui-nicescreen-transitioning ui-nicescreen-entering ui-nicescreen-animation '+enterCssClass)
                .addClass('ui-nicescreen-active')
                .trigger('event-nicescreen-enter-end');
              
              // Untrack global transition action
              $html.removeClass('ui-nicescreen-transitioning');
              $doc.trigger('event-nicescreen-transition-end', [self.elem]);
            })
            // Start transition
            .addClass('ui-nicescreen-transitioning ui-nicescreen-entering ui-nicescreen-animation '+enterCssClass)
            // .show()
            .trigger('event-nicescreen-enter-start');
        };
        
        /**
        Destroys the Nice Screen handler from the element
        
        @method destroy
        */
        self.destroy = function () {
          var self = this,
              $elem = $(self.elem);
          
          // Remove the item in the global tracking screens option
          lvl99.nicescreen.track.screens.each(function (i, item) {
            if ( item == self.elem ) delete lvl99.nicescreen.track.screens[i];
          });
          
          // Remove nicescreen options/methods on the elem
          $elem.removeAttr('data-nicescreen');
          delete self.elem.nicescreen;
        };
        
        // Mark the element as having Nice Screen applied
        $elem.attr('data-nicescreen', 'true');
        
        // Refresh the Nice Screen on the element
        self.refresh();
      }
    }
  });
  
  /**
  Global events
  **/
  $doc
    /**
    Trigger the element's Nice Screen handler's refresh method
    **/
    .on('event-nicescreen-refresh', '[data-nicescreen="true"]', function (event, viewportWidth, viewportHeight) {
      var elem = event.target || this;
      
      if (elem.nicescreen) elem.nicescreen.refresh(viewportWidth, viewportHeight);
    })
    
    /**
    Trigger the element's Nice Screen handler's show method
    **/
    .on('event-nicescreen-show', '[data-nicescreen="true"]', function (event) {
      var elem = event.target || this;
      
      if (elem.nicescreen) elem.nicescreen.show();
    })

    /**
    Trigger the element's Nice Screen handler's hide method
    **/
    .on('event-nicescreen-hide', '[data-nicescreen="true"]', function (event) {
      var elem = event.target || this;
      
      if (elem.nicescreen) elem.nicescreen.hide();
    })
    
    /**
    Trigger the element's Nice Screen handler's reveal method
    **/
    .on('event-nicescreen-reveal', '[data-nicescreen="true"]', function (event) {
      var elem = event.target || this;
      
      if (elem.nicescreen) elem.nicescreen.reveal();
    })
    
    /**
    Trigger the element's Nice Screen handler's destroy method
    **/
    .on('event-nicescreen-destroy', '[data-nicescreen="true"]', function (event) {
      var elem = event.target || this;
      
      if (elem.nicescreen) elem.nicescreen.destroy();
    });
  
  /**
  Nice Screen jQuery Plugin Handler
  
  @module nicescreen
  @package jQuery
  **/
  $.fn.nicescreen = function (options) {
    return this.each(function (index, elem) {
      new lvl99.nicescreen.NiceScreen(elem, options);
    });
  };
  
  // Window resize event
  if ( lvl99.nicescreen.options.allowResizeRefresh ) {
    $win.resize( function () {
      lvl99.nicescreen.utils.startCheckResizing();
    });
  }
  
  // Orientation change event
  $doc.on('orientationchange', function () {
    lvl99.nicescreen.utils.startCheckResizing();
  });
  
  // Click link to nicescreen
  $win.on('hashchange', function (event) {
    var $checkElem = $(window.location.hash),
      $checkElemParents = $checkElem.parents().filter('[data-nicescreen="true"]');

    if ( lvl99.nicescreen.options.allowHashChange ) {
      // Transition to the referred screen
      if ( $checkElem.is('[data-nicescreen="true"]') ) {
        $checkElem.trigger('event-nicescreen-reveal');

        // Ensure parents are visible too
        if ( $checkElemParents.length > 0 ) {
          $checkElemParents.trigger('event-nicescreen-reveal');
        }
      }
    }
  });

  
  /* Debugging */
  
  $doc
    .on('event-nicescreen-show', '[data-nicescreen="true"]', function (event) {
      console.log('Triggered event-nicescreen-show for #'+$(this).attr('id'));
    })
    
    .on('event-nicescreen-reveal', '[data-nicescreen="true"]', function (event) {
      console.log('Triggered event-nicescreen-reveal for #'+$(this).attr('id'));
    })
    
    .on('event-nicescreen-exit', '[data-nicescreen="true"]', function (event) {
      console.log('Triggered event-nicescreen-exit for #'+$(this).attr('id'));
    })
    
    .on('event-nicescreen-refresh', '[data-nicescreen="true"]', function (event) {
      console.log('Triggered event-nicescreen-refresh for #'+$(this).attr('id'));
    })
  
    // Debug animationstart
    .on(__eventsAnimStart__, '.ui-nicescreen', function (event) {
      console.log(event.type, '#'+event.target.id);
    })
    
    // Debug animationend
    .on(__eventsAnimEnd__, '.ui-nicescreen', function (event) {
      console.log(event.type, '#'+event.target.id);
    });
  

  // Automatically start the persistent refresh
  if ( lvl99.nicescreen.options.persistentRefresh ) lvl99.nicescreen.utils.startPersistentRefresh();
  
}(jQuery, lvl99, document, window));