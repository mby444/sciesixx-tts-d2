<?php
require "../database/connection.php";

function sendUserResult($name, $roll, $grade, $accuracy, $rightAnswer, $wrongAnswer, $date) {
    global $connection;
    $sql = "INSERT INTO users (name, roll, grade_class, accuracy, right_count, wrong_count, date) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $prepared = $connection->prepare($sql);
    $prepared->bind_param("sssssss", $name, $roll, $grade, $accuracy, $rightAnswer, $wrongAnswer, $date);
    $prepared->execute();
    return true;
}
?>