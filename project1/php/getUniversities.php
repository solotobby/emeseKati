<?php
require_once 'config.php';

$country = $_GET['country'];

$url = "http://universities.hipolabs.com/search?country=$country";

echo curlRequest($url);
