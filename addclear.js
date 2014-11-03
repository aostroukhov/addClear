//
// Website: http://stephenkorecky.com
// Plugin Website: http://github.com/skorecky/Add-Clear
;
(function ($, window, document, undefined) {

	// Create the defaults once
	var pluginName = "addClear",
		defaults = {
			//closeSymbol: "&#10006;",
			closeSymbol: "&#215;", //Multiplication sign
			color: "#999",
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


			var addCssRule = function(/* string */ selector, /* string */ rule) {
				if (document.styleSheets) {
					if (!document.styleSheets.length) {
						var head = document.getElementsByTagName('head')[0];
						head.appendChild(bc.createEl('style'));
					}

					var i = document.styleSheets.length-1;
					var ss = document.styleSheets[i];

					var l=0;
					if (ss.cssRules) {
						l = ss.cssRules.length;
					} else if (ss.rules) {
						// IE
						l = ss.rules.length;
					}

					try {
						if (ss.insertRule) {
							ss.insertRule(selector + ' {' + rule + '}', l);
						} else if (ss.addRule) {
							// IE
							ss.addRule(selector, rule, l);
						}
					} catch (e) {
						console.log(e.name)
					} finally {
						// console.log("finished")
					}
				}
			};


			if(options.addCssRule) {
				// WebKIT
				addCssRule('input[type="search"]::-webkit-search-cancel-button', 'display: none;');
				// IE
				addCssRule('::-ms-clear', 'display: none;');
			}

			var $wrapper = $this.wrap("<div style='position:relative;display:inline-block;margin:0;padding:0;'/>").parent();
			var $closeSymbol = $this.after("<div style='display: none;'>" + options.closeSymbol + "</div>").next();
			$closeSymbol.css({
				color: options.color,
				'text-decoration': 'none',
				'text-align': 'center',
				overflow: 'hidden',
				position: 'absolute',
				margin: 0,
				cursor: 'pointer',
				'box-sizing': 'border-box',
				'-webkit-tap-highlight-color': 'rgba(0,0,0,0)',
				'-webkit-touch-callout': 'none',
				'-webkit-user-select': 'none'
			});

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

			// Fix width of input
			if($this[0].style['width'].indexOf('%') > 0) {
				$wrapper.css({
					'width': $this[0].style['width']
				});
				$this.css({
					'width': '100%'
				});
			}

			// Move css float from input to wrapper
			$wrapper.css({
				'float': $this[0].style.cssFloat
			});
			$this.css({
				'float': ''
			});

			// Positioning closeSymbol, use outerHeight to avoid dimension unit error
			$closeSymbol.css({
				right: 0,
				top: ($wrapper.outerHeight() - $closeSymbol.outerHeight()) / 2,
				width: $closeSymbol.outerHeight()
			});

			// Add right padding to input
			$this.css({
				paddingRight: $closeSymbol.outerWidth()
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

			$this.keyup(function () {
				if($(this).val().length >= 1) {
					$closeSymbol.show();
				} else {
					$closeSymbol.hide();
				}
			});

			$closeSymbol.on("tap click", function (e) {
				$(this).siblings(me.element).val("");
				$(this).hide();
				if(options.returnFocus === true) {
					$(this).siblings(me.element).focus();
				}
				if(options.onClear) {
					options.onClear($(this).siblings("input"));
				}
				e.preventDefault();
			});
		}
	};

	$.fn[pluginName] = function (options) {
		if(!$(this).length) {
			return this;
		}
		return this.each(function () {
			if(!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName,
					new Plugin(this, options));
			} else {
				console.log(pluginName + ' already bind, skipping. Selected element is: ', this);
			};
		});
	};

})(jQuery, window, document);
