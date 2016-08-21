"use strict";

function GetSet (name, val, func) {
	var sendList = [];

	this.get = function(refresh) {//call inner function and get val
		refresh = refresh == undefined ? true : refresh;
		if (refresh) {
			this.call();
		}
		return val;
	}
	
	this.toString = function() {
		var v = this.get();
		return v instanceof Object ? JSON.stringify(this.get()) : v;
	}
	
	this.call = function(){//call inner function and set val from return of inner function
		if ((typeof func) == "function") {
			var result = func();
			if (result) {
				this.set(result);
			}
		}
	}
	
	this.push = function(obj) {//add obj to sendList for add method
		if (obj instanceof GetSet) {
			sendList.push(obj);
		}
	}
	
	this.add = function(obj) {//add obj to sendList
		if (obj) {
			var o = (obj.length || obj.length == 0) ? obj : [obj];
			if (o.length == 0) {
				sendList = [];
			}
			for (var i=0; i < o.length; i++) {
				this.push(o[i]);
			}
		}
	}
	
	this.listen = function(obj) {//subscription to listen events from obj (add this to obj sendList)
		if (obj) {
			var o = (!obj.length) ? [obj] : obj;
			for (var i=0; i < o.length; i++) {
				o[i].add(this);
			}
		}
	}

	this.unlisten = function() {//subscription to listen events from obj (add this to obj sendList)
		for (var i=0; i < sendList.length; i++) {
			sendList[i].add([]);
		}
	}
	
	this.set = function(val_, send, sendAnyWay) {//set val
		send = send == undefined ? true : send;
		var isNull = val == null;
		var notNull = val != null && val_ != null;
		
/*		var str = 
			" isNull " + isNull + 
			"\n notNull " + notNull + 
			"\n isObject " + isObject + 
			"\n isHTML " + isHTML + 
			"\n isSet1 " + isSet1 + 
			"\n isSet2 " + isSet2 + 
			"\n isSet3 " + isSet3 + 
			"\n Date " + new Date().getSeconds();
		if (this.name == "isDomPanelFilterVisible") { console.log("this.val = "+this.val+", val = " + val + "\n" + str);	}
*/		
		if ( isNull || val != val_ || sendAnyWay) {
//			if (this.name == "isDomPanelFilterVisible") { console.log(" set true (isNull || isSet1 || isSet2 || isSet3) ");	}
			val = val_;	
			if (send) {
				this.send();
			};
		} else {
//			if (this.name == "isDomPanelFilterVisible") { console.log(" set false (isNull || isSet1 || isSet2 || isSet3) "); }
		}
	}
	
	this.send = function() {//send event from sendList
		for (var i=0; i < sendList.length; i++) {
			if (sendList[i] && (sendList[i] instanceof GetSet)) {
				sendList[i].call();
			}
		}
	}

	this.call();

}
