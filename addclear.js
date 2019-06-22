//
// Website: http://stephenkorecky.com
// Plugin Website: http://github.com/skorecky/Add-Clear
;(function ($, window, document, undefined) {
	// Create the defaults once
	var pluginName = "addClear",
		defaults = {
			returnFocus: true,
			showOnLoad: true,
			onClear: null,
			hideOnBlur: false,
			addCssRule: false
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

			var $this = $(this.element),
				me = this,
				options = this.options;

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
			};

			var getRealStyle = function(domNode, properties) {
				var parent = domNode.parentNode;
				var originalDisplay = parent.style.display;
				parent.style.display = 'none'; // этот трюк не работает с flexbox
				var result = $(domNode).css(properties);
				parent.style.display = originalDisplay;
				return result;
			};

			var wrapperCss = {}, thisCss = {};
			// Fix width of input
			var styleWidth;
			//styleWidth = getFinalStyle($this[0], 'width').width; // так выдаёт ширину в пикселах
			styleWidth = getRealStyle($this[0], 'width'); // так выдаёт ширину в пикселах
			if(styleWidth.indexOf('%') > 0) {
				$.extend(wrapperCss, { 'width': styleWidth } );
				$.extend(thisCss, { 'width': '100%' } );
			}

			// Move css float from input to wrapper
			$.extend(wrapperCss, { 'float': getFinalStyle($this[0], 'cssFloat').cssFloat } );
			$.extend(thisCss, { 'float': '' } );

			var $wrapper = $this.css(thisCss).wrap("<div class=\"addClear__wrapper\"/>").parent().addClass(wrapperClasses.join()).css(wrapperCss),
				$closeSymbol = $this.after("<div class=\"addClear__closeSymbol\"/>").next();

			// Copy the essential styles (mimics) from input to the closeSymbol
			var mimics = [
				'paddingTop',
				'paddingBottom',
				'fontSize',
				'fontStyle',
				'fontFamily',
				'fontWeight',
				'lineHeight',
				'wordSpacing',
				'letterSpacing',
				'textTransform'
			];
			var i = mimics.length;
			while(i--) $closeSymbol.css(mimics[i].toString(), $this[0].style[mimics[i].toString()]);


			// Positioning closeSymbol, use outerHeight to avoid dimension unit error
			$closeSymbol.css({
				right: $this.css("padding-right"),
				top: ($this.outerHeight(false) + parseInt($this.css("margin-top"),10) - $closeSymbol.outerHeight()) / 2,
				width: $closeSymbol.outerHeight()
			});

			// Add right padding to input
			$this.css({
				paddingRight: $this.css("padding-right") + $closeSymbol.outerWidth()
			});

			if($this.val().length >= 1 && options.showOnLoad === true) $closeSymbol.show();

			$this.focus(function () {
				if($(this).val().length >= 1) {
					$closeSymbol.show();
				}
			});

			$this.blur(function () {
				var self = this;
				if(options.hideOnBlur) {
					setTimeout(function () {
						$closeSymbol.hide();
					}, 50);
				}
			});

			//$this.on("keyup keydown change update cute paste", function () {
			$this.on("input", function () {
				if($(this).val().length >= 1) {
					$closeSymbol.show();
				} else {
					$closeSymbol.hide();
				}
			});

			$closeSymbol.on("tap click", function (e) {
				var $input = $(me.element);
				$input
					.val("")
					.trigger("input"); // нужно, чтобы отработали другие вызовы на изменение поля
				$(this).css({display: 'none'});
				if (options.returnFocus === true) {
					$input.focus();
				}
				if (options.onClear) {
					options.onClear($input);
				}
				e.preventDefault();
			});
		}
	};

	$.fn[pluginName] = function (options) {

		// If the array is empty, do nothing
		if(!$(this).length) {	return this; }

		return this.each(function () {
			if( ! $.data( this, "plugin_" + pluginName ) ) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			} else {
				console.log(pluginName + ' already bind, skipping. Selected element is: ', this);
			}
		});
	};


})(jQuery, window, document);
