function Column(params) {
	this["id"] = (params && params["id"] !== undefined) ? params["id"] : 0;
	this["name"] = (params && params["name"] !== undefined) ? params["name"] : ""
	this["caption"] = (params && params["caption"] !== undefined) ? params["caption"] : "";
	this["width"] = (params && params["width"] !== undefined) ? params["width"] : 100;
	this["height"] = (params && params["height"] !== undefined) ? params["height"] : "100%";
	this["visible"] = (params && params["visible"] !== undefined) ? params["visible"] : true;
	this["class"] = (params && params["class"] !== undefined) ? params["class"] : "";
	this["objects"] = (params && params["objects"] !== undefined) ? params["objects"] : [];
	this["fontSize"] = (params && params["fontSize"] !== undefined) ? params["fontSize"] : "inherit";
	
}
