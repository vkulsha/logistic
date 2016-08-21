<?php
class ObjectLink {
	public $sql;
	
    public function __construct(SQL &$sql){
		$this->sql = $sql;
    }

	public function cD(){//create database
		try {
			$this->sql->cT(["object", "id bigint not null auto_increment, n char(255), d timestamp, c bigint, primary key(id), index(n), index(d), index(c)"]);  
			$this->sql->cT(["link", "id bigint not null auto_increment, o1 bigint, o2 bigint, c bigint, d timestamp, primary key(id), index(o1), index(o2), index(c), index(d)"]);
			$ret = $this->cO(["Класс"]);
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}
	
	public function cO($params){//create object and link
		try {
			$n = $params[0];
			$pid = isset($params[1]) ? $params[1] : 1;
			$u = isset($params[2]) ? $params[2] : 1;

			if ($pid) {
				$id = $this->gO([$n, null, null, $pid]);
			}
			
			if (!$id) {
				$id = $this->sql->iT(["object", "n", "'$n'"]);  
				
				if ($pid) {
					$this->cL([$id, $pid, $u]);
				}

			}

			$ret = $id;
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function cL($params){//link objects
		$ret = 0;
		try {
			$o1 = $params[0];
			$o2 = $params[1];
			$u = isset($params[2]) ? $params[2] : 1;
			
			$lid = $this->sql->sT(["link", "id", "and ( (o1 = $o1 and o2 = $o2) or (o1 = $o2 and o2 = $o1) )"]);  
			$lid = $lid ? $lid[0][0] : null;
			
			if (!$lid) {
				$ret = $this->sql->iT(["link", "o1, o2, u", "$o1,$o2,$u"]);  
			} else {
				$ret = $this->sql->uT(["link", "d = CURRENT_TIMESTAMP, u = $u", "and id = $lid"]);  
			}
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function gO($params){//get object id by name
		try {
			$n = $params[0];
			$isClass = isset($params[1]) && $params[1] ? "and id in (select o1 from link where o2 = 1) " : "";
			$isLike = isset($params[2]) && $params[2] ? " and n like '%$n%' " : " and n = '$n' ";
			//$inClass  = isset($params[3]) && $params[3] ? " and id in ( select o1 from link where o2 = ".$params[3]." and o1 not in (select o1 from link where o2 = 1) ) " : "";
			$inClass  = isset($params[3]) && $params[3] ? " and id in ( select o1 from link where o2 = ".$params[3]." and o2 in (select o1 from link where o2 = 1) ) " : "";
			$ret = $this->sql->sT(["object", "id", "$isLike $isClass $inClass", "order by id", "limit 1"]);
			return $ret ? $ret[0][0] : null;
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}
	
	public function gN($params){//get object name by id
		try {
			$id = $params[0];
			
			$ret = $this->sql->sT(["object", "n", "and id = '$id'", "", "limit 1"]);
			return $ret ? $ret[0][0] : null;
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function uO($params){//update object name by id
		try {
			$id = $params[0];
			$n = $params[1];
			
			$ret = $this->sql->uT(["object", "n='$n'", "and id=$id"]);  
			return $ret;
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}
	
	public function eO($params){//erase object from database
		try {
			$id = $params[0];
			
			$ret = $this->sql->dT(["link", "and (o1=$id or o2=$id)"]);  
			$ret = $this->sql->dT(["object", "and id=$id"]);  
			return $ret;
			
		} catch (Exception $e) {
			print($e);
			$ret = null;
		}
		return $ret;
	}
	
	public function eL($params){//erase link from database
		try {
			$o1 = $params[0];
			$o2 = $params[1];
			
			$ret = $this->sql->dT(["link", "and ((o1=$o1 and o2=$o2) or (o2=$o1 and o1=$o2))"]);  
			return $ret;
			
		} catch (Exception $e){
			print($e);
			$ret = null;
		}
		return $ret;
	}
	
	public function gC($params){//get class object fields
		try {
			$id = $params[0];
			$fields = isset($params[1]) ? $params[1] : "*";
			
			$ret = $this->sql->sT(["object",$fields,"and id in (select o2 from link where o2 in (select o1 from link where o2 = 1) and o1 = $id)"]);
			return $ret;
			
		} catch (Exception $e){
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function gCn($params){//get class object names
		try {
			$id = $params[0];
			
			$ret = $this->gC([$id, "n"]);  
			return $ret;
			
		} catch (Exception $e){
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function gCid($params){//get class object ids
		try {
			$id = $params[0];
			
			$ret = $this->gC([$id, "id"]);  
			return $ret;
			
		} catch (Exception $e){
			print($e);
			$ret = null;
		}
		return $ret;
	}

	public function getTableQuery($params){//[{id:1331, n:"ик", parentCol:0, linkParent:false, inClass:false}]
		try {
			$paramsArr = $params[0];
			$groupbyind = isset($params[1]) ? $params[1] : "0";
			
			$result = [];
			$head = [];
			$body = [];
			$foot = [];
			$i = -1;
			foreach ($paramsArr as $cc){
				$i++;
				if (isset($cc["n"])) {
					//i++;
					$id = isset($cc["id"]) ? $cc["id"] : null;
					$col = isset($cc["n"]) ? $cc["n"] : null;
					$plink = isset($cc["linkParent"]) ? $cc["linkParent"] : null;
					$pcol = isset($cc["parentCol"]) ? $cc["parentCol"] : null;
					$inClass = isset($cc["inClass"]) ? $cc["inClass"] : null;
					if ($i==0){
						$h = "select o".$i.".id `id_".$col."`, o".$i.".n `".$col."` \n";
						$l = $id ? $id : "(select id from object where n='".$col."' limit 1)";
						$b = 
							"from (\n".
							"	select id, n from object where id in ( \n".
							"		select o1 from link where o2 = ".$l." \n".
							($inClass ? "" : "and o1 not in (select o1 from link where o2 = 1) \n").
							"	) \n".
							"	group by id \n".
							")o".$i." \n";
						$head[] = $h;
						$body[] = $b;
					} else {
						$h = "";
						if ($groupbyind !== false) {
							$h = ",case when count(distinct o".$i.".id) <= 1 then group_concat(distinct o".$i.".id) else concat(o".$i.".id,'..') end `id_".$col."` ".
								",case when count(distinct o".$i.".id) <= 1 then group_concat(distinct o".$i.".n)  else concat(o".$i.".n,'..')  end `".$col."` ".
								",count(distinct o".$i.".id) `кол-во ".$col."` \n";
						} else {
							$h = ",o".$i.".id `id_".$col."` ".
								",o".$i.".n `".$col."` ";
						}
						$l = $id ? $id : "(select id from object where n='".$col."' limit 1)";
						$selecto1o2 = $plink ? "select o1 o2, o2 o1 from link where o2 in (" : "select o1, o2 from link where o1 in (";
						$parentCol = $pcol ? $pcol : 0;
						$b = 
							"left join ( \n".
							"	".$selecto1o2." \n".
							"		select o1 from link where o2 = ".$l." \n".
							($inClass ? "" : "and o1 not in (select o1 from link where o2 = 1) \n").
							"	) \n".
							"	group by o1, o2 \n".
							")l".$i." on l".$i.".o2 = o".$parentCol.".id left join object o".$i." on o".$i.".id = l".$i.".o1 \n";
						
						$head[] = $h;
						$body[] = $b;
					}
				}
			}
			
			if ($groupbyind !== false) {
				$foot[] = "group by o".$groupbyind.".id having 1=1 \n\n";
			}
			$result = join("",$head).join("",$body).join("foot",$foot);
			return $result;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	public function gTq($params){//["a","b","c"], [[1,0],[2,0],[3,1]], [1,2], [1], false
		try {
			$nArr = isset($params[0]) ? $params[0] : [];
			$parentColArr = isset($params[1]) ? $params[1] : [];
			$linkParentArr = isset($params[2]) ? $params[2] : [];
			$inClassArr = isset($params[3]) ? $params[3] : [];
			$groupByInd = isset($params[4]) ? $params[4] : false;

			$opts = [];
			for ($i=0; $i < count($nArr); $i++){
				$opts[] = array("n"=>$nArr[$i], "parentCol"=>0, "linkParent"=>false);
			}
			for ($i=0; $i < count($parentColArr); $i++){
				$opts[$parentColArr[$i][0]]["parentCol"] = $parentColArr[$i][1];
			}
			for ($i=0; $i < count($linkParentArr); $i++){
				$opts[$linkParentArr[$i]]["linkParent"] = true;
			}
			for ($i=0; $i < count($inClassArr); $i++){
				$opts[$inClassArr[$i]]["inClass"] = true;
			}
			return $this->getTableQuery([$opts, $groupByInd]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	
	
	public function gT($params){//["a","b","c"], [[1,0],[2,0],[3,1]], [1,2], [1], false, "*", "and a = 115"
		try {
			$fields = isset($params[5]) ? $params[5] : "*";
			$cond = isset($params[6]) ? $params[6] : "";
			
			$sel = $this->gTq($params);
			return $this->sql->sT(["(".$sel.")x", $fields, $cond]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	

	public function getTableQuery2($params){//[{id:1331, n:"ик", parentCol:0, inClass:false}]
		try {
			$paramsArr = $params[0];
			$groupbyind = isset($params[1]) ? $params[1] : "0";
			$includeLinkDate = isset($params[2]) && $params[2] ? true : false;
			
			$result = [];
			$head = [];
			$body = [];
			$foot = [];
			$i = -1;
			foreach ($paramsArr as $cc){
				$i++;
				if (isset($cc["n"])) {
					$id = isset($cc["id"]) ? $cc["id"] : null;
					$col = isset($cc["n"]) ? $cc["n"] : "o".$id;
					$pcol = isset($cc["parentCol"]) ? $cc["parentCol"] : null;
					$inClass = isset($cc["inClass"]) ? $cc["inClass"] : null;
					if ($i==0){
						$h = "select o".$i.".id `id_".$col."`, o".$i.".n `".$col."` \n";
						if ($includeLinkDate) {
							$h = $h.", o".$i.".id `d_".$col."` \n";
						}
						$l = $id ? $id : "(select id from object where n='".$col."' limit 1)";
						$b = 
							"from (\n".
							"	select id, n from object where id in ( \n".
							"		select o1 from link where o2 = ".$l." \n".
							($inClass ? "" : "and o1 not in (select o1 from link where o2 = 1) \n").
							"	) \n".
							"	group by id \n".
							")o".$i." \n";
						$head[] = $h;
						$body[] = $b;
					} else {
						$h = "";
						if ($groupbyind !== false) {
							$h = ",case when count(distinct o".$i.".id) <= 2 then group_concat(distinct o".$i.".id) else concat(o".$i.".id,'..') end `id_".$col."` ".
								",case when count(distinct o".$i.".id) <= 2 then group_concat(distinct o".$i.".n)  else concat(o".$i.".n,'..')  end `".$col."` ".
								",count(distinct o".$i.".id) `кол-во ".$col."` \n";
						} else {
							$h = ",o".$i.".id `id_".$col."` ".
								",o".$i.".n `".$col."` ";
							if ($includeLinkDate) {
								$h = $h.",l".$i.".d `d_".$col."` ".
										",l".$i.".c `c_".$col."` ";
							}
						}
						$l = $id ? $id : "(select id from object where n='".$col."' limit 1)";
						$parentCol = $pcol ? $pcol : 0;
						$b = 
							"left join ( \n".
							"	select o1, o2, d, c from link where o1 in ( \n".
							"		select o1 from link where o2 = ".$l." \n".
							($inClass ? "" : "and o1 not in (select o1 from link where o2 = 1) \n").
							"	) \n".
							" union all \n".
							"	select o2, o1, d, c from link where o2 in ( \n".
							"		select o1 from link where o2 = ".$l." \n".
							($inClass ? "" : "and o1 not in (select o1 from link where o2 = 1) \n").
							"	) \n".
							"	group by o1, o2 \n".
							")l".$i." on l".$i.".o2 = o".$parentCol.".id left join object o".$i." on o".$i.".id = l".$i.".o1 \n";
						
						$head[] = $h;
						$body[] = $b;
					}
				}
			}
			
			if ($groupbyind !== false) {
				$foot[] = "group by o".$groupbyind.".id having 1=1 \n\n";
			}
			$result = join("",$head).join("",$body).join("foot",$foot);
			return $result;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function gTq2($params){//["a","b","c"], [[1,0],[2,0],[3,1]], [1], false
		try {
			$nArr = isset($params[0]) ? $params[0] : [];
			$parentColArr = isset($params[1]) ? $params[1] : [];
			$inClassArr = isset($params[2]) ? $params[2] : [];
			$groupByInd = isset($params[3]) ? $params[3] : false;

			//$fields = isset($params[4]) ? join(",", $params[4]) : "*";
			//$cond = isset($params[5]) ? $params[5] : "";
			$includeLinkDate = isset($params[6]) && $params[6] ? true : false;
			
			$opts = [];
			for ($i=0; $i < count($nArr); $i++){
				$opts[] = array("n"=>$nArr[$i], "parentCol"=>0, "linkParent"=>false);
			}
			for ($i=0; $i < count($parentColArr); $i++){
				$opts[$parentColArr[$i][0]]["parentCol"] = $parentColArr[$i][1];
			}
			for ($i=0; $i < count($inClassArr); $i++){
				$opts[$inClassArr[$i]]["inClass"] = true;
			}
			return $this->getTableQuery2([$opts, $groupByInd, $includeLinkDate]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	
	
	public function gT2($params){//["a","b","c"], [[1,0],[2,0],[3,1]], [1], false, ["f1","f2"], "and a = 115"
		try {
			$fields = isset($params[4]) ? join(",", $params[4]) : "*";
			$cond = isset($params[5]) ? $params[5] : "";
			$includeLinkDate = isset($params[6]) && $params[6] ? true : false;
			
			$sel = $this->gTq2($params);
			return $this->sql->sT(["(".$sel.")x", $fields, $cond]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	

	public function gTq3($params){//["a","b","c"], [1], false
		try {
			$nArr = isset($params[0]) ? $params[0] : [];
			$level = isset($params[1]) ? $params[1] : 3;
			$inClassArr = isset($params[2]) ? $params[2] : [];
			$groupByInd = isset($params[3]) ? $params[3] : false;
			$excludeClasses = isset($params[4]) ? $params[4] : null;
			$opts = [];
			$arr = [$nArr[0]];
			$opts[] = array("n"=>$arr[0], "parentCol"=>0, "linkParent"=>false);
			for ($i=1; $i < count($nArr); $i++){
				$n = $nArr[$i];
				$cid1 = $this->gO([$n, true]);
				$minLevel = 100;
				$minChain = [];
				$minInd = -1;
				
				for ($j=0; $j < count($arr); $j++){
					$cid2 = $this->gO([$arr[$j], true]);
					$chain = $this->getLinkedObjectsLevel([$cid1, $cid2, $level, true, $excludeClasses]);
					$chain = $chain && count($chain) ? $chain[0] : [];
					$levelCount = $chain && count($chain) ? $chain[0] : 100;
					if ($levelCount < $minLevel){
						$minLevel = $levelCount;
						$minChain = $chain;
						$minInd = $j;
					};
				}

				$ind = -1;
				for ($k=2; $k < $minLevel+1; $k++){
					$cn = $this->gN([$minChain[$k]]);
					$arr[] = $cn;
					$ind = ($k==2 ? $minInd : count($arr)-2);
					$opts[] = array("n"=>$cn, "parentCol"=>$ind, "linkParent"=>false);
				}
				
				$c = $minChain && count($minChain)? $minChain[1] : null;
				$cn = $this->gN([$c]);
				array_push($arr, $cn);
				$opts[] = array("n"=>$arr[count($arr)-1], "parentCol"=>($ind == -1 ? $minInd : count($arr)-2), "linkParent"=>false);
				
			}
			
			for ($i=0; $i < count($inClassArr); $i++){
				$opts[$inClassArr[$i]]["inClass"] = true;
			}
			return $this->getTableQuery2([$opts, $groupByInd]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	
	
	public function gT3($params){//["a","b","c"], [1], false, "*", "and a = 115"
		try {
			$nArr = isset($params[0]) ? $params[0] : [];
			$fields = isset($params[5]) ? join(",", $params[5]) : "`".join("`,`", $nArr)."`";
			$cond = isset($params[6]) ? $params[6] : "";
			
			$sel = $this->gTq3($params);
			return $this->sql->sT(["(".$sel.")x", $fields, $cond]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}	
	
	public function gAnd($params){
		try {
			$objects = join(",",$params[0]);
			$count = count($params[0]);
			$fields = isset($params[1]) ? $params[1] : "*";
			$notIsClass = isset($params[2]) && $params[2] ? "not in (select o1 from link where o2 = 1)" : "";
			$notIsClass1 = $notIsClass ? "and o1 $notIsClass" : "";
			$notIsClass2 = $notIsClass ? "and o2 $notIsClass" : "";
			$cond = isset($params[3]) ? $params[3] : "";
			$parent = isset($params[4]) && $params[4] ? "and parent" : (isset($params[4]) ? "and not parent" : "");
			$isClass = isset($params[5]) && $params[5] ? "in (select o1 from link where o2 = 1)" : "";
			$isClass1 = $isClass ? "and o1 $isClass" : "";
			$isClass2 = $isClass ? "and o2 $isClass" : "";
			
			$sel = "and id in ( ".
					"select o1 from ( ".
					"select o1, o2, false parent from link where o2 in ($objects) $notIsClass1 $isClass1 ".
					"union all ".
					"select o2, o1, true  parent from link where o1 in ($objects) $notIsClass2 $isClass2 ".
					")x where 1=1 ".
					"$parent ".
					"group by o1 ".
					"having count(o1) = $count ".
				") $cond";
			return $this->sql->sT(["object", $fields, $sel]);
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	public function test($params){
		return $params;
	}
	
	public function createPolygonObject($params){
		try {
			$coords = $params[0];
			$oid = $params[1];
			$caption = isset($params[2]) ? $params[2] : "полигон на карте объекта $oid";
			$class = isset($params[3]) ? $params[3] : "Полигоны на карте";
			
			$cid = $this->gO([$class, true]);
			$cid2 = $this->gO(["Координаты на карте", true]);
			$id = $this->cO([$caption, $cid]);
			$this->cL([$id, $oid]);
			
			foreach($coords as $coord){
				$lat = $coord[0];
				$lon = $coord[1];
				$latlon = "$lat $lon";
				$xy = $this->cO([$latlon, $cid2]);
				$this->cL([$xy, $id]);
			}
			
			return $id;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	public function getObjectLikeName($params){
		try {
			$n = $params[0];
			return $this->sql->sT(["object", "id, n", " and n like '%$n%' and id not in (select o1 from link where o2 = 1)", "order by id", ""]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	private function getLevelSql($ind, $isClass1, $isClass2){
		$prev = $ind - 1;
		return "".
			"left join ".
			"( ".
			" select o1, o2 from link where 1=1 $isClass1 ".
			" union all ".
			" select o2, o1 from link where 1=1 $isClass2 ".
			")l$ind on l$prev.o2 = l$ind.o1 ".
			"";
	}
	
	public function getLinkedObjectsLevel($params){
		try {
			$cid1 = $params[0];
			$cid2 = $params[1];
			$level = $params[2];
			$isClass = isset($params[3]) && $params[3] ? true : false;
			$excludeClasses = isset($params[4]) ? "1,".join(",",$params[4]) : "1,1410";
			
			$isClass12 = $isClass ? " in (select o1 from link where o2 = 1 and o1 not in ($excludeClasses)) " : "";
			$isClass1 = $isClass ? " and o1 $isClass12 " : " and o1 not in ($excludeClasses) ";
			$isClass2 = $isClass ? " and o2 $isClass12 " : " and o2 not in ($excludeClasses) ";
			
			$header = "select l1.o1 oid, l1.o2 l1 ";
			$case = ",case when l1.o2 = $cid2 then 1 ";
			
			$body = "".
				"from ( ".
				" select o1, o2 from link where 1=1 $isClass1 ".
				" union all ".
				" select o2, o1 from link where 1=1 $isClass2 ".
				")l1 ";
			$cond = " where l1.o1 = $cid1 and (l1.o2 = $cid2 ";
			$fields = "fondLevel, oid, l1";
			
			for ($i=2; $i <= $level; $i++){
				$header = $header.", l".$i.".o2 l$i ";
				$case = $case."when l$i.o2 = $cid2 then $i ";
				$bodyLevel = $this->getLevelSql($i, $isClass1, $isClass2);
				$body = $body.$bodyLevel;
				$cond = $cond." or l$i.o2 = $cid2";
				$fields = $fields.", l$i";
				
			}
			$cond = $cond.") order by fondLevel ";
			$case = $case." else 1000 end fondLevel ";
			
			$sel = $header.$case.$body.$cond;
			return $this->sql->sT(["(".$sel.")x", $fields, " limit 1 "]);
			//return $sel;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function iii($params){
		try {
			$where = isset($params[0]) ? $params[0] : "";
			$order = isset($params[1]) ? $params[1] : "";
			
			$query = "select * from ( ".
			"	select distinct link.o1, object.n, link.o2, case when class.o2 is not null then 'Класс' end c, link.t from ( ".
			"		select o1, o2, 'child' t from link union all select o2, o1, 'parent' from link ".
			"	)link ".
			"	join object on object.id = link.o1 ".
			"	left join link class on class.o1 = link.o1 and class.o2 = 1 ".
			")x where 1=1 and (o1 <> o2 or (o1 = o2 and t='parent')) ";
			
			return $this->sql->sT(["(".$query.")x", "*", $where, $order, ""]);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function sql($params){
		try {
			$table = $params[0];
			$fields = isset($params[1]) ? $params[1] : "*";
			$cond = isset($params[2]) ? $params[2] : "";
			$order = isset($params[3]) ? $params[3] : "";
			$limit = isset($params[4]) ? $params[4] : "";
			
			//$result = $this->sql->sql(["select $fields from $table where 1=1 $cond $order $limit"]);
			$result = $this->sql->sql(["select * from $table"]);
			
			$columns = array();
			$colsCount = $result->columnCount();
			
			$colNum = 0;
			while ($colsCount > $colNum) 
			{
				$fieldName = $result->getColumnMeta($colNum)['name'];
				$columns[] = $fieldName;
				$colNum++;
			}

			$data = $result->fetchAll(PDO::FETCH_NUM);
			
			$jsonResult = array(
				"columns" => $columns,
				"data" => $data
			);
			
			return $jsonResult;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function gOCQ($params){
		try {
			$cid = $params[0];
			return "select * from object where id in ( select o1 from link where o2 = $cid and o1 not in (select o1 from link where o2 = 1) ) ";
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	public function getObjectFromClass($params){
		try {
			$cid = $params[0];
			$n = $params[1];
			
			$q = $this->gOCQ([$cid]);
			$ret = $this->sql->sT(["(select id from ($q)x where 1=1 and n='$n')x","*"]);
			
			return $ret;
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function getObjectsAndLinks($params) {
		try {
			$arr = $params[0];//array of oid to need
			$arr = join(",",$arr);
			$obj = $this->sql->sT(["object", "id, n", "and id in ($arr)", " order by id"]);
			$lnk = $this->sql->sT(["link", "o1, o2", "and o1 in ($arr) and o2 in ($arr) ", " order by id"]);
			
			return array($obj, $lnk);//array of [ [[oid, n]... ], [[o1, o2]... ] ]
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}

	public function createObjectsAndLinks($params) {
		try {
			$n = $params[0];//temp object name
			$arr = $params[1];//getObjectsAndLinks result
			
			$objArr = $arr[0];
			$lnkArr = $arr[1];
			
			$cid = $this->cO([$n]);
			
			foreach ($objArr as &$obj) {
				$id = &$obj[0];
				$n = &$obj[1];
				
				$oid = $this->cO([$n, $id == 1 ? 1 : $cid]);
				$obj[] = $oid;
				$id = "old_$id";
			}
			
			foreach ($lnkArr as &$lnk) {
				$o1 = &$lnk[0];
				$o2 = &$lnk[1];
				$o1 = "old_$o1";
				$o2 = "old_$o2";
				
				foreach ($objArr as &$obj) {
					$idOld = $obj[0];
					$idNew = $obj[2];
					
					if ($idOld == $o1) {
						$o1 = $idNew;
					}
					
					if ($idOld == $o2) {
						$o2 = $idNew;
					}
				}
			}
			
			foreach ($lnkArr as $lnk) {
				$o1 = $lnk[0];
				$o2 = $lnk[1];
				if ($o1 == 1 && $o2 == 1) continue;
				$this->cL([$o1, $o2]);
			}
			
			return array($objArr, $lnkArr);
			
		} catch (Exception $e){
			print($e);
			return null;
		}
	}
	
	
}



















?>