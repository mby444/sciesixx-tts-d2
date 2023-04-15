<?php
function getConnectionConfig($filePath) {
    $file = fopen($filePath, "r");
    $fileJSON = fread($file, filesize($filePath));
    $fileData = json_decode($fileJSON, true);
    return $fileData;
}

$connectionConfig = getConnectionConfig("../env-json/connection.json");
$host = $connectionConfig["host"];
$user = $connectionConfig["user"];
$password = $connectionConfig["password"];
$database = $connectionConfig["database"];

$connection = new mysqli($host, $user, $password, $database);
?>