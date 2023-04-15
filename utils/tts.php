<?php
require "../database/connection.php";

function getTTS() {
    global $connection;
    $sql = "SELECT id, answer FROM answers";
    $query = $connection->query($sql);
    $result = $query->fetch_all(MYSQLI_ASSOC);
    return $result;
}
?>