/*jshint esversion:6*/
/*

	Based on plugin http://github.com/skorecky/Add-Clear

*/
;(function ($, window, document, undefined) {

	'use strict';

	const pluginName = 'addClear',
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

			options.type = me.element.type; // 'input' or 'textarea'

			if(options.addCssRule) {
				// WebKIT and IE
				$('<style>')
					.attr('type', 'text/css')
					.html('input[type="search"]::-webkit-search-cancel-button{display:none;}::-ms-clear{display:none;}')
					.appendTo('head');
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
					for (let i = 0; i < classesToCopy.length; i++) {
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
				parent.style.display = 'none'; // this trick not work in FireFox
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

			thisCss.float = 'unset';
			thisCss.marginTop = 0;
			thisCss.marginRight = 0;
			thisCss.marginBottom = 0;
			thisCss.marginLeft = 0;


			// Fix width of input
			var styleWidth;
			//styleWidth = getFinalStyle($this[0], 'width').width;
			styleWidth = getRealStyle($this[0], 'width');
			if(styleWidth.indexOf('%') > 0) {
				wrapperCss.width = styleWidth;
				thisCss.width = '100%';
			}


			var $wrapper = $('<div class="' + pluginName + '__wrapper"/>').addClass(wrapperClasses.join()).css(wrapperCss);
			//console.log(`$wrapper: ${$wrapper}`);//debug

			$this.css(thisCss).wrap($wrapper);

			var copyStyles = [
					'paddingRight',
					'fontSize',
					'fontStyle',
					'fontWeight',
					'lineHeight',
					'wordSpacing',
					'letterSpacing',
					'textTransform'
				];

			// Для textarea нужен еще отступ сверху
			if(options.type == 'textarea') copyStyles.push('paddingTop');


			var $button = $('<div class="' + pluginName + '__button"/>');

			// Copy the essential styles (mimics) from input to the button
			var buttonCss = getFinalStyle($this[0], copyStyles);

			$button.css(buttonCss);

			$this.after($button);

			// Add right padding to input
			$this.css('paddingRight', (parseInt(buttonCss.paddingRight) + parseInt($button.outerWidth())) + 'px');



			var getHasVerticalScrollbar = function (element) {
					// Проверяем, есть ли у элемента вертикальный скроллбар
					//return element[0].scrollHeight > element.innerHeight(); // старый вариант с использованием jQuery innerHeight()
					return element[0].scrollHeight > element[0].clientHeight;
				},
				positioningButton = function() {
					var hasScrollbar = getHasVerticalScrollbar($this);
					//console.log(`hasScrollbar: ${hasScrollbar}`); //debug
					// Если появился или исчез вертикальный скролбар
					if( options.hasScrollbar !== hasScrollbar ) {
						options.hasScrollbar = hasScrollbar;
						var buttonCss = {};
						if(options.type == 'textarea') {
							buttonCss.top = ($this.outerHeight(true) - $this.innerHeight()) / 2;
							buttonCss.right = (($this.outerWidth(true) - $this.innerWidth()) / 2 + (hasScrollbar ? 17 : 0)) + 'px';
						} else {
							buttonCss.top = 'calc(50% - 1ch)';
							buttonCss.right = (($this.outerWidth(true) - $this.innerWidth()) / 2 + (hasScrollbar ? 17 : 0)) + 'px';
						}
						$button.css(buttonCss);
					}

				};


			positioningButton();


			if($this.val().length >= 1 && options.showOnLoad === true) $button.show();

			$this
				.on('focus.' + pluginName, function () {
					if($(this).val().length >= 1) {
						$button.show();
					}
				})
				.on('blur.' + pluginName, function () {
					var self = this;
					if(options.hideOnBlur) {
						setTimeout(function () {
							$button.hide();
						}, 50);
					}
				});


			$this.on('resize update input heightchange', function () {
				clearTimeout( options.repositionTimer );
				if($(this).val().length >= 1) {
					$button.show();
					options.repositionTimer = setTimeout( positioningButton, 150 );
				} else {
					$button.hide();
				}
			});

			$button
				.on('tap click', function (e) {
					$this
						.val('')
						.trigger('input'); // fire others triggers on input
					$button.hide();
					if (options.returnFocus === true) {
						$this[0].focus();
					}
					if (options.onClear) {
						options.onClear($this);
					}
					e.stopImmediatePropagation();	 // без этого срабатывает клик на родительских элементах
					e.stopPropagation();	 // без этого срабатывает клик на родительских элементах
					e.preventDefault();
				})
				.attr('title', 'Очистить');
		}
	};

	$.fn[pluginName] = function ( options ) {
		return this.each( function () {
			if( ! $.data( this, 'plugin_' + pluginName ) ) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			} else {
				console.log(pluginName + ' already bind, skipping. Selected element is: ', this);
			}
		});
	};


})(jQuery, window, document);
