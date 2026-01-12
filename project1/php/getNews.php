<?php
header('Content-Type: application/json');

// Validate country code
$country = $_GET['country'] ?? '';

if (!$country || strlen($country) !== 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid 2-letter country code is required']);
    
    exit;
}

// Your NewsAPI key
$API_KEY = '06bb322191a849d48ea4fd9eeac5efb4';

// Build API URL
$url = "https://newsapi.org/v2/top-headlines?" . http_build_query([
    'country' => $country,
    'apiKey'  => $API_KEY
]);

// Initialize cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => [
        'User-Agent: NewsApp/1.0'
    ]
]);

$response = curl_exec($ch);

// Handle cURL errors
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Handle API errors
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'News API request failed',
        'status_code' => $httpCode
    ]);
    exit;
}

// Return API response
echo $response;


