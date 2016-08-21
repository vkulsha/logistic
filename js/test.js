"use strict";
var classes_ = objectlink.gOrm("gT2",[["Класс"],[],[0],false,["Класс","id_Класс"]]);
var classes = hash4arr(classes_);


QUnit.test( "essp test", function( a ) {
	a.ok( true == true, "true" );
	
	a.ok( new TDomValue(cInp("edit"), "123").value == "123", "TDomValue 1" );
	a.ok( new TDomValue(cInp("date"), "2016-10-10", function(that){return "["+that._dom.value+"]"}).value == "[2016-10-10]", "TDomValue 2" );

	a.ok( new TEdit("123").value == "123", "TEdit" );
	a.ok( new TDate("2016-10-10").value == "2016-10-10", "TDate" );
	a.ok( new TMemo("123").value == "123", "TMemo" );
	a.ok( new TCombo("2", [[1,1],[2,2]]).value == "2", "TCombo 1" );
	a.ok( new TCombo("2", [[1,1],[2,2]]).dom.type == "select-one", "TCombo 2" );
	a.ok( new TCombo("2", [[1,1],[2,2]]).dom.getElementsByTagName("option").length == 3, "TCombo 3" );
	
	var cntf = new TContainerFactory();
	a.ok( cntf.create("combo", null, "2", [[1,1],[2,2]]).value == "2", "ContainerFactory combo" );
	
	
});




