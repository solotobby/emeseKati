<?php
header('Content-Type: application/json');

$country = $_GET['country'] ?? '';

if (!$country) {
    http_response_code(400);
    echo json_encode(['error' => 'Country is required']);
    exit;
}

/**
 * Step 1: Search Wikipedia
 */
$searchUrl = "https://en.wikipedia.org/w/api.php?" . http_build_query([
    'action'   => 'query',
    'list'     => 'search',
    'srsearch' => "Famous landmarks in $country",
    'format'   => 'json',
    'utf8'     => 1,
    'srlimit'  => 8
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $searchUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'LandmarkApp/1.0 (contact@example.com)'
]);
$searchResponse = curl_exec($ch);
curl_close($ch);

$searchData = json_decode($searchResponse, true);

if (empty($searchData['query']['search'])) {
    echo json_encode(['landmarks' => []]);
    exit;
}

/**
 * Step 2: Fetch page details (images + extract)
 */
$pageIds = array_column($searchData['query']['search'], 'pageid');

$detailsUrl = "https://en.wikipedia.org/w/api.php?" . http_build_query([
    'action' => 'query',
    'pageids' => implode('|', $pageIds),
    'prop' => 'pageimages|extracts',
    'pithumbsize' => 400,
    'exintro' => 1,
    'explaintext' => 1,
    'format' => 'json'
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $detailsUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERAGENT => 'LandmarkApp/1.0 (contact@example.com)'
]);
$detailsResponse = curl_exec($ch);
curl_close($ch);

$detailsData = json_decode($detailsResponse, true);

$landmarks = [];

foreach ($detailsData['query']['pages'] as $page) {
    $landmarks[] = [
        'title' => $page['title'],
        'description' => $page['extract'] ?? 'No description available.',
        'image' => $page['original']['source'] ?? null,
        'url' => 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $page['title'])
    ];
}

echo json_encode(['landmarks' => $landmarks]);



