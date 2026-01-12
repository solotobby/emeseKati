<?php
// require_once 'config.php';

// header('Content-Type: application/json');

// $country = $_GET['country'] ?? '';

// if (!$country) {
//     echo json_encode(['error' => 'Country is required']);
//     exit;
// }

// // Wikipedia API URL for country summary
// $wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles="
//     . urlencode($country) . "&format=json";


// $result = curlRequest($wikiUrl);
// $data = json_decode($result, true);

// // Extract page info
// $page = reset($data['query']['pages']); // gets the first page

// if (!$page || isset($page['missing'])) {
//     echo json_encode(['error' => 'No Wikipedia page found']);
//     exit;
// }

// // Return JSON with title, extract, and full URL
// $response = [
//     'title' => $page['title'],
//     'extract' => $page['extract'],
//     'url' => 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $page['title'])
// ];

// echo json_encode($response);

// header('Content-Type: application/json');

// $country = $_GET['country'] ?? '';

// if (!$country) {
//     http_response_code(400);
//     echo json_encode(['error' => 'Country is required']);
//     exit;
// }

// /**
//  * 1️⃣ Fetch Wikipedia summary
//  */
// $wikiUrl = "https://en.wikipedia.org/w/api.php?" . http_build_query([
//     'action' => 'query',
//     'prop' => 'extracts',
//     'exintro' => 1,
//     'explaintext' => 1,
//     'titles' => $country,
//     'format' => 'json'
// ]);

// $ch = curl_init();
// curl_setopt_array($ch, [
//     CURLOPT_URL => $wikiUrl,
//     CURLOPT_RETURNTRANSFER => true,
//     CURLOPT_USERAGENT => 'CountryExplorer/1.0 (contact@example.com)'
// ]);
// $wikiResponse = curl_exec($ch);
// curl_close($ch);

// $wikiData = json_decode($wikiResponse, true);
// $page = reset($wikiData['query']['pages'] ?? []);

// if (!$page || isset($page['missing'])) {
//     echo json_encode(['error' => 'No Wikipedia page found']);
//     exit;
// }

// /**
//  * 2️⃣ Fetch country flag from Rest Countries API
//  */
// $flagUrl = "https://restcountries.com/v3.1/name/" . urlencode($country) . "?fullText=true";

// $ch = curl_init();
// curl_setopt_array($ch, [
//     CURLOPT_URL => $flagUrl,
//     CURLOPT_RETURNTRANSFER => true,
//     CURLOPT_USERAGENT => 'CountryExplorer/1.0 (contact@example.com)'
// ]);
// $flagResponse = curl_exec($ch);
// curl_close($ch);

// $flagData = json_decode($flagResponse, true);
// $flag = $flagData[0]['flags']['png'] ?? null;

// /**
//  * 3️⃣ Final response
//  */
// echo json_encode([
//     'title' => $page['title'],
//     'extract' => $page['extract'],
//     'flag' => $flag,
//     'url' => 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $page['title'])
// ]);
header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

$country = trim($_GET['country'] ?? '');
if ($country === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Country is required']);
    exit;
}

function curlGet($url) {
    if (!function_exists('curl_init')) return null;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT => 'CountryExplorer/1.0 (contact@example.com)',
        CURLOPT_TIMEOUT => 10
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response ?: null;
}

/**
 * 1️⃣ Wikipedia SEARCH
 */
$searchUrl = "https://en.wikipedia.org/w/api.php?" . http_build_query([
    'action' => 'query',
    'list' => 'search',
    'srsearch' => $country,
    'format' => 'json',
    'utf8' => 1,
    'srlimit' => 1
]);

$searchResponse = curlGet($searchUrl);
if (!$searchResponse) {
    echo json_encode(['error' => 'Failed to contact Wikipedia']);
    exit;
}

$searchData = json_decode($searchResponse, true);
$pageTitle = $searchData['query']['search'][0]['title'] ?? null;

if (!$pageTitle) {
    echo json_encode(['error' => 'No Wikipedia page found']);
    exit;
}

/**
 * 2️⃣ Fetch extract
 */
$wikiUrl = "https://en.wikipedia.org/w/api.php?" . http_build_query([
    'action' => 'query',
    'prop' => 'extracts',
    'exintro' => 1,
    'explaintext' => 1,
    'titles' => $pageTitle,
    'format' => 'json'
]);

$wikiResponse = curlGet($wikiUrl);
if (!$wikiResponse) {
    echo json_encode(['error' => 'Failed to fetch Wikipedia content']);
    exit;
}

$wikiData = json_decode($wikiResponse, true);
$pages = $wikiData['query']['pages'] ?? null;

if (!is_array($pages) || count($pages) === 0) {
    echo json_encode(['error' => 'Wikipedia extract not found']);
    exit;
}

$page = reset($pages); // safe now
if (!$page || empty($page['extract'])) {
    echo json_encode(['error' => 'Wikipedia extract not found']);
    exit;
}

/**
 * 3️⃣ Flag
 */
$flagUrl = "https://restcountries.com/v3.1/name/" . urlencode($country);
$flagData = json_decode(curlGet($flagUrl), true);
$flag = $flagData[0]['flags']['png'] ?? null;

/**
 * 4️⃣ Final response
 */
echo json_encode([
    'title' => $page['title'],
    'extract' => $page['extract'],
    'flag' => $flag,
    'url' => 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $page['title'])
]);


