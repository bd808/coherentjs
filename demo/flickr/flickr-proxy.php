<?php
// PHP Proxy example for Yahoo! Web services. 
// Responds to both HTTP GET and POST requests
//
// Author: Jason Levitt
// December 7th, 2005
//

// Allowed hostname (api.local and api.travel are also possible here)
define ('PROXY', 'http://api.flickr.com/services/rest/');

// Get the REST call path from the AJAX application
// Is it a POST or a GET?
$url = PROXY;

if (!empty($_SERVER['QUERY_STRING']))
    $url.= "?".$_SERVER['QUERY_STRING'];
    
// Open the Curl session
$session = curl_init($url);
$method = $_SERVER['REQUEST_METHOD'];

// If it's a POST, put the POST data in the body
if ('POST'==$method) {
	$postvars = '';
	while ($element = current($_POST)) {
		$postvars .= key($_POST).'='.$element.'&';
		next($_POST);
	}
	curl_setopt ($session, CURLOPT_POST, true);
	curl_setopt ($session, CURLOPT_POSTFIELDS, $postvars);
}

// Don't return HTTP headers. Do return the contents of the call
curl_setopt($session, CURLOPT_HEADER, true);
curl_setopt($session, CURLOPT_RETURNTRANSFER, true);

$response= curl_exec($session);
$response= str_replace("\r\n", "\n", $response);

$parts = explode("\n\n", $response);
$headers= explode("\n", $parts[0]);
foreach ($headers as $header) {
    header($header);
}

echo $parts[1];
curl_close($session);
?>
