<?php
require('DB.php');
require('ObjectLink.php');
require('SQL.php');
header('Content-Type: text/html; charset=utf-8');

function getDbPrefix($arr, $host){
	return isset($arr[$host]) ? $arr[$host] : "";
	
};

$arr = array(
	"logistic.kulsha.ru" => "c5553_",
	"localhost" => ""
);

$host = $_SERVER['SERVER_NAME'];
$prefix = getDbPrefix($arr, $host);
$conn = new DB("localhost",$prefix."logistic",$prefix."root","Rekmif1983",0);;
$explDb = $conn->db;
$explDbType = $explDb->getAttribute(PDO::ATTR_DRIVER_NAME);
$sql = new SQL($explDb);
$objectlink = new ObjectLink($sql);
