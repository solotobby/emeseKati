<?php
require_once 'config.php';

$country = $_GET['country'];
$username = "emesekati"; // replace later

$url = "https://secure.geonames.org/searchJSON?country=$country&featureClass=P&maxRows=10&username=$username";

echo curlRequest($url);
