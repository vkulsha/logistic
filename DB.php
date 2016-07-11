<?php
class DB { 
	private $host   = 'localhost';
	private $dbname = 'mysql';
	private $user   = 'root';
	private $pass   = 'password';
 
	private $options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
							 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_NUM);
	public $db;

	public function __construct($host, $dbname, $user, $pass, $options) {
		$this->host = $host ? $host : $this->host;
		$this->dbname = $dbname ? $dbname : $this->dbname;
		$this->user = $user ? $user : $this->user;
		$this->pass = $pass ? $pass : $this->pass;
		
		try {
			$this->db = new PDO('mysql:host='. $this->host .';dbname='. $this->dbname. ';charset=utf8',
								$this->user,
								$this->pass,
								$this->options
							);
			$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		}
		catch(PDOException $e) {
			echo 'ERROR: ' . $e->getMessage();
		}
	}
}

?>