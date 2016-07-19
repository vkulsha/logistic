function ObjColumn(params) {
	this["id"] = (params && params["id"] !== undefined) ? params["id"] : 0;
	this["name"] = (params && params["name"] !== undefined) ? params["name"] : "Класс"
	this["caption"] = (params && params["caption"] !== undefined) ? params["caption"] : this["name"];
	this["width"] = (params && params["width"] !== undefined) ? params["width"] : 100;
	this["height"] = (params && params["height"] !== undefined) ? params["height"] : "100%";
	this["visible"] = (params && params["visible"] !== undefined) ? params["visible"] : true;
	this["class"] = (params && params["class"] !== undefined) ? params["class"] : 1;
	this["objects"] = (params && params["objects"] !== undefined) ? params["objects"] : [];
	this["fontSize"] = (params && params["fontSize"] !== undefined) ? params["fontSize"] : "inherit";
	this["objectLinkMethod"] = (params && params["objectLinkMethod"] !== undefined) ? params["objectLinkMethod"] : "gT2";
	this["parentCol"] = (params && params["parentCol"] !== undefined) ? params["parentCol"] : 0;
	
}
