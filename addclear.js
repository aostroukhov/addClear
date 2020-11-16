/*

	Base on plugin http://github.com/skorecky/Add-Clear

*/
;(function ($, window, document, undefined) {

	'use strict';

	// Create the defaults once
	var pluginName = "addClear",
		defaults = {
			returnFocus: true,
			showOnLoad: true,
			onClear: null,
			hideOnBlur: false,
			addCssRule: false,
			elementPaddingRight: 0
		};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;

		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	Plugin.prototype = {

		init: function () {

			var me = this,
				$this = $(me.element),
				options = me.options;

			options.type = me.element.type; /* 'input' or 'textarea' */

			if(options.addCssRule) {
				// WebKIT and IE
				$("<style>")
					.attr("type", "text/css")
					.html('input[type="search"]::-webkit-search-cancel-button{display:none;}::-ms-clear{display:none;}')
					.appendTo("head");
			}


			// Classes
			var getClassList = function (domNode) {
					if (typeof domNode.classList === 'undefined') {
						return domNode.className.split(/\s+/);
					} else {
						return domNode.classList;
					}
				},
				// Array of classes to copy from input to the wrapper, regexp syntax
				classesToCopy = [
					'w-.+'
				],
				thisClasses = getClassList($this[0]),
					wrapperClasses = $.grep(thisClasses, function (className) {
					for (var i = 0; i < classesToCopy.length; i++) {
						if ((new RegExp(classesToCopy[i], 'i')).test(className)) {
							return true;
						}
					}
					return false;
				});


			// Styles

			// gets the style property as rendered via any means (style sheets, inline, etc) but does *not* compute values
			// domNode - the node to get properties for
			// properties - Can be a single property to fetch or an array of properties to fetch
			// http://stackoverflow.com/a/26236976/1037948
			var getFinalStyle = function(domNode, properties) {
				if(!(properties instanceof Array)) properties = [properties];
				var parent = domNode.parentNode, originalDisplay;
				if (parent) {
					originalDisplay = parent.style.display;
					parent.style.display = 'none';
				}
				var computedStyles = window.getComputedStyle(domNode);
				var result = {};
				properties.forEach(function(prop) {
					result[prop] = computedStyles[prop];
				});

				if (parent) {
					parent.style.display = originalDisplay;
				}
				return result;
			},
			getRealStyle = function(domNode, properties) {
				var parent = domNode.parentNode;
				var originalDisplay = parent.style.display;
				parent.style.display = 'none'; // этот трюк не работает с flexbox
				var result = $(domNode).css(properties);
				parent.style.display = originalDisplay;
				return result;
			};


			// Move css float and margin from input to wrapper
			var thisCss = {},
				wrapperCss = getFinalStyle( $this[0], [
					'cssFloat',
					'marginTop',
					'marginRight',
					'marginBottom',
					'marginLeft'
				]);

			thisCss.float = "";
			thisCss.marginTop = 0;
			thisCss.marginRight = 0;
			thisCss.marginBottom = 0;
			thisCss.marginLeft = 0;


			// Fix width of input
			var styleWidth;
			//styleWidth = getFinalStyle($this[0], 'width').width; // так выдаёт ширину в пикселах
			styleWidth = getRealStyle($this[0], 'width'); // так выдаёт ширину в пикселах
			if(styleWidth.indexOf('%') > 0) {
				wrapperCss.width = styleWidth;
				thisCss.width = '100%';
			}


			var $wrapper = $this.css(thisCss).wrap("<div class=\"" + pluginName + "__wrapper\"/>").parent().addClass(wrapperClasses.join()).css(wrapperCss),

				// Copy the essential styles (mimics) from input to the button
				$button = $this.after("<div class=\"" + pluginName + "__button\"/>")
					.next()
					.css( getFinalStyle($this[0], [
						'paddingTop',
						'paddingRight',
						'fontSize',
						'fontStyle',
						'fontFamily',
						'fontWeight',
						'lineHeight',
						'wordSpacing',
						'letterSpacing',
						'textTransform'
					]));


			// Add right padding to input
			$this.css( "paddingRight", options.elementPaddingRight + $button.outerWidth() );


			var getHasScrollbar = function (el) {
					return el.clientHeight < el.scrollHeight;
				},
				positioningButton = function() {

					var hasScrollbar = getHasScrollbar($this[0]);

					if( options.hasScrollbar !== hasScrollbar ) {

						options.hasScrollbar = hasScrollbar;

						// Positioning closeSymbol, use outerHeight to avoid dimension unit error
						var css = {
							right: ($this.outerWidth(true) - $this.innerWidth()) / 2 + (hasScrollbar ? 17 : 0),
							top: ($this.outerHeight(true) - $this.innerHeight()) / 2
						};

						$button.css( css );

					}

				};


			positioningButton();


			if($this.val().length >= 1 && options.showOnLoad === true) $button.show();

			$this
				.on("focus." + pluginName, function () {
					if($(this).val().length >= 1) {
						$button.show();
					}
				})
				.on("blur." + pluginName, function () {
					var self = this;
					if(options.hideOnBlur) {
						setTimeout(function () {
							$button.hide();
						}, 50);
					}
				});


			//$this.on("keyup keydown change update cute paste", function () {
			$this.on("resize update input", function () {
				clearTimeout( options.repositionTimer );
				if($(this).val().length >= 1) {
					$button.show();
					options.repositionTimer = setTimeout( positioningButton, 150 );
				} else {
					$button.hide();
				}
			});

			$button
				.on("tap click", function (e) {
					$this
						.val("")
						.trigger("input"); // нужно, чтобы отработали другие вызовы на изменение поля
					$button.hide();
					if (options.returnFocus === true) {
						$this[0].focus();
					}
					if (options.onClear) {
						options.onClear($this);
					}
					e.preventDefault();
				})
				.attr("title", "Очистить");
		}
	};

	$.fn[pluginName] = function ( options ) {
		return this.each( function () {
			if( ! $.data( this, "plugin_" + pluginName ) ) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			} else {
				console.log(pluginName + ' already bind, skipping. Selected element is: ', this);
			}
		});
	};


})(jQuery, window, document);
