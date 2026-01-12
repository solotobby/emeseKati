<?php
header("Content-Type: application/json");

if (!isset($_GET['lat']) || !isset($_GET['lon'])) {
  http_response_code(400);
  echo json_encode(["error" => "Latitude and longitude required"]);
  exit;
}

$lat = $_GET['lat'];
$lon = $_GET['lon'];

$url = "https://api.open-meteo.com/v1/forecast?"
  . "latitude=$lat&longitude=$lon"
  . "&current_weather=true"
  . "&hourly=relativehumidity_2m,apparent_temperature,cloudcover,precipitation"
  . "&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset"
  . "&timezone=auto";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
