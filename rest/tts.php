<?php
require "../utils/tts.php";

header("Content-Type: application/json; charset=utf-8");

$REQUEST = json_decode(file_get_contents("php://input"), true);
$reqMethod = $_SERVER["REQUEST_METHOD"];

function getRequest($key, $request) {
    $value = key_exists($key, $request) ? $request[$key] : "";
    $value = preg_replace("/[\<\>]/", "", $value);
    return $value;
}

switch ($reqMethod) {
    case "PATCH": {
        $ttsData = getTTS();
        $output = [
            "error" => false,
            "data" => $ttsData,
        ];
        echo json_encode($output);
        break;
    }
    default: {
        echo json_encode(["error" => true]);
    }
}
?>