"use strict";

var objectlink = {
	gOrm : function(funcName, params){
		return sqlOrm({f:funcName, p:params})	
		
	},
	gOrmA : function(funcName, params, func){
		sqlOrmA({f:funcName, p:params}, func)	
		
	},
}














