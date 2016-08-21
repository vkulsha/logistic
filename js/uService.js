"use strict";
var host = location.host;
var domain = "http://"+host+"/";
var interfaceUrlKey = "interface";
var objectIdUrlKey = "objectId";
var objectsDir = "data/objects"
var currentUser = {};
var months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

$.extend($.expr[':'], {
  inview: function (el) {
    var $e = $(el),
    $w = $(window),
    top = $e.offset().top,
    height = $e.outerHeight(true),
    windowTop = $w.scrollTop(),
    windowScroll = windowTop - height,
    windowHeight = windowTop + height + $w.height();
    return (top > windowScroll && top < windowHeight);
  }
});

function getBrowser(){
    var ua = navigator.userAgent;    
    if (ua.search(/Chrome/) != -1) return 'Chrome';
    if (ua.search(/Firefox/) != -1) return 'Firefox';
    if (ua.search(/Opera/) != -1) return 'Opera';
    if (ua.search(/Safari/) != -1 ) return 'Safari';
    if (ua.search(/MSIE/) != -1) return 'IE';
    return 'Unknown';
}

function ifnull(value) { 
	return value == null ? "" : value;
}

function replace(val, oldPattern, newPattern) {
	return val.replace(new RegExp(oldPattern,'g'), newPattern);//val.replace(/old/g,new)
}

function ifns(val) {
	return val == "" ? "null" : "'"+replace(val, "'", "''")+"'";
}

function getClientIp() {
	return _clientIp;
}

function getObjectsDir() {
	return objectsDir;
}

function getObjectUri(objectId) {
	return domain+getObjectsDir()+"/"+objectId;
}

function openWindow(url, title, params) {
	var w = window.open(url, title, params);
	w.onkeydown = function(event) {
		if (event.keyCode == 27) {
			w.close();
		}
	};
	return w;
}

function bDocDownload(objectId, docName) {
	openWindow(getObjectUri(objectId)+"/"+docName);
}

function getPassportName(objectId){
	return "passport "+objectId+".pdf"
}

function passportDownload(objectId) {
	bDocDownload(objectId, getPassportName(objectId))
}

function bMap(objectId, newwindow) {
	newwindow = newwindow == undefined ? true : false;
	objectId = objectId == undefined ? "" : "&objectId="+objectId;
	
	if (newwindow) {
		openWindow(domain+'?interface=iMap'+objectId+"&key="+userKey);
	} else {
		location.href = domain+'?interface=iMap'+objectId+'&key='+userKey;
	}
}

function bCard(objectId, version) {
	openWindow(domain+'?interface=iCard'+(version ? version : '')+'&objectId='+objectId+"&key="+userKey);
}

function getCardVersionByOid(oid){
	var ret = objectlink.gOrm("gCid",[oid]);
	var arr = ["1424","1425"];
	if (ret && ret.length && (arr.indexOf(ret[0][0]) >= 0)){
		return ret[0]
	} else {
		return undefined;
	}
}

function bCadastr(objectCadastrNumber) {
	if (objectCadastrNumber)
		openWindow('http://maps.rosreestr.ru/PortalOnline/?cn='+objectCadastrNumber);
		//openWindow('http://pkk5.rosreestr.ru/#text='+objectCadastrNumber+'&x=&y=&z=&type=1&app=search&opened=1');
	
}

function loadXML(url, isGet, async, asText, func) {
	var req = null;
	if (window.XMLHttpRequest) {
		try {
			req = new XMLHttpRequest();
		} catch (e){}
	} else if (window.ActiveXObject) {
		try {
			req = new ActiveXObject('Msxml2.XMLHTTP');
		} catch (e){
			try {
				req = new ActiveXObject('Microsoft.XMLHTTP');
			} catch (e){}
		}
	}

	if (req) {       
		req.open(isGet ? "GET" : "POST", url, async);
		req.onreadystatechange = function(){
			try {
			if (req.readyState == 4) {
				if (req.status == 200) {
					func(asText ? req.responseText : req.responseXML);
				} else {
					console.log("Не удалось получить данные:\n"+req.statusText);
				}
			}
			} catch( e ) {
			}							
		};
		req.send(null);
	}
}				

function getHttp(uri, func, async, funcError, funcFinnaly) {
	if (async === undefined) async = true;

	$.ajax({
		url: encodeURI(uri),
		cache: false,
		'async': async
	})
	.done(func)
	.fail(funcError)
	.always(funcFinnaly);
};

function getQueryJson(query, func, async, funcError, funcFinnaly) {
	getHttp(domain+"sql2json.php?q="+query, func, async, funcError, funcFinnaly);
};

function postJSON(uri, data, async, func, funcError, funcFinnaly) {
	if (async === undefined) async = true;

	$.ajax({
		url: encodeURI(uri),
		cache: false,
		"data": data,
		"async": async,
		type: "POST",
		dataType: "json"
	})
	.done(func)
	.fail(funcError)
	.always(funcFinnaly);
};

function sqlAsync(query, async, func, funcError, funcFinnaly) {
	postJSON(domain+"sql2json.php", {q : query}, async, func, funcError, funcFinnaly)
};

function postOrm(params, async, func, funcError, funcFinnaly) {
	postJSON("orm.php", {f : params.f, p : JSON.stringify(params.p)}, async, func, funcError, funcFinnaly)
};
	
function sql(query, funcError, funcFinnaly){
	var result;
	sqlAsync(query, false, function(data){ result = data; }, funcError, funcFinnaly)
	return result;
};

function sqlOrm(params, funcError, funcFinnaly){
	var result;
	postOrm(params, false, function(data){ result = data; }, function(e){console.log(e);}, funcFinnaly)
	return result;
};

function sqlOrmA(params, func, funcError, funcFinnaly){
	var result;
	postOrm(params, true, func, function(e){console.log(e);}, funcFinnaly)
	return result;
};

//sqlOrm({f:"gT",p:[["Объект", "Земельные участки"],[],[],[],"*"," and `id Объект`=115"]})	

function orm(query, type) {
	return getOrmObject(sql(query), type)
}

/***	
	return object or array from query-resultset depending on the @query and @type
		@query - string query to a current database through then script - "query2jtml.php"
		@type : ['row2object', 'col2object', 'all2object', 'row2array', 'rows2object', 'row2table', 'col2array', 'all2array']
***/
function getOrmObject(data, type) {
	if (type === undefined) type = null;
	var result = null;
	if (!data) return;
	var columns = data.columns;

	function rows2object() {
		result = [];
		for (var i = 0; i < data.data.length; i++) {
			var row = data.data[i];
			var obj = {};
			for (var j = 0; j < columns.length; j++) {
				var fieldName = columns[j];
				obj[fieldName] = row[columns.indexOf(fieldName)];
			}
			result.push(obj);
		}
	}

	function row2object() {
		result = {};
		
		var value = (data.data.length) ? data.data[0] : undefined;
		if (value) {
		
		for (var i = 0; i < columns.length; i++) {
			var fieldName = columns[i];
			result[fieldName] = value ? value[columns.indexOf(fieldName)] : undefined;
		}		
		} else {result = value};
		
	}
	
	function col2object() {
		result = {};

		$.each(data.data, function(ind, value) {
			result[value[0]] = {"id" : value[0], "ind" : ind};
		})
	}
	
	function all2object() {
		result = {"columns" : columns, "data" : data.data};
	}
	
	function row2array() {
		result = [];
		var value = data.data[0];

		for (var i = 0; i < columns.length; i++) {
			result.push(value[i]);
		}		
	}
	
	function row2table() {
		result = [];
		var value = data.data[0];

		for (var i = 0; i < columns.length; i++) {
			var col = columns[i]
			var val = value[i]
			result.push([col, val]);
		}		
	}

	function col2array(){
		result = [];
		$.each(data.data, function(ind, value) {
			result.push(value[0]);
		})
	}
	
	function all2array() {
		result = data.data;
	}
	
	function all2domtable(){
		result = document.createElement("TABLE");
		var thead = document.createElement("THEAD")
		var tr = document.createElement("TR");
		thead.appendChild(tr);
		
		for (var i=0; i < columns.length; i++){
			var th = document.createElement("TH");
			th.innerHTML = columns[i];
			tr.appendChild(th);
		}
		result.appendChild(thead);
		
		var tbody = document.createElement("TBODY")
		result.appendChild(tbody);

		for (var i=0; i < data.data.length; i++){
			var tr = document.createElement("TR");
			
			for (var j=0; j < data.data[i].length; j++){
				var td = document.createElement("TD");
				td.innerHTML = data.data[i][j];
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		}
	}
	
	if (type == 'col2array') {
		col2array();
	} else if (type == 'row2array') {
		row2array();
	} else if (type == 'col2object') {
		col2object();
	} else if (type == 'row2object') {
		row2object();
	} else if (type == 'rows2object') {
		rows2object();
	} else if (type == 'row2table') {
		row2table();
	} else if (type == 'all2array') {
		all2array();
	} else if (type == 'all2object') {
		all2object();
	} else if (type == 'all2domtable') {
		all2domtable();
	} else if (data.data.length == 0) {
		all2object();
	} else if (data.data.length == 1) {
		if (type == 'array'){
			row2array();
		} else {
			row2object();
		}
	} else if (columns.length == 1) {
		if (type == 'array'){
			col2array();
		} else {
			col2object();
		}
	} else if (columns.length > 1 && data.data.length > 1){
		if (type == 'array'){
			all2array();
		} else {
			all2object();
		}
	} else {
		result = {};
	}
	
	return result;
}

function getOrmObjectFromQuery(uri, type) {
	if (type === undefined) type = null;
	var result = null;
	try {
	getQueryJson(uri, function(dataJSON) {
		var data = JSON.parse(dataJSON);
		result = getOrmObject(data, type);
	}, false);
	} catch (e){ 
		result = {} 

	} finally {
		return result;
		
	}
};

function getOrm(uri, type){//alias for getOrmObjectFromQuery
	return getOrmObjectFromQuery(uri, type);
}

function obj4arr(arr){//return the object with fields and values from array
	var result = {};
	for (var i = 0; i < arr.length; i++) {
		if (typeof(arr[i]) == 'object') {
			result[arr[i][0]] = arr[i];
		} else {
			result[arr[i]] = arr[i];
		}
	}		
	return result;
}

function hash4arr(arr){//return the object with fields and values from array
	var result = {};
	for (var i = 0; i < arr.length; i++) {
		result[arr[i][0]] = arr[i][1];
	}		
	return result;
}

function decorateArr(arr, decorator1, decorator2){//return the object with fields and values from array
	decorator2 = decorator2 || decorator1;
	return (decorator1+arr.join(decorator2+"|"+decorator1)+decorator2).split("|");
}

function eventsList(element) {
	var events = element.data('events');
	if (events !== undefined) return events;

	events = $.data(element, 'events');
	if (events !== undefined) return events;

	events = $._data(element, 'events');
	if (events !== undefined) return events;

	events = $._data(element[0], 'events');
	if (events !== undefined) return events;

	return false;
}

function checkEvent(element, eventname) {
	var events,
		ret = false;

	events = eventsList(element);
	if (events) {
		$.each(events, function(evName, e) {
			if (evName == eventname) {
				ret = true;
			}
		});
	}

	return ret;
}

function eventFire(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function urlRusLat(str) {
    str = str.toLowerCase(); // все в нижний регистр
        var cyr2latChars = new Array(
                ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'],
                ['д', 'd'],  ['е', 'e'], ['ё', 'yo'], ['ж', 'zh'], ['з', 'z'],
                ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'],
                ['м', 'm'],  ['н', 'n'], ['о', 'o'], ['п', 'p'],  ['р', 'r'],
                ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'],
                ['х', 'h'],  ['ц', 'c'], ['ч', 'ch'],['ш', 'sh'], ['щ', 'shch'],
                ['ъ', ''],  ['ы', 'y'], ['ь', ''],  ['э', 'e'], ['ю', 'yu'], ['я', 'ya'],
                 
                ['А', 'A'], ['Б', 'B'],  ['В', 'V'], ['Г', 'G'],
                ['Д', 'D'], ['Е', 'E'], ['Ё', 'YO'],  ['Ж', 'ZH'], ['З', 'Z'],
                ['И', 'I'], ['Й', 'Y'],  ['К', 'K'], ['Л', 'L'],
                ['М', 'M'], ['Н', 'N'], ['О', 'O'],  ['П', 'P'],  ['Р', 'R'],
                ['С', 'S'], ['Т', 'T'],  ['У', 'U'], ['Ф', 'F'],
                ['Х', 'H'], ['Ц', 'C'], ['Ч', 'CH'], ['Ш', 'SH'], ['Щ', 'SHCH'],
                ['Ъ', ''],  ['Ы', 'Y'],
                ['Ь', ''],
                ['Э', 'E'],
                ['Ю', 'YU'],
                ['Я', 'YA'],
                 
                ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'],
                ['f', 'f'], ['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'],
                ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'],
                ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'],
                ['u', 'u'], ['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'],
                ['z', 'z'],
                 
                ['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'],['E', 'E'],
                ['F', 'F'],['G', 'G'],['H', 'H'],['I', 'I'],['J', 'J'],['K', 'K'],
                ['L', 'L'], ['M', 'M'], ['N', 'N'], ['O', 'O'],['P', 'P'],
                ['Q', 'Q'],['R', 'R'],['S', 'S'],['T', 'T'],['U', 'U'],['V', 'V'],
                ['W', 'W'], ['X', 'X'], ['Y', 'Y'], ['Z', 'Z'],
                 
                [' ', '_'],['0', '0'],['1', '1'],['2', '2'],['3', '3'],
                ['4', '4'],['5', '5'],['6', '6'],['7', '7'],['8', '8'],['9', '9'],
                ['-', '-']
 
    );
 
    var newStr = new String();
 
    for (var i = 0; i < str.length; i++) {
 
        ch = str.charAt(i);
        var newCh = '';
 
        for (var j = 0; j < cyr2latChars.length; j++) {
            if (ch == cyr2latChars[j][0]) {
                newCh = cyr2latChars[j][1];
 
            }
        }
        // Если найдено совпадение, то добавляется соответствие, если нет - пустая строка
        newStr += newCh;
 
    }
    // Удаляем повторяющие знаки - Именно на них заменяются пробелы.
    // Так же удаляем символы перевода строки, но это наверное уже лишнее
    return newStr.replace(/[_]{2,}/gim, '_').replace(/\n/gim, '');
}

function isArraysIntersect(arr1,arr2) {
	var idx = null;
	for (var i = 0; i < arr2.length; i++) {
		idx = arr1.indexOf(arr2[i]);
		if (idx >= 0) return true;
	}
	return false;
}

function compareObjectArrays(obj1, obj2){
	return ( JSON.stringify(obj1) == JSON.stringify(obj2) );
}

function splitObjectArray(obj1, obj2){
	var result = {};
	var keyOther = "";
	if (!obj1) return result;
	obj2 = obj2 || {"other" : []};
	
	for (var key2 in obj2) {
		result[key2] = [];
		keyOther = (!obj2[key2].length) ? key2 : "";
		for (var i=0; i < obj2[key2].length; i++){
			var key2InObj1 = obj2[key2][i] in obj1;
			if (key2InObj1) {
				for (var j=0; j < obj1[obj2[key2][i]].length; j++ ) {
					result[key2].push(obj1[obj2[key2][i]][j]);
				}
			}
		}
	}
	
	if (keyOther) {
		var keysObj2 = [];
		for (var key2 in obj2) {
			for (var i=0; i < obj2[key2].length; i++ ) {
				keysObj2.push(obj2[key2][i]);
			}
		}
		
		for (var key1 in obj1) {
			if (keysObj2.indexOf(key1)==-1) {
				for (var i=0; i < obj1[key1].length; i++ ) {
					result[keyOther].push(obj1[key1][i]);
				}
			}
		}
	}
	
	return result;
}

function iMap(opts, callback, dblclick, funcError, funcFinnaly){
	var tu = objectlink.gOrm("gAnd",[[classes["ТУ"]],"n",true]);//orm("select n from ("+objectlink.gOCQ("ТУ")+")xx", "col2array");//getOrm("select name from "+territorialDepartmentTableName, "col2array"); //["УЭИ","СЗТП","СиДВ"]
	var CAT_TERRITORIAL_DEPARTMENT = getOrmObject({columns:["n"],data:tu}, "col2array");
	var whereCond = opts.whereCond || "";

	var sel = objectlink.gOrm("gTq",[["Объект","Адрес","Кадастр","Широта","Долгота","Номер","ИК","ТУ","Ответственный"],[[7,6],[8,6]],[6,7],[],0]);
	sel = "select * from (select номер rowid, ту tu, ик ik, ответственный manager, объект name, адрес address, кадастр cadastr, широта lat, долгота lon from ("+sel+")x)x where 1=1 "+whereCond+" order by rowid ";

	var func = function(dataJSON) {
		var data = dataJSON;//JSON.parse(dataJSON);
		if (data.columns[0] == "result" && data.data[0][0] == false) {callback(undefined); return;};
		var ObjectIcon = L.Icon.extend({
			options: {
				iconSize:     [40, 40],
				iconAnchor:   [20, 40],
				popupAnchor:  [0, -40]
			}
		});

		var objectIcons = [
			new ObjectIcon({iconUrl: 'images/marker20.png'}), 
			new ObjectIcon({iconUrl: 'images/marker22.png'}), 
			new ObjectIcon({iconUrl: 'images/marker23.png'}),
			new ObjectIcon({iconUrl: 'images/marker21.png'}), 
		];
		
		var getButtonCardHTML = function(id){
			return "<button onclick=\"bCard('"+id+"');\" /><img src='images/bCard.png' width='32'/><br>карточка <br> объекта</button>";
		}

		var columns = data.columns;
		var sysColumnsCount = 0;
		var minLat = 1000, minLon = 1000, maxLat = 0, maxLon = 0;
		
		var markers = L.layerGroup();

		$.each(data.data, function(ind, value) {
			var lat = value[columns.indexOf("lat")];
			var lon = value[columns.indexOf("lon")];
			minLat = Math.min(lat, minLat);
			minLon = Math.min(lon, minLon);
			maxLat = Math.max(lat, maxLat);
			maxLon = Math.max(lon, maxLon);
			
			var objectHTML = [];
			objectHTML.push("<table width='300' style='background-color:#fff'>");
			
			$.each(columns, function(j) {
				if (j>=sysColumnsCount)
					objectHTML.push("<tr><td>"+ifnull(value[j])+"</td></tr>");
			});
			
			var objectId = value[columns.indexOf("rowid")];
			objectHTML.push("<tr><td colspan='1'>"+getButtonCardHTML(objectId)+"&nbsp;&nbsp;");
			objectHTML.push("<button onclick=\"bDocDownload('"+objectId+"', '"+getPassportName(objectId)+"')\"><img src='images/pdf.png' width='32'/><br>паспорт <br> объекта</button>");
			objectHTML.push("</td></tr></table>");

			var icon = {icon:objectIcons[0]};
			var ind = CAT_TERRITORIAL_DEPARTMENT.indexOf(value[columns.indexOf("tu")]);
			if (~ind)
				icon = {icon:objectIcons[ind+1]};
			
				L.marker([lat, lon], icon)
					.addTo(markers)
					.on("dblclick", function(){
						dblclick( {"lat":lat, "lon":lon} )
					})
					.bindPopup(objectHTML.join(''));
		});
		
		callback({
			"rowsCount":data.data.length, 
			"markers":markers, 
			"bounds":{
				"minLat":minLat, 
				"minLon":minLon, 
				"maxLat":maxLat, 
				"maxLon":maxLon
			}
		});
		
	};
	sqlAsync(sel, true, func, funcError, funcFinnaly);
	
}


/*
Return matrix array as [[1,2,3],[4,5,6]] from line array as [1,2,3,4,5,6]
*/
function lineArray2matrixArray(arr, rows, cols, fill){
	var result = [];
	if (!arr || arr.length == 0) return result;
	
	var ind = 0;
	for (var i=0; i < rows; i++) {
		result[i] = [];
		for (var j=0; j < cols; j++) {
			if (arr[ind] || fill)
				result[i].push(arr[ind++]);
		}
	}
	
	return result;
}

/*
Return html table menu from object as [{field1:val11, field2:val12}, {field1:val21, field2:val22}]
*/
function iMainMenu(interfaces){
	var table = cDom("TABLE");
	table.classList.add("tMenu");
	for (var row=0; row < interfaces.length; row++) {
		var tr = table.appendChild(cDom("TR"));
		for (var col=0; col < interfaces[row].length; col++) {
			var td = tr.appendChild(cDom("TD"));
			var but = td.appendChild(cDom("TD"));
			var img = but.appendChild(cDom("IMG"));
			var lab = but.appendChild(cDom("LABEL"));

			td.setAttribute("align","center");
			but.classList.add("menubutton");
			but.style.width = "200px";
			but.style.height = "180px";
			img.src = domain+interfaces[row][col]['Файлы'];
			img.style.height = "130px";
			img.style.width= "auto";
			lab.innerHTML = interfaces[row][col]['Главное меню'];
			
			if (interfaces[row][col]['Ключи интерфейсов']){
				but.interfaceKey = interfaces[row][col]['Ключи интерфейсов'];
				but.id = "b"+but.interfaceKey;
				but.hidden = true;
				but.onclick = function(){
					location.href = "?"+interfaceUrlKey+"="+this.interfaceKey+"&key="+userKey;
				}
			}
		}
	}
	return table;
}

/*
Return object as [{field1:val11, field2:val12}, {field1:val21, field2:val22}] from sql query table
*/
/*
function getMainMenuJson() {
	return getOrm("select * from "+mainMenuTableName, "rows2object");
	
}

function getObjectPowerJson(id) {
	return getOrm("select * from "+objectPowerTable+" where rowid = "+id, "row2object");
	
}

function getObjectManagerJson(manager) {
	return getOrm("select * from "+objectManagerTable+" where name = '"+manager+"'", "row2object");
	
}
*/
function slice(str, count) {
	count = count ? count : 1;
	return str.substr(0, str.length - count);
}

function isObject(val) {
	return val instanceof Object;

}

function isDOM(val) {
	return isObject(val) && val.toString().indexOf('HTML') > 0;

}

function isNull(val) {
	return val == null
}

function val2Arr(val) {
	var result = [];
	if (val) {
		result = (val.length || val.length == 0) ? val : [val];
	}
	return result;
}

function addToTable(jsTable, dom){
	var pButton = jsTable.panelButtonsAdd;
	if (pButton) {
		pButton.set(dom);
	}
}

function addMapButton2Table(jsTable, idFieldIndex){
	var bToMap = document.createElement("BUTTON");
	bToMap.setAttribute("title", "Показать отображаемые объекты на карте");
	var img = new Image();
	img.src = "images/bMap.png";
	img.height = 32;
	bToMap.appendChild(img);
	bToMap.onclick = function(){
		var rows = jsTable.rows.get();
		var cols = jsTable.columns.get();
		var ind = idFieldIndex;
		
		if (rows && ~ind) {
			var arr = [];
			for (var i = 0; i < rows.length; i++) {
				arr.push(rows[i][ind]);
			}
		}
		bMap(arr.join(","))
	}
	addToTable(jsTable, bToMap);
}

function fieldValsFromObjects(objs, field){
	var result = [];
	if (objs && objs.length) {
		for (var i=0; i < objs.length; i++) {
			if ((typeof objs[i]) == "object"){
				var keys = Object.keys(objs[i]);
				if (~keys.indexOf(field)) {
					result.push(objs[i][field]);
				}
			}
		}
	}
	return result;
};

function arr2obj(arr, value){
	var result = {};
	
	if (arr && arr.length) {
		for (var i=0; i < arr.length; i++) {
			result[arr[i]] = value
		}
	}
		
	return result;
}

function windowHeight(){
   return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
}	

function windowWidth(){
   return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
}	

function getRowTable4Class(objectClass, objectId){
	var result = getOrm("select * from `expls"+objectClass+"` where rowid = '"+objectId+"'", "row2table");
	return result;
}

function domCardTable(objectId, columns){
	//columns = [new Column({name: "rowid", caption: "№"}), new Column({name: "tu", caption: "Турритор Упр"})];
	var js = getRowTable4Class('Object', objectId);
	var result = document.createElement('DIV');
	var tb = document.createElement('TABLE');
	tb.setAttribute("border","1");
	
	$.each(js, function(ind, val){
		var tr = document.createElement("TR");
		var tdf = document.createElement("TD");
		var tdv = document.createElement("TD");
		tb.appendChild(tr);
		if (columns && columns.length && columns[ind] instanceof Column){
			tdf.innerHTML = columns[ind].caption;
		} else {
			tdf.innerHTML = js[ind][0];
		}
		tdv.innerHTML = js[ind][1];
		tr.appendChild(tdf);
		tr.appendChild(tdv);
			
	})
	var bToCard = document.createElement("BUTTON");
	var img = new Image();
	img.src = domain+"images/bCard.png";
	img.style.width = "32px";
	bToCard.appendChild(img);
	var l = document.createElement("LABEL");
	l.innerHTML = "<br> карточка <br> объекта";
	bToCard.appendChild(l);
	bToCard.objectId = objectId;
	
	bToCard.onclick = function(){
		alert(this.objectId);
		//bCard(1);
	}
	result.appendChild(tb);
	result.appendChild(bToCard);
	return result;
};

function openCardWindow(objectId, columns, opt){
	if (!opt) opt = {};
	opt.width = opt.width || "300";
	opt.height = opt.height || "370";
	opt.left = opt.left || "500";
	opt.top = opt.top || "250";
	
	var dom = domCardTable(objectId, columns);
	var w = openWindow("blank.php", "Карточка записи", "width="+opt.width+",height="+opt.height+",left="+opt.left+",top="+opt.top);
	w.document.write(dom.outerHTML);
	return w;
}

function export2Excel(domTable){
	var dom = domTable.cloneNode(true);
	$(dom).find("IMG, DIV.other").each(function(){
		this.remove();
	})
	$(dom).find("TEXTAREA").each(function(){
		this.parentNode.innerHTML = this.innerHTML;
	})
	window.open('data:application/vnd.ms-excel,' + encodeURIComponent(dom.outerHTML));
}

function rgb(r,g,b)
{
	var color = "";
	var aRGB = [r, g, b];

	if(aRGB) {
		for (var i=0;  i<=2; i++) {
			color += aRGB[i].toString(16);
		}
	} 
	color = "#"+color;

	return color;
}

function getIconFile(filename){
	var iconFile = 
		(~filename.indexOf(".pdf")) ? "pdf.png" : 
		(~filename.indexOf(".doc")) ? "word.png" : 
		(~filename.indexOf(".xls")) ? "excel.png" : 
		(~filename.indexOf(".jpg")) ? "jpg.png" : 
		(~filename.indexOf(".png")) ? "jpg.png" : 
		(~filename.indexOf(".bmp")) ? "jpg.png" : 
		"file.png";
	return "images/"+iconFile;
}
				
function getFileButtonHtml(fn){
	var cap = fn.split("/")[fn.split("/").length-1];
	var iconFile = getIconFile(fn.toLowerCase());
	var isImage = iconFile == "images/jpg.png";
	return "<button style='border: 0px; cursor:pointer' onclick='openWindow(\""+domain+url2cp1251(fn)+"\")' title='скачать файл' >"+
		"<table style='display:inline'><tr align='middle'><td><img src='"+(!isImage ? iconFile : domain+url2cp1251(fn))+"' width='"+(!isImage ? 32 : 64)+"'/></td></tr>"+
		"<tr align='middle'><td style='font-size:11px; width:64px'>"+cap+"</td></tr></table></button>";
	
}

////////////codedecode charset
var t = {};

t['%D0%B0']='%E0';t['%D0%B1']='%E1';t['%D0%B2']='%E2';t['%D0%B3']='%E3';t['%D0%B4']='%E4';
t['%D0%B5']='%E5';t['%D1%91']='%B8';t['%D0%B6']='%E6';t['%D0%B7']='%E7';t['%D0%B8']='%E8';
t['%D0%B9']='%E9';t['%D0%BA']='%EA';t['%D0%BB']='%EB';t['%D0%BC']='%EC';t['%D0%BD']='%ED';
t['%D0%BE']='%EE';t['%D0%BF']='%EF';t['%D1%80']='%F0';t['%D1%81']='%F1';t['%D1%82']='%F2';
t['%D1%83']='%F3';t['%D1%84']='%F4';t['%D1%85']='%F5';t['%D1%86']='%F6';t['%D1%87']='%F7';
t['%D1%88']='%F8';t['%D1%89']='%F9';t['%D1%8C']='%FC';t['%D1%8B']='%FB';t['%D1%8A']='%FA';
t['%D1%8D']='%FD';t['%D1%8E']='%FE';t['%D1%8F']='%FF';t['%D0%90']='%C0';t['%D0%91']='%C1';
t['%D0%92']='%C2';t['%D0%93']='%C3';t['%D0%94']='%C4';t['%D0%95']='%C5';t['%D0%81']='%A8';
t['%D0%96']='%C6';t['%D0%97']='%C7';t['%D0%98']='%C8';t['%D0%99']='%C9';t['%D0%9A']='%CA';
t['%D0%9B']='%CB';t['%D0%9C']='%CC';t['%D0%9D']='%CD';t['%D0%9E']='%CE';t['%D0%9F']='%CF';
t['%D0%A0']='%D0';t['%D0%A1']='%D1';t['%D0%A2']='%D2';t['%D0%A3']='%D3';t['%D0%A4']='%D4';
t['%D0%A5']='%D5';t['%D0%A6']='%D6';t['%D0%A7']='%D7';t['%D0%A8']='%D8';t['%D0%A9']='%D9';
t['%D0%AC']='%DC';t['%D0%AB']='%DB';t['%D0%AA']='%DA';t['%D0%AD']='%DD';t['%D0%AE']='%DE';
t['%D0%AF']='%DF';

var rt = {};

rt['%E0']='%D0%B0';rt['%E1']='%D0%B1';rt['%E2']='%D0%B2';rt['%E3']='%D0%B3';rt['%E4']='%D0%B4';
rt['%E5']='%D0%B5';rt['%B8']='%D1%91';rt['%E6']='%D0%B6';rt['%E7']='%D0%B7';rt['%E8']='%D0%B8';
rt['%E9']='%D0%B9';rt['%EA']='%D0%BA';rt['%EB']='%D0%BB';rt['%EC']='%D0%BC';rt['%ED']='%D0%BD';
rt['%EE']='%D0%BE';rt['%EF']='%D0%BF';rt['%F0']='%D1%80';rt['%F1']='%D1%81';rt['%F2']='%D1%82';
rt['%F3']='%D1%83';rt['%F4']='%D1%84';rt['%F5']='%D1%85';rt['%F6']='%D1%86';rt['%F7']='%D1%87';
rt['%F8']='%D1%88';rt['%F9']='%D1%89';rt['%FC']='%D1%8C';rt['%FB']='%D1%8B';rt['%FA']='%D1%8A';
rt['%FD']='%D1%8D';rt['%FE']='%D1%8E';rt['%FF']='%D1%8F';rt['%C0']='%D0%90';rt['%C1']='%D0%91';
rt['%C2']='%D0%92';rt['%C3']='%D0%93';rt['%C4']='%D0%94';rt['%C5']='%D0%95';rt['%A8']='%D0%81';
rt['%C6']='%D0%96';rt['%C7']='%D0%97';rt['%C8']='%D0%98';rt['%C9']='%D0%99';rt['%CA']='%D0%9A';
rt['%CB']='%D0%9B';rt['%CC']='%D0%9C';rt['%CD']='%D0%9D';rt['%CE']='%D0%9E';rt['%CF']='%D0%9F';
rt['%D0']='%D0%A0';rt['%D1']='%D0%A1';rt['%D2']='%D0%A2';rt['%D3']='%D0%A3';rt['%D4']='%D0%A4';
rt['%D5']='%D0%A5';rt['%D6']='%D0%A6';rt['%D7']='%D0%A7';rt['%D8']='%D0%A8';rt['%D9']='%D0%A9';
rt['%DC']='%D0%AC';rt['%DB']='%D0%AB';rt['%DA']='%D0%AA';rt['%DD']='%D0%AD';rt['%DE']='%D0%AE';
rt['%DF']='%D0%AF';

function convert_to_cp1251(str) {
	var ret='';

	var l=str.length;
	var i=0;
	while (i<l) {

		var f=0;
		for (var keyVar in t) {
			if (str.substring(i,i+6)==keyVar) {ret+=t[keyVar];i+=6;f=1;}
			}

		if (!f) {ret+=str.substring(i,i+1);i++;}
		}

	return ret;
	}

function convert_from_cp1251(str) {
	var ret='';

	var l=str.length;
	var i=0;
	while (i<l) {

		var f=0;
		for (var keyVar in rt) {
			if (str.substring(i,i+3)==keyVar) {ret+=rt[keyVar];i+=3;f=1;}
			}

		if (!f) {ret+=str.substring(i,i+1);i++;}
		}

	return ret;
	}

function urlencode(str) {
    str = (str + '').toString();

    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
    replace(/\)/g, '%29').replace(/\*/g, '%2A');//.replace(/%20/g, '+');
	}

function urldecode (str) {
	var ret;
	try {ret=decodeURIComponent((str + '').replace(/\+/g, '%20'));}
	catch (e) {}
	return ret;
	}
	
function url2cp1251(str) {
	var arr = str.split("/");
	var val = arr[arr.length-1];
	val = convert_to_cp1251(urlencode(val));
	arr[arr.length-1] = val;
	return (host == "kulsha.ru") ? arr.join("/") : str;
}
/*
function codenet_urlencode(str) {
	$('#text_to_utf8').val(urlencode(str));
	$('#text_to_cp1251').val(convert_to_cp1251(urlencode(str)));
	$('#text_to_escape').val(escape(str));
	}

function codenet_unescape(str) {
	$('#text_from').val(unescape(str));
	$('#text_to_utf8').val(urlencode(unescape(str)));
	$('#text_to_cp1251').val(convert_to_cp1251(urlencode(unescape(str))));
	}

function codenet_urldecode(str) {
	$('#text_from').val(urldecode(str));
	$('#text_to_escape').val(escape(urldecode(str)));
	$('#text_to_cp1251').val(convert_to_cp1251(str));
	}

function codenet_urldecode_cp1251(str) {
	$('#text_from').val(urldecode(convert_from_cp1251(str)));
	$('#text_to_escape').val(escape(urldecode(convert_from_cp1251(str))));
	$('#text_to_utf8').val(convert_from_cp1251(str));
	}

$(document).ready(function() {
	$('#text_from').change(function() {codenet_urlencode($('#text_from').val());});
	$('#text_from').click (function() {codenet_urlencode($('#text_from').val());});
	$('#text_from').keyup (function() {codenet_urlencode($('#text_from').val());});

	$('#text_to_escape').change(function() {codenet_unescape($('#text_to_escape').val());});
	$('#text_to_escape').click (function() {codenet_unescape($('#text_to_escape').val());});
	$('#text_to_escape').keyup (function() {codenet_unescape($('#text_to_escape').val());});

	$('#text_to_utf8').change(function() {codenet_urldecode($('#text_to_utf8').val());});
	$('#text_to_utf8').click (function() {codenet_urldecode($('#text_to_utf8').val());});
	$('#text_to_utf8').keyup (function() {codenet_urldecode($('#text_to_utf8').val());});

	$('#text_to_cp1251').change(function() {codenet_urldecode_cp1251($('#text_to_cp1251').val());});
	$('#text_to_cp1251').click (function() {codenet_urldecode_cp1251($('#text_to_cp1251').val());});
	$('#text_to_cp1251').keyup (function() {codenet_urldecode_cp1251($('#text_to_cp1251').val());});
});
*/


function cDom(type, innerHTML, parentDom){
	var ret = document.createElement(type);
	if (innerHTML)
		ret.appendChild(typeof(innerHTML)=="object" ? innerHTML : document.createTextNode(innerHTML || ""));
	if (parentDom && ret) parentDom.appendChild(ret);
	return ret;
}

function gDom(id){
	return document.getElementById(id);
}

function cInp(type, innerHTML, parentDom) {
	var el = cDom("INPUT", innerHTML, parentDom);
	el.setAttribute("type", type);
	return el;
}

function getMainInterfaceKey(userId){
	var num = objectlink.gOrm("gT2",[["Пользователи","Интерфейсы","Ключи интерфейсов"],[[2,1]],[],0,["`Ключи интерфейсов`"],"and `id_Пользователи` = "+userId]);
	num = getOrmObject({columns:["Ключи интерфейсов"],data:num},"col2array");

	if (num.length) {
		num = num[0];
	} else {
		num = undefined;
	}
	return num;
};

function getInterfaceElements(userId, interfaceKey){
	var num = objectlink.gOrm("gT",[["Пользователи","Группы прав пользователей","Элементы интерфейсов","Интерфейсы","Ключи интерфейсов"],[[2,1],[3,2],[4,3]],[1,3],[],false,"`Элементы интерфейсов`","and `id_Пользователи` = "+userId+" and `Ключи интерфейсов` = '"+interfaceKey+"'"]);
	num = getOrmObject({columns:["Элементы интерфейсов"],data:num},"col2array");
	return num;
};

function showInterfaceElements(userId, interfaceKey){
	var policy = getInterfaceElements(userId, interfaceKey);
	for (var i=0; i < policy.length; i++){
		var dom = gDom(policy[i])
		if (dom) {
			dom.hidden = false;
		}
	}
	
	return policy;
};

function $_GET(keyname, delimiter, uri){
	var searchline = uri || location.search;
	var search = searchline.split(delimiter || "?")
	search = search.length > 1 ? search[1] : "";
	var params = search.split("&");
	for (var i=0; i < params.length; i++){
		var param = params[i].split("=");
		if (param[0] == keyname){
			return param[1];
		}
	}
	return undefined;
}

///get coord from SAS format from SQL ttt and create Polygon object class
function coordsFromSas(){
	var ret = [];
	var coords = orm("select f1 from ttt", "col2array");
	for (var i=0; i < coords.length; i=i+2){
		var lon = coords[i].split("=")[1];
		var lat = coords[i+1].split("=")[1];
		ret.push([lat, lon]);
	}
	return ret;
}

///////	get coord from KML format from uri of kml file
function coordsFromKml(uri){
	var result;
	loadXML(uri, true, false, false, function(data){
		var ret = data.getElementsByTagName("coordinates")[0].innerHTML;
		if (ret) {
			var coords = ret.split(" ");
			var arr = [];
			for (var i=0; i < coords.length; i++) {
				if (coords[i]) {
					var coord = coords[i].split(",");
					if (coord) {
						var lon = coord[0];
						var lat = coord[1];
						arr.push([lat, lon]);
					}
				}
			}
			result = arr;
		}
	})
	return result;
}

function createPolygonObject(coords, oid, newObjectName){
	return objectlink.gOrm("createPolygonObject",[coords, oid, newObjectName]);
	
}

function createPolygonFromSas(oid){
	return createPolygonObject(coordsFromSas(), oid);
	
}

function createPolygonFromKml(uri, oid){
	var arr = uri.split("/");
	var fn = arr[arr.length-1];
	return createPolygonObject(coordsFromKml(uri), oid, "полигон на карте объекта "+oid+" "+fn);
	
}
////////////

function createObjectsFromTable(fieldname, tablename, cid){
	var ret = [];
	var vals = orm("select f1 from ttt", "col2array");
	for (var i=0; i < vals.length; i++){
		var val = vals[i];
		objectlink.gOrm("cO", [val, cid]);
	}
	return vals.length;

};

function createObjectsFromObjectDir(oid){
	var objectPath = "data/"+oid+"/";
	var imageFiles = [];
	var otherFiles = [];
	var len;
	getHttp("scanDir.php?path="+objectPath, function(imagesJSON) {
		var files = JSON.parse(imagesJSON);
		var allFiles = splitObjectArray(files, {"other" : []} );
		var vals = allFiles.other.sort();
		
		for (var i=0; i < vals.length; i++){
			var val = vals[i];
			var obj = objectlink.gOrm("cO", ["data/"+oid+"/"+val, classes["Файлы"] || 1410]);
			if (obj) objectlink.gOrm("cL", [obj, oid]);
		}
		len = vals.length;
		
	}, false);
	return len;
	
}

function fillCard(arr, oid, cont){
	if (!cont || !arr || !arr.length) {
		$(cont).append("<h3 style='color:#999'>Нет данных</h3>");
		return;
	}
	var cn_ = arr[0];
	$(cont).append("<tr><td colspan='2'><h3 style='color:#999'>"+cn_+"</h3></td></tr>");
	var arrC = arr;
	var rows = objectlink.gOrm("gT",[arrC, [],[arrC.length-1],[],false,"*"," and `id_"+arr[arr.length-1]+"` = "+oid]);
	var row = lineArray2matrixArray(rows[0], arrC.length, 2, true);
	var txt = [];
	var start = 1;
	var end   = arrC.length-1;
	var sliceNum = arrC.indexOf("Файлы")-arrC.length-1;
	for (var i=start; i < end; i++){
		var cellData = "";
		if (row.length && row[i] && row[i].length && row[i][1]){
			if (i < (end-1)){
				cellData = row[i][1];
				
			} else {
				if (rows.length == 1) {
					cellData = getFileButtonHtml(row[i][1]);
				} else {
					for (var j=0; j < rows.length; j++) {
						cellData = cellData + (rows.length < 3 ? "<td>" : "<tr><td align='center'>") + getFileButtonHtml(rows[j].slice(sliceNum)[0]) + (rows.length < 3 ? "</td>" : "</td></tr>");
					}
					cellData = "<table>"+(rows.length < 3 ? "<tr>" : "")+cellData+(rows.length < 3 ? "</tr>" : "")+"</table>"
				}
			}
		} else {
			var cellData = "<label style='color:#555'>нет данных</label>";
		}
		txt.push("<tr><td style='border-bottom:1px solid #333; color:#999'>"+arrC[i]+":</td><td style='border-bottom:1px solid #333; width:50%'>"+cellData+"</td></tr>");
		
	}
	$(cont).append("<tr><td>"+txt.join("")+"</td></tr>");
	$(cont).append("<tr height='10'><td colspan='2'></td></tr>");
}	

function fillCard2(arr, oid, cont){
	if (!cont || !arr || !arr.length) {
		$(cont).append("<h3 style='color:#999'>Нет данных</h3>");
		return;
	}
	var cn_ = arr[0];
	$(cont).append("<tr class='h3caption'><td colspan='2'><h3 style='color:#999'>"+cn_+"</h3></td></tr>");
	var arrC = arr;
	var rows = objectlink.gOrm("gT",[arrC, [],[arrC.length-1],[],false,decorateArr(arrC, "`").join(",")," and `id_"+arr[arr.length-1]+"` = "+oid+" order by "+decorateArr(arrC, "`id_", "`").join(",")]);
	var tb = cont.appendChild(cDom("TABLE"));
	var filesInd = arrC.indexOf("Файлы");

	var vals = [];
	var isValsNotNull = false;
	for (var i=1; i < arrC.length-1; i++){
		var isFiles = filesInd && filesInd == i;

		var tr = tb.appendChild(cDom("TR"));
		var td1 = tr.appendChild(cDom("TD"));
		var td2;
		td1.style.borderBottom = "1px solid #333";
		td1.style.color = "#999";
		var divVal = td1.appendChild(cDom("DIV"));
		
		if (isFiles) {
			td1.setAttribute("colspan", 2);
		} else {
			td1.innerHTML = arrC[i];
			td1.setAttribute("valign", "top");
			td2 = tr.appendChild(cDom("TD"));
			td2.style.borderBottom = "1px solid #333";
		}
		
		var val = null;
		var vals = [];
		for (var j=0; j < rows.length; j++){
			if (val != rows[j][i] && vals.indexOf(rows[j][i]) == -1){
				vals.push(rows[j][i]);
				if (isFiles) {
					$(divVal).append(getFileButtonHtml(rows[j][i]));
				} else {
					divVal = td2.appendChild(cDom("DIV"));
					divVal.innerHTML = rows[j][i];
				}
			}
			val = rows[j][i];
			isValsNotNull = isValsNotNull || (rows[j][i] != "")
		}
		if (!isFiles && (divVal.innerHTML == "")) {
			tr.hidden = true;
		}
	}
	var caps = document.getElementsByClassName("h3caption")
	caps[caps.length-1].hidden = !isValsNotNull;
}	


function fillCardEasy(arr, id, cont){
	if (!cont || !arr || !arr.length) {
		$(cont).append("<h3 style='color:#999'>Нет данных</h3>");
		return;
	}

	var arrC = arr;
	var filesInd = arrC.indexOf("Файлы");
	var rows = objectlink.gOrm("gT2",[arrC,[],[],false,decorateArr(arrC, "`")," and `id_"+arrC[0]+"`="+id+" order by "+decorateArr(arrC, "`id_", "`").join(",")]);
	var tb = cont.appendChild(cDom("TABLE"));

	var vals = [];
	var isValsNotNull = false;
	for (var i=0; i < arrC.length; i++){
		var isFiles = filesInd && filesInd == i;

		var tr = tb.appendChild(cDom("TR"));
		var td1 = tr.appendChild(cDom("TD"));
		var td2;
		td1.style.borderBottom = "1px solid #333";
		td1.style.color = "#999";
		var divVal = td1.appendChild(cDom("DIV"));
		
		if (isFiles) {
			td1.setAttribute("colspan", 2);
		} else {
			td1.innerHTML = arrC[i];
			td1.setAttribute("valign", "top");
			td2 = tr.appendChild(cDom("TD"));
			td2.style.borderBottom = "1px solid #333";
		}
		
		var val = null;
		var vals = [];
		for (var j=0; j < rows.length; j++){
			if (val != rows[j][i] && vals.indexOf(rows[j][i]) == -1){
				vals.push(rows[j][i]);
				if (isFiles) {
					$(divVal).append(getFileButtonHtml(rows[j][i]));
				} else {
					divVal = td2.appendChild(cDom("DIV"));
					divVal.innerHTML = rows[j][i];
				}
			}
			val = rows[j][i];
			isValsNotNull = isValsNotNull || (rows[j][i] != "")
		}
		if (!isFiles && (divVal.innerHTML == "")) {
			tr.hidden = true;
		}
	}
}	

function fillSelectDom(dom, values) {
	dom.appendChild(cDom("OPTION"));
	for (var i=0; i < values.length; i++){
		var opt = cDom("OPTION");
		opt.innerHTML = values[i][1];
		opt.value = values[i][0];
		opt.oid = values[i][0];
		opt.id = "opt"+values[i][0];
		dom.appendChild(opt);
	}
}

function d2str(d) {
	var dt = d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2) + ("0" + d.getDate()).slice(-2) + ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2);
	return dt
}

function getFieldVal(f) {
	var vals = [];
	switch (f.ft) {
		case "hidden":
			var val = f.linked0 ? f.fn + " " + d2str(new Date()) + " " : "";
			for (var i=0; i < f.linked.length; i++) {
				val = val + getFieldVal(f.linked[i]).join("");
			}
			if (!f.elem[0].value) {
				vals.push(val);
			} else {
				vals.push(f.elem[0].value);
			}
		break;
		case "edit": 
		case "date": 
		case "combobox": 
			vals.push(f.elem[0].value);
		break;
		case "checkbox": 
			for (var i=0; i < f.elem.length; i++) {
				if (f.elem[i].checked) {
					vals.push(f.elem[i].val);
				}
			}
		break;
		case "memo": 
			vals.push(f.elem[0].value);
		break;
	}
	return vals;
}

function saveField(f) {
	var ret;
	var cid = classes[f.fn];
	var pid = f.pid;

	var oid;
	var vals = getFieldVal(f);
	
	switch (f.ft) {
		case "combobox": 
			oid = vals[0];
		break;
	}
	
	for (var i=0; i < vals.length; i++) {
		if (!oid && vals[i]) {
			oid = oid || objectlink.gOrm("getObjectFromClass", [cid, vals[i]]);
			oid = oid && oid.length ? oid[0][0] : undefined;
			oid = oid || objectlink.gOrm("cO", [vals[i], cid, userId]);
		}
		
		ret = oid;
		
		if (pid && oid && vals[i] != f.def) {
			objectlink.gOrm("cL", [oid, pid, userId]);
		}
		
		//console.log(pid);
		oid = undefined;
	
	}
	
	return ret;
	
}

function getFieldHtml(fn, ft, def) {
	def = def || "";
	var tr = cDom("TR");
	tr.elem = [];
	tr.fn = fn;
	tr.ft = ft;

	var td = tr.appendChild(cDom("TD"));
	td.style.borderBottom = "1px solid #c4baa5";
	td.innerHTML = fn;
	
	switch (ft) {
		case "hidden":
			td.style.fontWeight = "bold";
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var inp = td.appendChild(cDom("INPUT"));
			inp.setAttribute("type", "text");
			inp.value = def;
			tr.elem.push(inp);
			td.setAttribute("hidden", true);
			tr.def = def;
			
		break;
		case "edit":
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var inp = td.appendChild(cDom("INPUT"));
			inp.setAttribute("type", "edit");
			inp.value = def;
			inp.style.width = "100%";
			
			tr.elem.push(inp);
			tr.def = def;
			
		break;
		case "date":
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var inp = td.appendChild(cDom("INPUT"));
			inp.setAttribute("type", "date");
			inp.value = def;
			//var d = def ? new Date(def) : undefined;
			//if (d && d.setDate(d.getDate() + 14) < new Date()) inp.style.backgroundColor = "#ffdddd";
			inp.style.width = "100%";
			
			tr.elem.push(inp);
			tr.def = def;
			
		break;
		case "checkbox":
			var vals = objectlink.gOrm("gT2",[[fn]]);
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var tb_ = td.appendChild(cDom("TABLE"));
			var trH = tb_.appendChild(cDom("TR"));
			var trD = tb_.appendChild(cDom("TR"));
			for (var i=0; i < vals.length; i++) {
				var td = trH.appendChild(cDom("TD"));
				td.align = "center";
				td.innerHTML = vals[i][1];
				var td = trD.appendChild(cDom("TD"));
				td.align = "center";
				var ch = td.appendChild(cDom("INPUT"));
				ch.setAttribute("type", "checkbox");
				ch.val = vals[i][1];
				tr.elem.push(ch);
				ch.checked = (vals[i][1] == def);
				
			}
			tr.def = def;
		
		break;
		case "combobox":
			var vals = objectlink.gOrm("gT2",[[fn]]);
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var cb = td.appendChild(cDom("SELECT"));
			tr.elem.push(cb);
			fillSelectDom(cb, vals);
			
			var opts = cb.getElementsByTagName("OPTION");
			for (var i=0; i < opts.length; i++)
				if (opts[i].innerHTML == def) cb.value = opts[i].value;
			cb.style.width = "100%";
			tr.def = def;
		break;
		case "memo":
			var td = tr.appendChild(cDom("TD"));
			td.style.borderBottom = "1px solid #c4baa5";
			var inp = td.appendChild(cDom("TEXTAREA"));
			inp.innerHTML = def;
			inp.style.width = "500px";
			inp.style.height = "50px";
			tr.elem.push(inp);
			tr.def = def;
			
		break;
	}
	return tr;
}

///////////////

class TDomValue {
	constructor(dom, def, getValFunc){ 
		if (def == undefined)  def = "";
		this.getValFunc = getValFunc;
		this._dom = dom;
		this.value = def; 

		var that = this;
		this._dom.onchange = function() {
			that.value = this.value;
		}

	}
	get value() { 
		return this.getValFunc && typeof this.getValFunc == "function" ? this.getValFunc(this) : 
			this.getValFunc ? this.getValFunc : 
			this._dom.value;
		
	}
	set value(val) { this._dom.value = val; }
	get dom() { return this._dom; }
	set dom(dom) { this._dom = dom; }
}

class TLabel extends TDomValue {
	constructor(def, getValFunc, parentDom) { 
		super(cDom("edit", null, parentDom), def, getValFunc); 
		this.dom.setAttribute("readOnly", "true");
		this.dom.style.backgroundColor = "transparent";
		this.dom.style.border = "0px";
	}
}

class THidden extends TLabel {
	constructor(def, getValFunc, parentDom) { 
		super(def, getValFunc, parentDom);
		this.dom.hidden = true;
	}
}

class TEdit extends TDomValue {
	constructor(def, getValFunc, parentDom) { super(cInp("edit", null, parentDom), def, getValFunc); }
}

class TDate extends TDomValue {
	constructor(def, getValFunc, parentDom) { super(cInp("date", null, parentDom), def, getValFunc); }
}

class TMemo extends TDomValue {
	constructor(def, getValFunc, parentDom) { super(cDom("textarea", null, parentDom), def, getValFunc); }
}

class TCombo extends TDomValue {
	constructor(def, values, getValFunc, parentDom) {
		super(cDom("select", null, parentDom), undefined, getValFunc, null, parentDom);
		this.fillSelectDom(this.dom, values || []);
		this.value = def;
	}

	fillSelectDom(dom, values) {
		dom.innerHTML = "";
		dom.appendChild(cDom("OPTION"));
		for (var i=0; i < values.length; i++){
			var opt = cDom("OPTION");
			opt.innerHTML = values[i];
			opt.value = values[i];
			dom.appendChild(opt);
		}
	}
	
}

class TCheckbox extends TDomValue {
	constructor(def, checked, getValFunc, parentDom) { 
		if (!getValFunc) getValFunc = function(that){ return that.dom.checked ? that.dom.value : ""};
		//var l = cDom("LABEL", null, parentDom);
		super(cInp("checkbox", null, parentDom), def, getValFunc);
		this.dom.checked = checked || false;
		//var id = d2str(new Date())+def;
		//this.dom.id = "ch"+id;
		//l.setAttribute("for", "ch"+id);
		//l.innerHTML = def || "";
		
	}
	
	set checked(checked) {
		this.dom.checked = checked;
	}
	
	get checked() {
		return this.dom.checked;
	}
}

class TCheckboxes {
	constructor(chValues, values, getValFunc, parentDoms) {
		this.chbxs = [];
		this.vals = values;
		var parentDom = parentDoms && parentDoms.length ? parentDoms[0] : parentDoms ? parentDoms : undefined;
		for (var i=0; i < values.length; i++) {
			this.chbxs.push(new TCheckbox(values[i], false, null, parentDoms[i] || parentDom));
		}
		this.checked = chValues;
	}
	
	get checked() {
		var ret = [];
		for (var i=0; i < this.vals.length; i++) {
			if (this.chbxs[i].checked)
				ret.push(this.vals[i]);
		}
		return ret;
	}
	
	set checked(values) {
		for (var i=0; i < this.vals.length; i++) {
			var ind = values.indexOf(this.vals[i]);
			this.chbxs[i].checked = ind >=0;
		}
	}
	
	get values() {
		return this.vals;
	}
	
	set values(values) {
		this.vals = values;
	}
	
	get value() { 
		return this.getValFunc && typeof this.getValFunc == "function" ? this.getValFunc(this) : 
			this.getValFunc ? this.getValFunc : 
			this.values;
		
	}
	
	set value(values) {
		this.values = values;
	}
	
	get doms() { return this.chbxs; }
	
	set doms(doms) {
		for (var i=0; i < chbxs.length; i++) {
			this.chbxs[i].dom = doms[i];
		}
	}

	get dom() { return this.doms; }
	
	set dom(doms) {
		this.doms = doms;
	}
	
}

class TContainer {
	constructor(type, parentDom, value, values, getValFunc) {
		//if (value == undefined)  value = "";
		switch (type) {
			case "edit":
				this.cnt = new TEdit(value, getValFunc, parentDom);
			break;
			case "date":
				this.cnt = new TDate(value, getValFunc, parentDom);
			break;
			case "memo":
				this.cnt = new TMemo(value, getValFunc, parentDom);
				this.cnt.dom.style.width = "500px";
				this.cnt.dom.style.height = "50px";
			break;
			case "combo":
				this.cnt = new TCombo(value, values, getValFunc, parentDom);
			break;
			case "label":
				this.cnt = new TLabel(value, getValFunc, parentDom);
			break;
			case "checkbox":
				this.cnt = new TCheckbox(value, false, getValFunc, parentDom);
			break;
			case "checkboxes":
				this.cnt = new TCheckboxs(value, values, getValFunc, parentDom);
			break;
			case "hidden":
				this.cnt = new THidden(value, getValFunc, parentDom);
			break;
			default:
				this.cnt = new THidden(value, getValFunc, parentDom);
			break;
			
		}
		this.cnt.dom.style.width = !this.cnt.dom.style.width ? "100%" : this.cnt.dom.style.width;

	}
	
	get value() {
		return this.cnt.value;
	}
	
	set value(val) {
		return this.cnt.value = val;
	}
	
}

class TContainerFactory {
	constructor() {}
	
	create(type, parentDom, value, values, getValFunc) {
		return new TContainer(type, parentDom, value, values, getValFunc);
	}
	
}

class TField {
	constructor(cid, oid, container, parentField, def) {
		if (def == undefined)  def = "";
		var cf = new TContainerFactory();
		this.oid = oid;
		this.cid = cid;
		this.parentField = parentField;
		this.cnt = container && (container instanceof TContainer) ? container : cf.create("hidden", def);
		this.value = def;
	}
	
	get value() {
		var val;
		if (this.oid) val = objectlink.gOrm("gN", [this.oid]);
		if (val) this.value = val || "";
		return this.cnt.value;
	}
	
	set value(val) {
		this.cnt.value = val;
	}
	
	get pid() {
		if ( this.parentField && this.parentField instanceof TField ) return this.parentField.oid;
	}
	
	get parentField() {
		return this._parentField;
	}
	
	set parentField(parentField) {
		this._parentField = parentField;
	}
	
	save() {
		var obj;
		var val = this.value;
		if (this.cid) obj = objectlink.gOrm("gO", [val, null, null, this.cid]);
		
		if (obj) this.oid = obj
		else if (val != "" && val != undefined) {
			if (this.cid) this.oid = objectlink.gOrm("cO", [val, this.cid]);
		} else this.oid = undefined;
		
		if (this.oid && this.pid) objectlink.gOrm("cL", [this.oid, this.pid]);
	}
	
	
	
}

////["Заказы ПИР", "Заказы дата подписания", "Заказы дата закрытия"]
function createFieldsCard(fields, fieldsT, mainFieldValLinkedFieldNums, mainObjId, parentField, bSaveFunc) {
			var tb = cDom("TABLE");
			var fields_ = [];
			var cntf = new TContainerFactory();
			parentField = parentField instanceof TField ? parentField : new TField(null, parentField);
			var mainCnt;
			var cnts = [];

			var values = mainObjId ? objectlink.gOrm("gT2",[fields, [],[],false,decorateArr(fields,"`"),"and `id_"+fields[0]+"`="+mainObjId+
			" order by "+decorateArr(fields, "`d_", "` desc").join(",")+
			" limit 1", true]) : [];

			for (var i=0; i < fields.length; i++) {
				var tr = tb.appendChild(cDom("TR"));
				tb.appendChild(tr);
				var td = tr.appendChild(cDom("TD"));
				td.style.borderBottom = "1px solid #c4baa5";
				td.innerHTML = fields[i];
				var td = tr.appendChild(cDom("TD"));
				td.style.borderBottom = "1px solid #c4baa5";
				
				var val = values && values.length ? values[0][i] : undefined;
				var cnt;

				if (i == 0 && !val) {
					var valFunc = function(that){
						var ret = "";
						var lnk = that.linked;

						if (lnk && lnk.length) {
							for (var j=0; j < lnk.length; j++) {
								var field = that.fields[lnk[j]];
								var val = field ? field.value : lnk[j];
								ret = ret + val;
							}
						} else if (lnk) {
							ret = lnk + d2str(new Date());
						} else {
							ret = d2str(new Date());
						}
						return ret;
					}
					
					mainCnt = cntf.create(fieldsT[i], td, null, null, valFunc);
					cnt = mainCnt;
					
				} else {
					var vals;
					if (fieldsT[i] == "combo") {
						vals = objectlink.gOrm("gT2",[[fields[i]]]);
						var arr = [];
						for (var j=0; j < vals.length; j++) {
							arr.push(vals[j][1]);
						}
						vals = arr;
					}
					cnt = cntf.create(fieldsT[i], td, val, vals);
					if (i == 0) mainCnt = cnt;

				}
				var field = new TField(classes[fields[i]], null, cnt, i == 0 ? parentField : fields_[0], val);
				fields_.push(field);
				cnts.push(cnt);
			}
			mainCnt.cnt.fields = cnts;
			mainCnt.cnt.linked = mainFieldValLinkedFieldNums;
			
			var tr = tb.appendChild(cDom("TR"));
			var td = tr.appendChild(cDom("TD"));
			var td = tr.appendChild(cDom("TD"));

			tb.fields = fields_;
			tb.mainField = fields_[0];
			tb.funcSave = function(){
				for (var i=0; i < fields.length; i++) {
					this.fields[i].save();
				}
			};
			
			if (bSaveFunc) {
				var but = td.appendChild(cDom("BUTTON"));
				but.innerHTML = "Сохранить";
				but.onclick = function(){
					tb.funcSave();
					if (typeof bSaveFunc == "function") bSaveFunc();
				};
			}
			
			return tb;
	
}










