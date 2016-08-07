"use strict";
//listen : add to object listener
//val : create value property
//obj : create object property
//ref : reference to the object property
//fill : fill object property
//set : fill value property
//call : call procedure once time
//proc : procedure - function without return value

function JsTable (queryJson, opts, container) {
		var that = this;//ref
		this.filter = new GetSet("filter", null);//val
		this.tableWidth = new GetSet("tableWidth", opts && opts.tableWidth ? opts.tableWidth : 1200, ai1, ai2);//val
		this.tableHeight = new GetSet("tableHeight", opts && opts.tableHeight ? opts.tableHeight : 400);//val
		this.colsOpts = new GetSet("colsOpts", opts && opts.columns ? opts.columns : undefined);//ref
		this.rowsColorOpts = new GetSet("rowsColorOpts", opts && opts.rowsColor ? opts.rowsColor : undefined);//ref
		
		this.selectedCell = new GetSet("selecterCell", undefined);//val
		this.cellClickFunc = new GetSet("cellClickFunc", opts && opts.cellClickFunc ? opts.cellClickFunc : undefined);//ref
		this.cellDblClickFunc = new GetSet("cellDblClickFunc", opts && opts.cellDblClickFunc ? opts.cellDblClickFunc : undefined);//ref
		this.cols2Button = new GetSet("cols2Button", opts && opts.cols2Button ? opts.cols2Button : []);//ref
		this.cols2ButtonClick = new GetSet("cols2ButtonClick", opts && opts.cols2ButtonClick ? opts.cols2ButtonClick : undefined);//ref
		this.refreshTableMarker = new GetSet("refreshTableMarker", undefined);//val
		this.refreshTable = new GetSet("refreshTable", null, function(){//obj
			that.refreshTableMarker.set(""+(new Date()));
		});

		this.container = container;//ref
		this.mainContainer = new GetSet("mainContainer", null, function(){//ref
			var container = that.container;
			var result = null;
			if (!container) {
				result = document.createElement("DIV");
				document.body.appendChild(result);
				
			} else {
				result = container;
			}
			return result;
			
		});
///query
		if (queryJson && !queryJson['select']) queryJson = {select: queryJson};
		queryJson.select = queryJson.select || "";
		queryJson.where = queryJson.where || "";
		queryJson.order = queryJson.order || "";
		queryJson.limit = queryJson.limit || "";
		
		this.querySelect = new GetSet("querySelect", queryJson ? queryJson.select : undefined);//val
		this.queryWhere = new GetSet("queryWhere", queryJson ? queryJson.where : undefined);//val
		this.queryOrder = new GetSet("queryOrder", queryJson ? queryJson.order : undefined);//val
		this.queryLimit = new GetSet("queryLimit", queryJson ? queryJson.limit : undefined);//val

		this.queryAll = new GetSet("queryAll", null, function(){//ref
			var result = 
				that.querySelect.get() + 
				that.queryWhere.get() + 
				that.queryOrder.get() + 
				that.queryLimit.get();

			return result;
		});
		this.queryAll.listen([this.querySelect, this.queryWhere, this.queryOrder, this.queryLimit]);//listen
//ColorFromConditions

		this.valuesForCondition = new GetSet("valuesForCondition", {column:undefined, value:undefined});
		this.colorFromCondition = function(){
			var opts = that.rowsColorOpts.get();
			var curr = that.valuesForCondition.get();
			if (!opts || !curr) return "";

			var accSucc = function(conds, col, val){
				var result = false;
				var succ = false;

				for (var i=0; i < conds.length; i++){
					var cond = conds[i];
					var field = cond.field.toLowerCase();
					
					if (col.toLowerCase() == field) {
						succ = cmpOperator(cond.compareType, val, cond.value);
					} else {
						succ = false;
					}
					
					if (cond.condType == "and") {
						if (i==0) {
							result = true;
						}
						result = result && succ;
					} else {
						result = result || succ;
					}

				}
				return result;
			}
			
			var color = "";
			for (var i=0; i < opts.length; i++){
				var opt = opts[i];
				var succ = accSucc(opt.conditions, curr.column, curr.value);
				if (succ) {
					color = opt.color;
					//return color;
				}
			}
			return color;
		};
		//this.colorFromCondition.listen([this.valuesForCondition]);

//jsHead		
		this.jsHead = new GetSet("jsHead", null, function(){//obj
			var columns;
			var result = [];
			var colsOpts = that.colsOpts.get();
			if (!that.queryAll.get()) return result;
			
			if (colsOpts) {
				result = colsOpts;
			} else {
				columns = objectlink.gOrm("sql", ["("+that.querySelect.get() + that.queryWhere.get() + that.queryOrder.get() + " limit 0)x"]).columns;
				if (columns) {
					for (var i=0; i < columns.length; i++) {
						result.push(new Column({
								"id" : i, 
								"name" : columns[i], 
								"caption" : columns[i],
								"width" : 100, 
								"height" : "100%", 
								"visible" : true,
								"class" : ""
						}));
					}
				}
			};
			return result;
		});
		this.jsHead.listen([this.querySelect]);//listen
		this.columns = new GetSet("columns", null, function(){//ref
			return that.jsHead.get(false)
		});
		this.columns.listen([this.jsHead]);//listen
		this.columnsRefresh = new GetSet("columnsRefresh", null, function(){//val
			return JSON.stringify(that.columns.get())
		});
		this.columnsRefresh.listen([this.jsHead]);//listen
		this.columnsVisibleRefresh = new GetSet("columnsVisibleRefresh", null, function(){
			var columns = that.columns.get();
			if (!columns) return;
			
			for (var i=0; i < columns.length; i++){
				if (columns[i].objects.length) {
					for (var j=0; j < columns[i].objects.length; j++){
						columns[i].objects[j].hidden = !columns[i].visible;
					}
				}
			}
		})
		this.columnsVisibleRefresh.listen([this.columnsRefresh]);
//jsBody
		this.jsBody = new GetSet("jsBody", null, function(){//obj
			var result = [];
			if (!that.queryAll.get()) return result;
			/*getQueryJson(that.queryAll.get(), function(json){
				result = JSON.parse(json).data;
			}, false);*/
			//console.log(that.queryAll.get());
			result = objectlink.gOrm("sql",["("+that.queryAll.get()+")x"]).data;
			
			return result;
			
		});
		this.jsBody.listen([this.queryAll, this.refreshTableMarker]);//listen
		this.rows = new GetSet("rows", null, function(){//ref
			return that.jsBody.get(false)
		});
///domHead		
		this.domHeadOrdersCreate = new GetSet("domHeadOrdersCreate", null, function(){//obj
			var result = [];
			var columns = that.columns.get();
			if (!columns) return result;

			for (var i=0; i < columns.length; i++) {
				var dom = document.createElement("IMG");
				dom.style.width = '12px';
				dom.style.height = 'auto';
				dom.style.cursor = 'pointer';
				dom.hidden = true;
				result.push(dom);
			}

			return result;
			
		})
		this.domHeadOrdersCreate.listen([this.jsHead, this.columnsRefresh]);//listen
		this.domHeadOrders = new GetSet("domHeadOrders", null, function(){//ref
			return that.domHeadOrdersCreate.get(false);
			
		})
		
		this.domHeadFiltersCreate = new GetSet("domHeadFiltersCreate", null, function(){//obj
			var result = [];
			var columns = that.columns.get();
			if (!columns) return result;

			var imFilter = new Image();
			imFilter.src = domain+"images/filter.png";
			for (var i=0; i < columns.length; i++) {
				var dom = document.createElement("IMG");
				dom.src = imFilter.src;
				dom.style.width = '12px';
				dom.style.height = 'auto';
				dom.style.cursor = 'pointer';
				dom.ind = i;
				
				dom.onclick = function(e){
					var columns = that.columns.get();
					var pos = {x : e.clientX, y : e.clientY};
					that.filter.get().domPanelFilterPosition.set(pos);
					that.currentColumn.set(columns[this.ind]);
					that.filter.get().isDomPanelFilterVisible.set(true);
				}
				
				result.push(dom);
			}

			return result;
			
		})
		this.domHeadFiltersCreate.listen([this.jsHead, this.columnsRefresh]);//listen
		this.domHeadFilters = new GetSet("domHeadFilters", null, function(){//ref
			return that.domHeadFiltersCreate.get(false);
			
		})

		this.domHeadCaptionsCreate = new GetSet("domHeadCaptionsCreate", null, function(){//obj
			var result = [];
			var columns = that.columns.get();
			if (!columns) return result;

			for (var i=0; i < columns.length; i++) {
				var dom = document.createElement("LABEL");
				dom.ind = i;
				dom.innerHTML = columns[i]["caption"];
				dom.style.cursor = 'pointer';
				dom.style.marginLeft = '5px';
				dom.style.marginRight = '5px';
				
				dom.onclick = function(){
					var columns = that.columns.get();
					that.orderColumnOld.set(that.orderColumn.get());
					if (columns[this.ind] == that.orderColumn.get()) {
						that.inverseOrderDirection.get();
					} else {
						that.orderDirection.set("");
					}
					that.orderColumn.set(columns[this.ind]);
				}
				
				result.push(dom);
			}

			return result;
			
		})
		this.domHeadCaptionsCreate.listen([this.jsHead, this.columnsRefresh]);//listen
		this.domHeadCaptions = new GetSet("domHeadCaptions", null, function(){//ref
			return that.domHeadCaptionsCreate.get(false);
			
		})
		
		this.domHeadContainerCreate = new GetSet("domHeadContainerCreate", null, function(){//obj
			var result = document.createElement("THEAD");
			return result;
			
		});
		this.domHeadContainer = new GetSet("domHeadContainer", null, function(){//ref
			return that.domHeadContainerCreate.get(false);
			
		});
		this.domHead = new GetSet("domHead", null, function(){//fill
			var result = that.domHeadContainer.get();
			var columns = that.columns.get();
			var domHeadOrders = that.domHeadOrders.get();
			var domHeadFilters = that.domHeadFilters.get();
			var domHeadCaptions = that.domHeadCaptions.get();
			var tableWidth = that.tableWidth.get();
			if (!columns || !result || !domHeadOrders || !domHeadFilters || !domHeadCaptions || !tableWidth) return result;
			
			result.innerHTML = "";
			var tr = document.createElement("TR");
			
			for (var i=0; i < columns.length; i++) {
				var field = document.createElement("TH");
				var div = document.createElement("DIV");
				var label = domHeadCaptions[i];
				var imgFilter = domHeadFilters[i];
				var imgOrder = domHeadOrders[i];
				field.ind = i;
				div.ind = i;
				
				field.style.overflow = "hidden";
				field.style.width = columns[i].width;
				field.style.height = columns[i].height;
				field.hidden = !columns[i].visible;

				div.style.cssText = field.style.cssText;
				div.appendChild(imgOrder);
				div.appendChild(label);
				div.appendChild(imgFilter);
				field.appendChild(div);
				tr.appendChild(field);

				columns[i].objects.push(field);
				
///columnResize
				var divDop = document.createElement("DIV");
				divDop.classList.add("other");
				divDop.style.display = "table-cell";
				divDop.style.width = "100%";
				var divResizeCnt = document.createElement("DIV");
				divResizeCnt.classList.add("other");
				divResizeCnt.style.display = "table";
				divResizeCnt.style.width = "100%";
				var divResize = document.createElement("DIV");
				divResize.classList.add("other");
				divResize.style.cursor = "col-resize";
				divResize.style.display = "table-cell";
				divResize.style.textAlign = "right";
				divResize.style.color = "#c4baa5";
				divResize.style.fontSize = "8px";
				divResize.innerHTML = "||";//"&nbsp";
				divResizeCnt.appendChild(divDop);
				divResizeCnt.appendChild(divResize);
				field.appendChild(divResizeCnt);

				divResize.onmousedown = function(){
					var columns = that.columns.get();
					var column = that.resizeColumn;
					if (column) {
						column.set(columns[this.parentNode.parentNode.ind]);
					}
				}
			}

			tr.onmouseup = function(){
				var column = that.resizeColumn;
				if (column) {
					column.set(undefined);
				}
			}
			tr.onmousemove = function(e){
				var resizeColumn = that.resizeColumn;
				if (resizeColumn) {
					var column = resizeColumn.get();
					var columnWidth = that.resizeColumnWidth;
					if (column && columnWidth) {
						var field = column.objects[0];
						var left = getColumnLeft(columns, column.id)+150;//field.getBoundingClientRect().left;
						columnWidth.set(e.pageX - left, true, true);
					}
				}
			}
///
			tr.style.display = "block";
			tr.style.overflow = "hidden";
			tr.style.borderBottom = "2px solid #c4baa5";
			tr.style.width = tableWidth-17;
			result.appendChild(tr);
			
			return result;
			
		})
		this.domHead.listen([this.jsHead, this.columnsRefresh]);//listen
		
///domFoot
		this.domFootContainerCreate = new GetSet("domFootContainerCreate", null, function(){//obj
			var result = document.createElement("TFOOT");
			return result;
			
		});
		this.domFootContainer = new GetSet("domFootContainer", null, function(){//ref
			return that.domFootContainerCreate.get(false);
			
		});
		this.domFoot = new GetSet("domFoot", null, function(){
			var cnt = that.domFootContainer.get();
			var rows = that.rows.get();
			if (!cnt || !rows) return result;
			
			cnt.innerHTML = "строк: "+rows.length;
			
		});
		this.domFoot.listen([this.jsBody]);
		
///domBody				
		this.domBodyContainerCreate = new GetSet("domBodyContainerCreate", null, function(){//obj
			var result = document.createElement("TBODY");
			//var domHead = that.domHeadContainer.get();
			var tableWidth = that.tableWidth.get();
			var tableHeight = that.tableHeight.get();
			if (!tableWidth || !tableHeight) return result;

			result.style.display = "block";
			result.style.overflow = "auto";
			result.style.height = tableHeight;
			result.style.width = tableWidth;

			//var headTr = domHead.getElementsByTagName("TR")[0];
			result.onscroll = function() {
				var headTr = that.domHeadContainer.get().getElementsByTagName("TR")[0];
				headTr.scrollLeft = this.scrollLeft;
			};
			return result;
			
		});
		this.domBodyContainer = new GetSet("domBodyContainer", null, function(){//ref
			return that.domBodyContainerCreate.get(false);
			
		});
		this.domBody = new GetSet("domBody", null, function(){//fill
			var result = that.domBodyContainer.get();
			var rows = that.rows.get();
			var columns = that.columns.get();
			var rowsColOpt = that.rowsColorOpts.get();
			var isColorOpt = (JSON.stringify(rowsColOpt) != "{}");
			var cols2Button = that.cols2Button.get();

			if (!columns || !rows || !result) return result;
///cell click			
			var cellDblClick = function(){
				var cellDblClickFunc = that.cellDblClickFunc.get();
				if (cellDblClickFunc) cellDblClickFunc();
				//bCard(this.id);//this.row, this.col, this.id
			}
			
			var cellClick = function(e){
				var cellClickFunc = that.cellClickFunc.get();
				if (cellClickFunc) cellClickFunc();
			}
			
			var cellOnFocus = function(e){
				//this.classList.add("jsTableSelectedCell");
				if (isColorOpt) return;
				that.selectedCell.set(this);
				this.style.backgroundColor = rgb(255, 228, 138);
				$(this.domRow).find("td").each(function(){
					//this.classList.add("jsTableSelectedRow");
					this.style.backgroundColor = rgb(255, 247, 217)

				});
				//this.removeAttribute("readonly");

			}
			
			var cellOnBlur = function(e){
				color = "inherit"
				if (isColorOpt) return;
				this.style.backgroundColor = color;
				//this.classList.remove("jsTableSelectedCell");
				$(this.domRow).find("td").each(function(){
					//this.classList.remove("jsTableSelectedRow");
					this.style.backgroundColor = color
				});
				this.setAttribute("readonly", true);
			}
			
			var cellOnPaste = function(e){
			}
///			
			result.innerHTML = "";
			for (var i=0; i < rows.length; i++) {
				var row = document.createElement("TR");
				var color = "";
				for (var j=0; j < columns.length; j++) {
					var cell = document.createElement("TD");
					var div = document.createElement("DIV");
					var inp = document.createElement("TEXTAREA");//
					var isBut = cols2Button.indexOf(j) >= 0;//
					var but = isBut ? document.createElement("BUTTON") : undefined;//
					
					cell.style.overflow = "hidden";
					cell.style.width = columns[j]["width"];
					cell.style.height = columns[j]["height"];
					cell.hidden = !columns[j]["visible"];
					
					cell.col = j;
					cell.row = i;
					cell.id = rows[i][0];
					cell.ondblclick = cellDblClick;
					cell.onclick = cellClick;
					div.style.cssText = cell.style.cssText;
					
					inp.onfocus = cellOnFocus;
					inp.onblur = cellOnBlur;
					inp.onpaste = cellOnPaste;
					inp.style.cursor = "pointer";

					var obj = {"column":columns[j].name, "value":rows[i][j]};
					that.valuesForCondition.set(obj);
					var c = isColorOpt ? that.colorFromCondition() : false;
					color = c ? c : color;

					columns[j].objects.push(cell);
					
					inp.style.width = "100%";//
					inp.style.height = "100%";//
					inp.col = j;
					inp.row = i;
					inp.domRow = row;
					inp.innerHTML = rows[i][j];
					inp.style.backgroundColor = "transparent";
					inp.setAttribute("readonly", true);
					inp.style.resize = "none";
					inp.style.border = "1px solid transparent"
					inp.style.fontFamily = "inherit";
					inp.style.fontSize = columns[j].fontSize;

					//div.innerHTML = rows[i][j];
					div.appendChild(inp);//
					if (isBut)	{
						but.innerHTML = inp.innerHTML || "+";
						but.col = j;
						but.row = i;
						but.onclick = function(){that.cols2ButtonClick.get()(this)};
					}
					cell.appendChild(but || div);
					row.appendChild(cell);
				}
				if (color) {
					$(row).find("TD").each(function(){this.style.backgroundColor = color});
				};
				result.appendChild(row);
			}
			return result;
		});
		this.domBody.listen([this.jsBody, this.columnsRefresh]);//listen
///domTable
		this.domTableContainerCreate = new GetSet("domTableContainerCreate", null, function(){//obj
			var result = document.createElement("TABLE");
			var tableWidth = that.tableWidth.get();
			if (!tableWidth) return result;
			/*
			result.onclick = function(){
				if (that.hideAllPanels) {
					that.hideAllPanels.get();
				}
			}
			*/
			result.classList.add("jsTable");
			result.setAttribute("cellpadding","0")
			result.setAttribute("cellspacing","0");
			result.style.width = tableWidth;
			result.style.border = "1px solid #c4baa5";
			return result;
			
		});
		this.domTableContainer = new GetSet("domTableContainer", null, function(){//ref
			return that.domTableContainerCreate.get(false);
			
		});
		this.domTable = new GetSet("domTable", null, function(){//fill
			var result = that.domTableContainer.get();
			var domHead = that.domHeadContainer.get();
			var domBody = that.domBodyContainer.get();
			var domFoot = that.domFootContainer.get();
			if (!domHead || !domBody || !domFoot || !result) return result;

			result.innerHTML = "";
			result.appendChild(domHead);
			result.appendChild(domBody);
			result.appendChild(domFoot);

			return result;
		});
		
		this.createTable = new GetSet("updateTable", null, function(){//call
			var mainContainer = that.mainContainer.get();
			var domTable = that.domTable.get();
			
			if (!mainContainer || !domTable) return;
			mainContainer.innerHTML = "";
			mainContainer.appendChild(that.domTable.get());

		});
		
///filter
		this.currentColumn = new GetSet("currentColumn", that.columns.get()[0]);//val
		this.filter.set(new Filter({"jsTable":that}));//set
		
		this.createFilter = new GetSet("createFilter", null, function(){//call
			var filter = that.filter.get();
			if (!filter) return;

			var domPanelFilter = filter.domPanelFilterContainer.get();
			if (!domPanelFilter) return;
			
			var mainContainer = that.mainContainer.get();
			if (!mainContainer) return;
			mainContainer.appendChild(domPanelFilter);
			
		});
		
		this.columnsFilterAccept = new GetSet("columnsFilterGet", null, function(){//proc
			var filter = that.filter.get();
			if (!filter) return;

			var column = that.currentColumn.get();
			var columnsFilterAll = filter.columnsFilterAll.get();
			//var userFilter = filter.userFilter.get();
			var domHeadFilters = that.domHeadFilters.get();
			if ( !column || !columnsFilterAll || !that.queryWhere) return;
			domHeadFilters[column.id].src = domain+"images/filter_del.png"
			that.queryWhere.set(columnsFilterAll/* + userFilter*/);

		});
		this.columnsFilterAccept.listen([this.filter.get().columnsFilterAll]);//listen
///order		
		this.orderColumn = new GetSet("orderColumn", undefined);//val
		this.orderColumnOld = new GetSet("orderColumn", undefined);//val
		this.orderDirection = new GetSet("orderDirection", "");//val
		this.inverseOrderDirection = new GetSet("inverseOrderDirection", null, function(){//proc
			if (!that.orderDirection) return;
			that.orderDirection.set(that.orderDirection.get() ? "" : "desc");
			
		});
		this.orderAccept = new GetSet("", null, function(){//proc
			var column = that.orderColumn.get();
			var columnOld = that.orderColumnOld.get();
			var direction = that.orderDirection.get();
			var domHeadOrders = that.domHeadOrders.get();
			if (!column || !that.orderDirection || !that.queryOrder) return;
			
			var src = (direction == "desc") ? domain+"images/sort_up.png" : domain+"images/sort_down.png";
			if (columnOld && column != columnOld) {
				domHeadOrders[columnOld.id].hidden = true;
			}
			
			domHeadOrders[column.id].src = src;
			domHeadOrders[column.id].hidden = false;
			
			that.queryOrder.set(" order by `"+column.name+"` "+direction+" ")
			
		});
		this.orderAccept.listen([this.orderColumn, this.orderDirection]);//listen
///pColumnsVisible		
		this.domColumnsVisibleContainerCreate = new GetSet("domColumnsVisibleContainerCreate", null, function(){//obj
			var result = document.createElement("DIV");
			result.hidden = true;
			result.style.position = 'absolute';
			result.style.top = 0;
			result.style.left = 0;
			result.style.border = "1px solid #c4baa5";
			return result;
			
		});
		this.domColumnsVisibleContainer = new GetSet("domColumnsVisibleContainer", null, function(){//ref
			return that.domColumnsVisibleContainerCreate.get(false);
			
		});
		this.domColumnsVisible = new GetSet("domColumnsVisible", null, function(){//fill
			var result = that.domColumnsVisibleContainer.get();
			var columns = that.columns.get();
			if (!columns) return result;
			
			result.innerHTML = "";
			var tt = document.createElement("TABLE");
			tt.classList.add("highlight");
			tt.setAttribute("cellspacing", 5);
			var tr = document.createElement("TR");
			var td = document.createElement("TD");
			var chAll = document.createElement("INPUT");
			chAll.setAttribute("id", "chAllCols");
			chAll.setAttribute("type", "checkbox");
			chAll.checked = true;
			var l = document.createElement('LABEL');
			l.setAttribute("for", "chAllCols");
			l.innerHTML = "(Все)";
			td.appendChild(chAll);
			td.appendChild(l);
			tr.appendChild(td);
			tt.appendChild(tr);
			
			var funcVisible = function(ind, checked){
				columns[ind].visible = checked;
				if (that.columnsVisibleRefresh) {
					that.columnsVisibleRefresh.get();
				}
				
			}
			
			var arr = [];
			for (var i=0; i < columns.length; i++){
				var tr = document.createElement("TR");
				var td = document.createElement("TD");
				var ch = document.createElement("INPUT");
				ch.setAttribute("type", "checkbox");
				ch.setAttribute("id", "chCol"+i);
				ch.checked = columns[i].visible;
				if (!ch.checked) chAll.checked = false;
				ch.ind = i;
				ch.onchange = function(){
					if (!this.checked) chAll.checked = false;
					funcVisible(this.ind, this.checked);
				};
				arr.push(ch);
				
				var l = document.createElement('LABEL');
				l.setAttribute("for", "chCol"+i);
				l.innerHTML = columns[i].caption;

				td.appendChild(ch);
				td.appendChild(l);
				tr.appendChild(td);
				tt.appendChild(tr);
			}
			result.appendChild(tt);
			
			chAll.onchange = function(){
				for (var i=0; i < arr.length; i++) {
					arr[i].checked = this.checked;
					funcVisible(i, this.checked);
				}
			}
	
			return result;
		
		});
		this.domColumnsVisible.listen([this.jsHead, this.columnsRefresh]);//listen
		
		this.createPanelColsVisible = new GetSet("createPanelColsVisible", null, function(){//call
			var domColumnsVisibleContainer = that.domColumnsVisibleContainer.get();
			if (!domColumnsVisibleContainer) return;
			
			var mainContainer = that.mainContainer.get();
			if (!mainContainer) return;
			mainContainer.appendChild(domColumnsVisibleContainer);
			
		});

		this.domColumnsVisibleContainerPos = new GetSet("domColumnsVisibleContainerPos", {x:0, y:0});
		this.domColumnsVisibleContainerVisible = new GetSet("domColumnsVisibleContainerPos", false);
		this.domColumnsVisibleContainerShow = new GetSet("domColumnsVisibleContainerShow", null, function(){
			var container = that.domColumnsVisibleContainer.get();
			var visible = that.domColumnsVisibleContainerVisible.get();
			var position = that.domColumnsVisibleContainerPos.get();
			if (!container) return;
			container.style.top = position.y;
			container.style.left = position.x;
			container.hidden = !visible;
			
			
		})
		this.domColumnsVisibleContainerShow.listen([this.domColumnsVisibleContainerPos, this.domColumnsVisibleContainerVisible]);
///bColumnsVisible
		this.domButtonColumnsVisibleContainerCreate = new GetSet("domButtonColumnsVisibleContainerCreate", null, function(){
			var result = document.createElement("BUTTON");
			var columns = that.columns.get();
			if (!columns) return result;
			
			var img = new Image();
			img.src = "images/bColumnsVisible.png";
			img.style.width = "32";
			img.style.height= "auto";

			result.appendChild(img);
			result.setAttribute("title", "Показать/скрыть столбцы");

			result.onclick = function(e){
				var pos = that.domColumnsVisibleContainerPos;
				var vis = that.domColumnsVisibleContainerVisible;
				var v = vis.get();
				if (pos && vis) {
					pos.set({x:e.clientX+2, y:e.clientY+2});
					vis.set(!v);
				}

			}
			return result;
		});
		this.domButtonColumnsVisibleContainerCreate.listen([this.jsHead, this.columnsRefresh]);//listen
		this.domButtonColumnsVisibleContainer = new GetSet("domButtonColumnsVisibleContainer", null, function(){
			return that.domButtonColumnsVisibleContainerCreate.get(false);
		});
///bFilterDel
		this.domButtonFilterDelContainerCreate = new GetSet("domButtonFilterDelContainerCreate", null, function(){
			var result = document.createElement("BUTTON");
			result.hidden = true;
			var img = new Image();
			img.src = "images/filter_del.png";
			img.style.width = "32";
			img.style.height= "auto";
			result.appendChild(img);
			result.setAttribute("title", "Удалить фильтры");
			
			var filter = that.filter.get();
			result.onclick = function(){
				var filter = that.filter.get();
				if (!filter) return;
				filter.clearFilters.get();
				location.reload();
				//that.filter.get().clearFilters.get();
				//that.queryWhere.set("");
				//that.domButtonFilterDelShow.get();
			}
			return result;
		});
		this.domButtonFilterDelContainer = new GetSet("domButtonFilterDelContainer", null, function(){
			return that.domButtonFilterDelContainerCreate.get(false);
		});
		this.domButtonFilterDelShow = new GetSet("domButtonFilterDelShow", null, function(){
			var container = that.domButtonFilterDelContainer.get();
			var filter = that.filter.get();
			if (!container || !filter) return;
			
			var filterAll = filter.columnsFilterAll.get();
			container.hidden = !filterAll;
		});
		this.domButtonFilterDelShow.listen([this.filter.get().columnsFilterAll]);//listen
///eUserFilter
		this.domUserFilterContainerCreate = new GetSet("domUserFilterContainerCreate", null, function(){
			var result = document.createElement("INPUT");
			result.setAttribute("type", "text");
			result.setAttribute("placeholder", "Поиск по таблице");
			result.setAttribute("title", "Введите фразу для поиска и нажмите ENTER");
			result.setAttribute("autofocus", "");
			result.style.width = "200px";
			
			//var cols = that.columns.get();
			result.onchange = function(){
				var cols = that.columns.get();
				var val = this.value;
				var userFilter = that.filter.get().userFilter;
				if (userFilter) {
					var where = getWhereForColumns(cols, val);
					userFilter.set( where );
				}
				
			}
			return result;
		});
		this.domUserFilterContainer = new GetSet("domUserFilterContainer", null, function(){
			return that.domUserFilterContainerCreate.get(false);
		});
		//this.domUserFilter.listen([this.filter.get().columnsFilterAll]);//listen
///bLegend
		this.domButtonLegendContainerCreate = new GetSet("domButtonLegendContainerCreate", null, function(){
			var result = document.createElement("BUTTON");
			var img = new Image();
			img.src = "images/bLegend.png";
			img.style.width = "32";
			img.style.height= "auto";
			result.appendChild(img);
			result.setAttribute("title", "Легенда цветового обозначения");
			
			result.onclick = function(e){
				var pos = that.domLegendContainerPos;
				var vis = that.domLegendContainerVisible;
				var v = vis.get();
				if (pos && vis) {
					pos.set({x:e.clientX+2, y:e.clientY+2});
					vis.set(!v);
				}

			}
			return result;
		});
		this.domButtonLegendContainer = new GetSet("domButtonLegendContainer", null, function(){
			return that.domButtonLegendContainerCreate.get(false);
		});
///bExport
		this.domButtonExportContainerCreate = new GetSet("domButtonExportContainerCreate", null, function(){
			var result = document.createElement("BUTTON");
			var img = new Image();
			img.src = "images/excel.png";
			img.style.width = "32";
			img.style.height= "auto";
			result.appendChild(img);
			result.setAttribute("title", "Экспорт таблицы в Excel");
			
			var table = that.domTableContainer.get();
			if (table) {
				result.onclick = function(e){
					export2Excel(table);

				}
			}
			return result;
		});
		this.domButtonExportContainer = new GetSet("domButtonExportContainer", null, function(){
			return that.domButtonExportContainerCreate.get(false);
		});
		
///pButtons
		this.domPanelButtonsContainerCreate = new GetSet("domPanelButtonsContainerCreate", null, function(){//obj
			var div = document.createElement("DIV");
			div.display = 'inline';

			var mainContainer = that.mainContainer.get();
			var domTable = that.domTableContainer.get();
			if (!div || !mainContainer || !domTable) return result;

			var tt = div.appendChild(document.createElement("TABLE"));
			tt.style.width = domTable.style.width;
			tt.setAttribute("cellspacing", 3);
			//tt.style.width = "100%";
			var tr = tt.appendChild(document.createElement("TR"));

			mainContainer.insertBefore(div, domTable);
			return tr;
		});
		this.domPanelButtonsContainer = new GetSet("domPanelButtonsContainer", null, function(){//ref
			return that.domPanelButtonsContainerCreate.get(false);
		});
		this.panelButtonsAdd = new GetSet("panelButtonsAdd", [
			that.domUserFilterContainer.get(),
			that.domButtonFilterDelContainer.get(),
			that.domButtonColumnsVisibleContainer.get(), 
			that.domButtonLegendContainer.get(),
			that.domButtonExportContainer.get(),
		]);
		this.domPanelButtons = new GetSet("domPanelButtons", null, function(){//call
			var result = that.domPanelButtonsContainer.get();
			if (!result) return result;
			
			var panelButtonsAdd = that.panelButtonsAdd;
			if (panelButtonsAdd) {
				var arr = val2Arr(panelButtonsAdd.get());
				if (arr) {
					for (var i=0; i < arr.length; i++) {
						var el = arr[i];
						if (el && isDOM(el)) {
							var td = document.createElement("TD");

							//var isLastInput = false;
							//var input = null;
							//var last = result.lastChild;
							//if (last){
							//	input = last.querySelector("input");
							//	isLastInput = input != null;
							//}
							result.appendChild(td);
							td.appendChild(arr[i]);
							if (td.getElementsByTagName("INPUT").length){
								td.style.width = "100%";
							}
						}
					}
				}
			}
		});
		this.domPanelButtons.listen([this.panelButtonsAdd]);

///columnResize
		this.resizeColumn = new GetSet("resizeColumn", undefined);//val
		this.resizeColumnWidth = new GetSet("resizeColumnWidth", undefined);//val
		this.resizeColumnAccept = new GetSet("resizeColumnAccept", null, function(){//proc
			var column = that.resizeColumn.get();
			var width = that.resizeColumnWidth.get();
			if (!column || !width) return;
			
			column.width = width;
			var objects = column.objects;
			for (var i=0; i < objects.length; i++){
				objects[i].style.width = column.width+"px";
				var div = objects[i].getElementsByTagName('DIV')[0];
				div.style.width = column.width+"px";
				//div.parentNode.style.width = "50px";
			}
		});
		this.resizeColumnAccept.listen([this.resizeColumnWidth]);//listen
		
///pLegend
		this.domLegendContainerCreate = new GetSet("domLegendContainerCreate", null, function(){
			var columns = that.columns.get();
			var colors = that.rowsColorOpts.get();
			if (!columns || !colors) return undefined;
			
			var result = domLegend(colors, columns);
			result.style.hidden = true;
			result.style.position = "absolute";
			return result;
		})
		this.domLegendContainerCreate.listen([this.jsHead, this.columnsRefresh]);//listen
		this.domLegendContainer = new GetSet("domLegendContainer", null, function(){
			return that.domLegendContainerCreate.get(false);
		})
		this.createPanelLegend = new GetSet("createPanelLegend", null, function(){//call
			var domLegendContainer = that.domLegendContainer.get();
			if (!domLegendContainer) return;
			
			var mainContainer = that.mainContainer.get();
			if (!mainContainer) return;
			mainContainer.appendChild(domLegendContainer);
			
		});

		this.domLegendContainerPos = new GetSet("domLegendContainerPos", {x:0, y:0});
		this.domLegendContainerVisible = new GetSet("domLegendContainerPos", false);
		this.domLegendContainerShow = new GetSet("domLegendContainerShow", null, function(){
			var container = that.domLegendContainer.get();
			var visible = that.domLegendContainerVisible.get();
			var position = that.domLegendContainerPos.get();
			if (!container) return;
			container.style.top = position.y;
			container.style.left = position.x;
			container.hidden = !visible;
			
		})
		this.domLegendContainerShow.listen([this.domLegendContainerPos, this.domLegendContainerVisible]);
///hideAllPanels
		this.cancelAll = new GetSet("", null, function(){
			var pFilter = that.filter.get().isDomPanelFilterVisible;
			var pColsVis = that.domColumnsVisibleContainerVisible;
			var pLegend = that.domLegendContainerVisible;

			if (pFilter) pFilter.set(false);
			if (pColsVis) pColsVis.set(false);
			if (pLegend) pLegend.set(false);
			
		})
		
		$(document).bind("keydown", function(event) {
			if (event.keyCode == 27) {
				that.cancelAll.get();
			}
		});
///AroundInvoke
		function ai1(name, fname, params) {
			//console.log("before " + name + " " + fname);
			var ret = funcAroundInvoke1 ? funcAroundInvoke1(name, fname, params) : true;
			return ret;
		}
		function ai2(name, fname, params) {
			//console.log("before " + name + " " + fname);
			var ret = funcAroundInvoke2 ? funcAroundInvoke2(name, fname, params) : true;
			return ret;
		}
		
}

function RowColorMarker(val) {
	this.conditions = val && val.conditions ? val.conditions : [new FieldCondition()];
	this.color = val && val.color ? val.color : "#fff";
}

function FieldCondition(val) {
	this.field = val && val.field ? val.field : ""
	this.compareType = val && val.compareType ? val.compareType : "=";
	this.value = val && val.value ? val.value : "";
	this.condType = val && val.condType ? val.condType : "or"/*and*/;
}

function getWhereForColumns(columns, val){
	var result = "";
	if (!columns) return result;
	
	if (columns && columns.length) {
		var arr = [];
		for (var i=0; i < columns.length; i++){
			if (columns[i].name) {
				arr.push(" or `"+columns[i].name+"` like '%"+val+"%' ");
			}
		}
		result = " and (1=2 "+arr.join("")+") ";
	}
	return result;
}

function cmpOperator(t, val, pat){
	val = val ? val.toLowerCase() : undefined;
	pat = pat ? pat.toLowerCase() : undefined;
	
	var result = 
		( t == "=" && val == pat ) ||
		( t == ">" && parseInt(val) > parseInt(pat) ) ||
		( t == "<" && parseInt(val) < parseInt(pat) ) ||
		( t == "like" && ~val.indexOf(pat) ) ||
		( t == "!=" && val != pat ) ||
		( t == "in" && ~JSON.parse(pat).indexOf(val) ) ||
		( t == "not in" && JSON.parse(pat).indexOf(val) == -1 );
	
	return result;
};

function domLegendCond(fieldCondition, columns){
	var cols = columns;
	var cond = fieldCondition;
	var result = document.createElement("TR");
	if (!(cond instanceof FieldCondition)) return result;

	var colsNames = fieldValsFromObjects(cols, "name");
	for (var key in cond){
		var td = document.createElement("TD");
		var val = "";
		if (key == "field"){
			val = 'Поле "'+cols[colsNames.indexOf(cond[key])].caption+'"';
		} else if (key == "condType") {
			val = cond[key] == "or" ? "или" : "и"
		} else if (key == "value") {
			val = '"'+cond[key]+'"';
		} else {
			val = cond[key];
		}
		
		td.innerHTML = val;
		result.appendChild(td);
		
	}
	return result;
}

function domLegendColor(rowColorMarker, columns){
	var cols = columns;
	var marker = rowColorMarker;
	var result = document.createElement("TR");
	//var tr = result.appendChild(document.createElement("TR"));
	var tdColor = result.appendChild(document.createElement("TD"));
	var tdConds = result.appendChild(document.createElement("TD"));
	var ttConds = tdConds.appendChild(document.createElement("TABLE"));
	ttConds.setAttribute("cellspacing", "5");
	
	if (!(marker instanceof RowColorMarker)) return result;
	var color = marker.color;
	tdColor.style.backgroundColor = color;
	tdColor.style.width = "100px";
	tdColor.style.border = "1px solid #b4aa95";
	var conds = marker.conditions;
	if (conds && conds.length) {
		for (var i=0; i < conds.length; i++){
			var cond = conds[i];
			if (cond instanceof FieldCondition) {
				var dom = domLegendCond(cond, cols);
				if (i == conds.length-1) {
					dom.lastChild.innerHTML = "";
				}
				ttConds.appendChild(dom);
			}
		}
	}
	
	return result;
}

function domLegend(rowColorMarkers, columns){
	var cols = columns;
	var markers = rowColorMarkers;
	var result = document.createElement("DIV");
	//if (JSON.stringify(markers) != "{}") return result;
	var label = result.appendChild(document.createElement("LABEL"));
	var tt = result.appendChild(document.createElement("TABLE"));
	tt.setAttribute("cellspacing", 10);
	label.innerHTML = "<br>&nbsp;&nbsp;&nbsp;&nbsp;Легенда цветового обозначения";
	result.style.border = "1px solid #b4aa95";
	result.style.backgroundColor = "#fffff0";
	if (markers && markers.length) {
		for (var i=0; i < markers.length; i++){
			var marker = markers[i];
			if (marker instanceof RowColorMarker) {
				var dom = domLegendColor(marker, cols);
				tt.appendChild(dom);
			}
		}
	}
	
	return result;
};

function getColumnLeft(columns, ind){
	var ret = 0;
	for (var i=0; i < ind; i++){
		ret += columns[i].width;
	}
	return ret;
}

/*///редактирование в таблице
$(function()	{
	$('td').click(function(e)	{
		//ловим элемент, по которому кликнули
		var t = e.target || e.srcElement;
		//получаем название тега
		var elm_name = t.tagName.toLowerCase();
		//если это инпут - ничего не делаем
		if(elm_name == 'input')	{return false;}
		var val = $(this).html();
		var code = '<input type="text" id="edit" value="'+val+'" />';
		$(this).empty().append(code);
		$('#edit').focus();
		$('#edit').blur(function()	{
			var val = $(this).val();
			$(this).parent().empty().html(val);
		});
	});
});

*/

