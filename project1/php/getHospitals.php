<?php
header("Content-Type: application/json");

$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';

if (!$lat || !$lng) {
    http_response_code(400);
    echo json_encode(['error' => 'Latitude and Longitude required']);
    exit;
}

// Overpass QL query
$query = "[out:json];
node(around:50000,$lat,$lng)[amenity=hospital];
out;";

$url = "https://overpass-api.de/api/interpreter?data=" . urlencode($query);

// Initialize cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_USERAGENT => "CountryInfoApp/1.0"
]);

$response = curl_exec($ch);

// Error handling
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        "error" => "cURL Error",
        "message" => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        "error" => "Overpass API error",
        "status" => $httpCode
    ]);
    exit;
}

echo $response;

