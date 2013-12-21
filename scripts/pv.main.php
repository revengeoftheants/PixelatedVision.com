<?php
	$isXmlHttpRequest = isset($_SERVER["HTTP_X_REQUESTED_WITH"]) && strtolower($_SERVER["HTTP_X_REQUESTED_WITH"]) == "xmlhttprequest";

    $uri = $_GET["dynContent"];  // This lacks the domain and starts with "/".

	// Chrome's Page Cache does not handle the caching of ajax content properly; it only caches the ajax content, not the static page around it.
	// So we will disable caching of these responses to force them to be requested again.
	// Also encountered issue where IE would cache the entire page (probably after a response below in which we return both the main html and 
	// the dynamic content) and then return this cached content for a later ajax request, causing the page to appear with duplicate content.
	header("Expires: Sat, 1 Jan 2005 00:00:00 GMT");
	header("Last-Modified: ".gmdate( "D, d M Y H:i:s")."GMT");
	header("Cache-Control: no-cache, no-store, must-revalidate");
	header("Pragma: no-cache");
		
   	if ($uri == "" && !$isXmlHttpRequest) {
   		$response = file_get_contents("../markup/pv.main.html");
   	} elseif ($isXmlHttpRequest) {
   		$response = file_get_contents("../markup/" . "pv." . $uri . ".html");
   	} else {
   		$html = new DomDocument;
   		$html->loadHTMLFile("../markup/pv.main.html");
   		$newDynamicContentCntnr = $html->createDocumentFragment();
   		$newDynamicContentCntnr->appendXML(file_get_contents("../markup/" . "pv." . $uri . ".html"));
   		$html->getElementById("dynamicContentCntnr")->appendChild($newDynamicContentCntnr);
   		$response = $html->saveHTML();
   	}

   	echo $response;
?>