<?php
require_once 'config.php';

$lat = $_GET['lat'];
$lng = $_GET['lng'];

$query = "[out:json];node(around:50000,$lat,$lng)[tourism=museum];out;";
$url = "https://overpass-api.de/api/interpreter?data=" . urlencode($query);

echo curlRequest($url);
