<?php
require "../utils/users.php";

header("Content-Type: application/json; charset=utf-8");

$REQUEST = json_decode(file_get_contents("php://input"), true);
$reqMethod = $_SERVER["REQUEST_METHOD"];

function getRequest($key, $request) {
    $value = key_exists($key, $request) ? $request[$key] : "";
    $value = preg_replace("/[\<\>]/", "", $value);
    return $value;
}

switch ($reqMethod) {
    case "POST": {
        $name =  getRequest("name", $REQUEST);
        $roll =  getRequest("roll", $REQUEST);
        $grade =  getRequest("grade_class", $REQUEST);
        $accuracy =  getRequest("accuracy", $REQUEST);
        $rightAnswer =  getRequest("right_answer", $REQUEST);
        $wrongAnswer =  getRequest("wrong_answer", $REQUEST);
        $date = getRequest("date", $REQUEST);
        $result = sendUserResult($name, $roll, $grade, $accuracy, $rightAnswer, $wrongAnswer, $date);
        echo json_encode(["error" => !$result]);
        break;
    }
    default: {
        echo json_encode(["error" => true]);
    }
}
?>