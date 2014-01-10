/*
 * PixelatedVision.com
 *
 *
 * This uses a Self-Executing Anonymous Function to declare the namespace "Main" and create public and private members within it.
 *
 * @author Kevin Dean
 *
 */

/*
 * @param Main: Defines the namespace to use for public members of this class.
 * @param undefined: Nothing should be passed via this parameter. This ensures that you can use "undefined" here without worrying that another loaded
 *						script as redefined the global variable "undefined".
 */
(function(Main, undefined) {
	//Note: "use strict" prevents this file from being read correctly from a remote server. Unsure why...

	/**********************
	 * Constants
	 **********************/
	var BASE_URL_TXT = "http://www.pixelatedvision.com/";
	var TRANS_END_EVENT_NMS = ["webkitTransitionEnd", "transitionend", "msTransitionEnd", "oTransitionEnd"];
	var DYNAMIC_CONTENT_LOADED_NM = "loaded";


	/**********************
	 * Global variables
	 **********************/
	var _projContent = [], _dynamicContentCntnr;



	/**********************
	 * Public methods
	 **********************/


	/*
	 * Initilializes the page.
	 */
	Main.Init = function() {

		setupPrototypes();
		createDefaultRequest();
		
		_dynamicContentCntnr = document.getElementById("dynamicContentCntnr");

		addDynamicContentEventListeners();
		initLinks();


		/* Bind History.js to the StateChange event.
		 *
		 * NOTE: It is necessary to implement this "statechange" listener as an anonymous function like this. Handing it a function reference
		 * instead results in the event not being caught. And because history.js fires the history.popstate event, this will cause the browser to
		 * load the URL you just pushed to state. Note also that history.js is based on the paradigm that it updates history state and THEN you
		 * perform the ajax call to load that state.
		 */
		History.Adapter.bind(window, "statechange", function() {
			var contentTxt = History.getState().url.replace(BASE_URL_TXT, "");

			if  (contentTxt > "") {
				if (document.getElementById(contentTxt)) {
					// The content is already loaded.
				} else {
					reqProjContent(History.getState().url);
				}
			} else {
				// If we're going to the state of the normal homepage, we'll ensure the dynamic content container is empty.
				_dynamicContentCntnr.innerHTML = "";
			}
		});
	};



	/**********************
	 * Private method
	 **********************/


	function setupPrototypes() {
		Element.prototype.hasClassName = function(inpNm) {
		    return new RegExp("(?:^|\\s+)" + inpNm + "(?:\\s+|$)").test(this.className);
		};

		Element.prototype.addClassName = function(inpNm) {
		    if (!this.hasClassName(inpNm)) {
		        this.className = this.className ? [this.className, inpNm].join(" ") : inpNm;
		    }
		};

		Element.prototype.removeClassName = function(inpNm) {
		    if (this.hasClassName(inpNm)) {
		        var c = this.className;
		        this.className = c.replace(new RegExp("(?:^|\\s+)" + inpNm + "(?:\\s+|$)", "g"), "");
		        /* (?:^|\s) = Match the start of the string or any single whitespace character
				 * load = The class name to remove
				 * (?!\S) = Negative look-ahead to verify the above is the whole class name. It ensures there is no non-space character following (i.e., it must be the end of string or a space)
				 */
		    }
		};
	}



	function createDefaultRequest() {
		var baseReq = new XMLHttpRequest();
		baseReq.ID = "";
		baseReq.responseText = "";
		baseReq.onload = handleProjContentReqLoad;
		baseReq.onerror = handleProjContentReqError;
		_projContent[BASE_URL_TXT] = baseReq;
	}



	function addDynamicContentEventListeners() {
		var transitionEndHandler = function() {
			if (_dynamicContentCntnr.hasClassName(DYNAMIC_CONTENT_LOADED_NM) === false) {

				var currStateUrlTxt = History.getState().url;

				_dynamicContentCntnr.innerHTML = _projContent[currStateUrlTxt].responseText;
				_dynamicContentCntnr.addClassName(DYNAMIC_CONTENT_LOADED_NM);

				var collapseLink = document.getElementById("dynamicContentCollapseLink");
				addDynamicContentCollapseClickListener(collapseLink);
			} else {
				// The appropriate content is loaded and now visible, so we don't have to do anything.
			}
		};

		for (var idx = 0, lenNbr = TRANS_END_EVENT_NMS.length; idx < lenNbr; idx++) {
			_dynamicContentCntnr.addEventListener(TRANS_END_EVENT_NMS[idx], transitionEndHandler);
		}
	}



	function initLinks() {
		var linkElems = document.getElementsByTagName("a");

		for (var idx = 0; idx < linkElems.length; idx++) {
			if (linkElems[idx].className == "dynamicContentLink") {
				addDynamicContentClickListener(linkElems[idx]);
			} else if (linkElems[idx].id == "dynamicContentCollapseLink") {
				// If a collapse link exists upon page initialization, it means the user came to the site with a dynamic-content URL.
				addDynamicContentCollapseClickListener(linkElems[idx]);
			}
		}
	}



	function addDynamicContentCollapseClickListener(inpCollapseLink) {
		if (inpCollapseLink) {
			inpCollapseLink.addEventListener("click", function(inpEvent) {
				History.pushState({urlPathTxt: BASE_URL_TXT}, null, BASE_URL_TXT);
				inpEvent.preventDefault();  // We are handling link click events ourselves.
			});
		}
	}



	function addDynamicContentClickListener(inpProjLink) {
		inpProjLink.addEventListener("click", function(inpEvent) {

			History.pushState({urlPathTxt: inpProjLink.href}, null, inpProjLink.href);
			inpEvent.preventDefault();  // We are handling link click events ourselves.
		});
	}



	function reqProjContent(inpProjUrlTxt) {

		var req = new XMLHttpRequest();

		if (inpProjUrlTxt in _projContent) {
			req = _projContent[inpProjUrlTxt];

			var reqLoadEvent;

			try {
				reqLoadEvent = new Event("load");
			}
			catch(inpError) {
				reqLoadEvent = document.createEvent("Event");
				reqLoadEvent.initEvent("load", false, false);
			}

			req.dispatchEvent(reqLoadEvent);
		} else {
			_projContent[inpProjUrlTxt] = req;
			req.ID = inpProjUrlTxt;
			req.open("GET", inpProjUrlTxt, true);
			// We add this header so that our server-side script understands where this request is coming from (i.e., that it's an ajax request rather
			// than someone using a full URL).
			req.setRequestHeader("X_REQUESTED_WITH", "xmlhttprequest");
			req.onload = handleProjContentReqLoad;
			req.onerror = handleProjContentReqError;
			req.send(null);
		}
	}



	function handleProjContentReqLoad() {

		// Fade out any existing content. The completion of this CSS transition will fire an event, which we will handle and load the new content.
		_dynamicContentCntnr.removeClassName(DYNAMIC_CONTENT_LOADED_NM);
	}



	function handleProjContentReqError() {
		if (_dynamicContentCntnr.hasClassName(DYNAMIC_CONTENT_LOADED_NM) === false) {
			_dynamicContentCntnr.addClassName(DYNAMIC_CONTENT_LOADED_NM);
		}

		// Since we updated the URL before requesting the data and then failed during the retrieval, we need to load the old URL and data.
		History.back();
	}


} (window.Main = window.Main || {}) );