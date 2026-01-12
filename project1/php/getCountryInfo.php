<?php
// header("Content-Type: application/json");

// require_once 'config.php';

// if (!isset($_GET['country']) || empty($_GET['country'])) {
//   http_response_code(400);
//   echo json_encode(["error" => "Country parameter missing"]);
//   exit;
// }

// $country = urlencode($_GET['country']);

// $url = "https://restcountries.com/v3.1/name/$country?fullText=true";

// $data = curlRequest($url);

// echo $data;



header("Content-Type: application/json");

if (!isset($_GET['country']) || empty($_GET['country'])) {
    http_response_code(400);
    echo json_encode(["error" => "Country parameter missing"]);
    exit;
}

$country = urlencode($_GET['country']);
$url = "https://restcountries.com/v3.1/name/{$country}?fullText=true";

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode([
        "error" => "cURL error",
        "message" => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;

