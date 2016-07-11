<?php
class SQL {
	private $db;
	private $perfixDB = "";
	
    public function __construct(PDO &$pdo, $perfixDB=""){
		$this->db = $pdo;
		$this->perfixDB = $perfixDB;
    }

	public function sql($params){
		try {
			$q = $params[0];

			$sth = $this->db->prepare($q);
			$sth->execute();
			return $sth;
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}

	public function sT($params){
		try {
			$table = $params[0];
			$fields = isset($params[1]) ? $params[1] : "*";
			$cond = isset($params[2]) ? $params[2] : "";
			$order = isset($params[3]) ? $params[3] : "";
			$limit = isset($params[4]) ? $params[4] : "";
			
			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("select $fields from $table where 1=1 $cond $order $limit");  
			$sth->execute();
			//$sth = $this->db->query("select ".$fields." from ".$table." where 1=1 ".$cond." ".$order." ".$limit);
			return $sth->fetchAll();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function iT($params){
		try {
			$table = $params[0];
			$fields = $params[1];
			$values = $params[2];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("insert into $table ($fields) values ($values)");  
			$sth->execute();
			$id = $this->db->lastInsertId();
			return $id;
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function uT($params){
		try {
			$table = $params[0];
			$fieldsValues = $params[1];
			$cond = $params[2];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("update $table set $fieldsValues where 1=1 $cond");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function dT($params){
		try {
			$table = $params[0];
			$cond = $params[1];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("delete from $table where 1=1 $cond");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function cT($params){
		try {	
			$table = $params[0];
			$prop = $params[1];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("create table if not exists $table ($prop)");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function aT($params){
		try {
			$table = $params[0];
			$prop = $params[1];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("alter table $table ($prop)");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function eT($params){
		try {
			$table = $params[0];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("drop table if exists $table");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function xT($params){
		try {
			$table = $params[0];
			$name = $params[1];
			$field = $params[2];

			$table = ($this->perfixDB).$table;
			$sth = $this->db->prepare("create index $name on $table ($field)");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
	public function cV($params){
		try {
			$view = $params[1];
			$sql = $params[2];
			
			$view = ($this->perfixDB).$view;
			$sth = $this->db->prepare("create view $view as $sql");  
			$sth->execute();
			return $sth->rowCount();
			
		} catch (Exception $e) {
			print($e);
			return null;
		}
	}
	
}

