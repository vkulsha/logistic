"use strict";

function ObjFilter(params) {
	var that = this;

	var jsTable = params && params.jsTable instanceof ObjTable ? params.jsTable : new ObjTable();
	this.jsTable = new GetSet("jsTable", null, function(){//ref
		if (!jsTable) return undefined;
		return jsTable
	});

	this.columns = new GetSet("columns", null, function(){//ref
		var jsTable = that.jsTable.get();
		if (!jsTable) return undefined;
		return that.jsTable.get().columns.get() 
	});
	this.columns.listen([this.jsTable.get().columns]);//listen

	this.queryAll = new GetSet("queryAll", null, function(){//ref
		var jsTable = that.jsTable.get();
		if (!jsTable) return undefined;
		return that.jsTable.get().queryAll.get();
	});
	this.queryAll.listen([this.jsTable.get().queryAll]);//listen

	this.userFilter = new GetSet("userFilter", params && params.userFilter ? params.userFilter : "");

	this.createColumnsFilter = new GetSet("fillColumnsFilter", null, function(){//call once
		var result = [];
		var columns = that.columns.get();
		if (!columns) return result;

		for (var i=0; i < columns.length; i++) {
			var filters = {"userFilter":"", "columnFilter":new ColumnFilter([]), "filter" : ""};
			result.push(filters);
		}
		return result;
		
	});
	this.createColumnsFilter.listen([this.jsTable.get().columns]);//listen
	this.columnsFilter = new GetSet("columnsFilter", null, function(){//this.createColumnsFilter.get(false)
		return that.createColumnsFilter.get(false);
	});

	this.currentColumn = new GetSet("currentColumn", null, function(){
		var jsTable = that.jsTable.get();
		if (!jsTable) return undefined;
		return jsTable.currentColumn.get();
		
	});
	this.currentColumn.listen([this.jsTable.get().currentColumn]);

	this.jsDistinctValuesOfCurrentColumn = new GetSet("jsDistinctValuesOfCurrentColumn", null, function(){
	/*	var result = [];
		var column = that.currentColumn.get();
		var queryAll = that.queryAll.get();
		if (!queryAll || !column) return result;

		var q = "select distinct `"+column.name+"` from ("+queryAll.split("order")[0]+" )xxx order by `"+column.name+"`";
		var values = getOrmObject(objectlink.gOrm("sql", ["(select distinct `"+column.name+"` from ("+queryAll.split("order")[0]+" )xxx order by `"+column.name+"`)x"]), "col2array");
		if (values && values.length) {
			result = values;
		}
		return result;
	*/	
		return [];
	});
	this.columnValues = new GetSet("columnValues", null, function(){//jsDistinctValuesOfCurrentColumn.get(false);
		return that.jsDistinctValuesOfCurrentColumn.get(false);
	});
	this.jsDistinctValuesOfCurrentColumn.listen([this.currentColumn]);
	
	this.updateCurrentColumnFilter = new GetSet("updateCurrentColumnFilter", null, function(){
		var result = [];
		var jsValues = that.jsDistinctValuesOfCurrentColumn.get(false);
		var column = that.currentColumn.get();
		var columnsFilter = that.columnsFilter.get();
		if (!jsValues || !column || !columnsFilter) return result;

		var arr = [];
		for (var i=0; i < jsValues.length; i++) {
			arr.push(new CheckedValue({"value":jsValues[i], "checked":false}));
		}
		columnsFilter[column.id].columnFilter = new ColumnFilter({"checkedValues" : arr});
		
		return result;
		
	});
	this.updateCurrentColumnFilter.listen([this.currentColumn]);

	this.isDomPanelFilterVisible = new GetSet("isDomPanelFilterVisible", false);
	this.domPanelFilterPosition = new GetSet("domPanelFilterPosition", {x:0, y:0});
	
	this.showDomPanelFilter = new GetSet("showDomPanelFilter", null, function(){
		if (!that.domPanelFilterContainer) return;
		var pFilter = that.domPanelFilterContainer.get();
		var pos = that.domPanelFilterPosition.get();
		var isVisible = that.isDomPanelFilterVisible.get() ? "block" : "none";
		var column = that.currentColumn.get();
		pFilter.style.left = pos.x+"px";
		pFilter.style.top = pos.y+"px";
		pFilter.style.display = isVisible;
		pFilter.style.width = column.width+40+"px";
	})
	this.showDomPanelFilter.listen([this.isDomPanelFilterVisible]);
	
	this.domPanelFilterContainerCreate = new GetSet("domPanelFilterContainerCreate", null, function(){
		var result = document.createElement("DIV");
		result.setAttribute("id", "pFilter");
		result.classList.add("highlight");
		return result;
		
	});
	
	this.domPanelFilterContainer = new GetSet("domPanelFilterContainer", null, function(){//domPanelFilterContainerCreate(false)
		return that.domPanelFilterContainerCreate.get(false);
		
	});
	
	this.domPanelFilter = new GetSet("domPanelFilter", null, function(){
		var pFilter = that.domPanelFilterContainer.get();//document.createElement("DIV");
		var column = that.currentColumn.get();
		var columnsFilter = that.columnsFilter.get();
		if ( !pFilter || !column || !columnsFilter ) return pFilter;

		pFilter.innerHTML = "";
		var checkedValues = columnsFilter[column.id].columnFilter.checkedValues;
		var pSelectAll = document.createElement("DIV");
		var pSelect = document.createElement("DIV");
		var pButtons = document.createElement("DIV");
		var lAll = document.createElement("LABEL");
		var chAll = document.createElement("INPUT");
		var bOk = document.createElement("BUTTON");
		var bNo = document.createElement("BUTTON");
		var chValues = [];

		pFilter.style.cssText = "resize:both; border: 1px solid #ccc; position:absolute; zIndex:1000; left:0; top: 0; height:300;";
		pFilter.classList.add("highlight");
		pSelectAll.innerHTML = "<table class='highlight' style='width:100%'><tr><td><div></div></td></tr></table>";
		pSelect.style.cssText = "height:100%; width:100%; overflow:auto";
		pSelect.classList.add("highlight");

		var table = document.createElement('TABLE');
		table.classList.add("highlight");
		for (var i=0; i < checkedValues.length; i++) {
			var row = checkedValues[i].value;
			var tr = table.appendChild(document.createElement('TR'));
			var td = tr.appendChild(document.createElement('TD'));

			var div = td.appendChild(document.createElement('DIV'));
			div.setAttribute("title", row);
			div.style.cssText = "overflow:hidden; height:20px; display:block";
			
			var ch = div.appendChild(document.createElement('INPUT'));
			ch.onchange = function(){
				if (!this.checked) chAll.checked = false;
			}
			ch.setAttribute("type", "checkbox");
			ch.setAttribute("id", "ch"+i);
			ch.checked = true;
			chValues.push(ch);

			var l = div.appendChild(document.createElement('LABEL'));
			l.setAttribute("for", "ch"+i);
			l.innerHTML = row;
		}
		pSelect.innerHTML = "";
		pSelect.appendChild(table);
				
		chAll.setAttribute("type", "checkbox");
		chAll.setAttribute("checked", "true");
		chAll.setAttribute("id", "chAll");
		lAll.innerHTML = "(Все)";
		lAll.setAttribute("for", "chAll");
		pSelectAll.getElementsByTagName("DIV")[0].appendChild(chAll);
		pSelectAll.getElementsByTagName("DIV")[0].appendChild(lAll);
		
		bOk.innerHTML = "+";
		bOk.setAttribute("title", "Применить фильтр");
		bNo.innerHTML = "X";
		bNo.setAttribute("title", "Закрыть панель");
		
		chAll.onchange = function(){
			var arr = chValues;
			for (var i=0; i < arr.length; i++) {
				arr[i].checked = this.checked;
			}
			
		}

		bOk.onclick = function(){
			var arr = chValues;
			var filter = "";
			var isnull = "";
			for (var i=0; i < arr.length; i++) {
				if (arr[i].checked) {
					filter = filter + "'"+checkedValues[i].value+"',";
					if (checkedValues[i].value == "") {
						isnull = " or `"+column.name+"` is null ";

					}
				}
			}
			filter = slice(filter);
			
			if (filter) {
				filter = " and (`"+column.name+"` in ("+filter+") "+isnull+")";
			}
			that.isDomPanelFilterVisible.set(false);
			that.panelFilterResult.set(filter);
		}
		bNo.onclick = function(){
			that.isDomPanelFilterVisible.set(false);
			that.panelFilterResult.set("");
		}
		
		pButtons.appendChild(bOk);
		pButtons.appendChild(bNo);
		
		pFilter.appendChild(pSelectAll);
		pFilter.appendChild(pSelect);
		pFilter.appendChild(pButtons);

		that.showDomPanelFilter.get();
		return pFilter;
	});
	this.domPanelFilter.listen([this.currentColumn]);
	
	this.panelFilterResult = new GetSet("panelFilterResult", "");
	
	this.columnsFilterSetPanelFilterResult = new GetSet("columnsFilterSetPanelFilterResult", null, function(){
		var column = that.currentColumn.get();
		var columnsFilter = that.columnsFilter.get();
		var filter = that.panelFilterResult.get();
		if ( !column || !columnsFilter ) return;
		
		columnsFilter[column.id].filter = filter;
	})
	this.columnsFilterSetPanelFilterResult.listen([this.panelFilterResult]);
	
	this.columnsFilterAll = new GetSet("columnsFilterAll", null, function(){
		var result = "";
		var column = that.currentColumn.get();
		var columnsFilter = that.columnsFilter.get();
		if ( !column || !columnsFilter ) return result;
		
		var arr = [];
		for (var i=0; i < columnsFilter.length; i++) {
			arr.push(columnsFilter[i].filter);
			arr.push(columnsFilter[i].userFilter);
		}
		arr.push(that.userFilter.get());
		result = arr.join("");
		return result;
		
	});
	this.columnsFilterAll.listen([this.panelFilterResult, this.userFilter]);

	this.clearFilters = new GetSet("clearFilters", null, function(){
		var result = "";
		var column = that.currentColumn.get();
		var columnsFilter = that.columnsFilter.get();
		if ( !column || !columnsFilter ) return;
		
		for (var i=0; i < columnsFilter.length; i++) {
			columnsFilter[i].filter = "";
			columnsFilter[i].userFilter = "";
		}
		that.userFilter.set("");
		that.panelFilterResult.set("");
	});
	
}

function ColumnFilter(params){
	var checkedValues = [];
	if (params && params.checkedValues && params.checkedValues.length) {
		checkedValues = params.checkedValues;
		for (var i=0; i < checkedValues.length; i++) {
			if (!(checkedValues[i] instanceof CheckedValue)) {
				checkedValues = [];
				break;
			}
		}
	}

	this.checkedValues = checkedValues;
}

function CheckedValue(params) {
	this.value = params && params.value ? String(params.value) : "";
	this.checked = params && params.checked ? Boolean(params.checked) : false;
	
}

