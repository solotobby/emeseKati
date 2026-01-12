<?php
// remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);
$username = "emesekati";

$url = 'http://api.geonames.org/countryCode?lat=' . $_REQUEST['lat'] . '&lng=' . $_REQUEST['long'] . '&username=' . $username;
//$url = 'https://jsonplaceholder.typicode.com/posts';
$ch = curl_init();

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);


header('Content-Type: application/json; charset=UTF-8');



echo json_encode($result);