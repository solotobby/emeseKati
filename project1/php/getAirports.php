<?php

<?php
require_once 'config.php';

header("Content-Type: application/json");

// Validate input
if (!isset($_GET['country']) || empty($_GET['country'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Country parameter missing']);
    exit;
}

$country = $_GET['country'];

// Map country name to ISO code using REST Countries API
$countryInfo = file_get_contents("https://restcountries.com/v3.1/name/" . urlencode($country) . "?fullText=true");
$countryData = json_decode($countryInfo, true);
if (!$countryData || !isset($countryData[0]['cca2'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid country']);
    exit;
}

$countryCode = $countryData[0]['cca2']; // ISO Alpha-2

// Fetch the full airports CSV
$url = "https://ourairports.com/data/airports.csv";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => "GazetteerApp/1.0",
]);

$csv = curl_exec($ch);

if ($csv === false) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error', 'message' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Parse CSV into array
$lines = explode("\n", trim($csv));
$headers = str_getcsv(array_shift($lines));

$countryIndex = array_search('iso_country', $headers);
$nameIndex = array_search('name', $headers);
$typeIndex = array_search('type', $headers);
$latIndex = array_search('latitude_deg', $headers);
$lonIndex = array_search('longitude_deg', $headers);

$airports = [];

foreach ($lines as $line) {
    $row = str_getcsv($line);
    if (!isset($row[$countryIndex]) || $row[$countryIndex] !== $countryCode) continue;

    $airports[] = [
        'name' => $row[$nameIndex] ?? '',
        'type' => $row[$typeIndex] ?? '',
        'lat' => $row[$latIndex] ?? '',
        'lon' => $row[$lonIndex] ?? ''
    ];
}

// Limit to 20 for performance
$airports = array_slice($airports, 0, 20);

echo json_encode($airports);





