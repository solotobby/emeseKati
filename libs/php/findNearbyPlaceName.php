<?php
// remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);
$username = "emesekati";

$url = 'http://api.geonames.org/findNearbyPlaceNameJSON?lat=' . $_REQUEST['lat'] . '&lng=' . $_REQUEST['lng'] . '&username=' . $username;
//$url = 'https://jsonplaceholder.typicode.com/posts';
$ch = curl_init();

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);


header('Content-Type: application/json; charset=UTF-8');
$result_json=json_decode($result,true);
$geoService=$result_json["geonames"][0];
$data["countryCode"]=$geoService["countryCode"];
$data["countryName"]=$geoService["countryName"];
echo json_encode($data);