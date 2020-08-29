function StartMenu(id) {
	this.id = id;

	this.items = this.generateItems();
	this.ele = this.generateHTML(id);
}

function MenuItem(action) {
	// default settings
	this.ele = document.createElement("div");
	this.ele.style.width = "30%";
	this.ele.style.height = "90%";
	this.ele.style.backgroundColor = "#222";
	this.ele.style.color = "#fff";

	this.ele.style.cursor = "pointer";

	// note that for this header, it requires manually defined line breaks if text per line is to be balanced.
	// css property text-wrap does not exist yet?
	var header = document.createElement("div");
	header.style.width = "80%";
	header.style.margin = "auto";
	header.style.fontSize = "20px";

	header.style.paddingTop = "10%";

	header.innerHTML = action;

	this.ele.append(header);
}

// generate elements for items[0], "Start from scratch"
// 2x input and 2x span

StartMenu.prototype.generate_StartFromScratch = function() {
	var widthWord = document.createElement("span");
	widthWord.innerHTML = "Width: ";
	widthWord.style.verticalAlign = "middle";

	var width = document.createElement("input");
	width.type = "number";
	width.min = 4;
	width.max = 32;
	width.value = 16; // default
	width.style.width = "50px";
	width.id = "area_width";

	var br = document.createElement("br");

	var heightWord = document.createElement("span");
	heightWord.innerHTML = "Height: ";
	heightWord.style.verticalAlign = "middle";

	var height = document.createElement("input");
	height.type = "number";
	height.min = 4;
	height.max = 32;
	height.value = 16; // default
	height.style.width = "50px";
	height.id = "area_height";

	var wrapper = document.createElement("div");
	wrapper.append(widthWord);
	wrapper.appendChild(width);
	wrapper.appendChild(br);
	wrapper.appendChild(heightWord);
	wrapper.appendChild(height);

	wrapper.style.paddingTop = "10%";
	wrapper.style.width = "80%";
	wrapper.style.margin = "auto";

	return wrapper;
}

StartMenu.prototype.generateItems = function() {
	var items = [];

	// start new
	items[0] = new MenuItem("Start from scratch");
	
	// append custom footer
	var res = this.generate_StartFromScratch();
	items[0].ele.appendChild(res);

	items[0].ele.addEventListener("click", function(e) {
		if (e.target == get("menuitem0"))
			this.closeMenu(0);
	}.bind(this));

	// load from localStorage (i.e last saved in browser)
	// currently this does not save history (undo/redo)
	items[1] = new MenuItem("Continue from where<br>you left off");
	items[1].ele.addEventListener("click", function(e) {
		this.closeMenu(1);
		loadFrames("localStorage");
	}.bind(this));

	items[2] = new MenuItem("Load from local .pix");
	items[2].ele.addEventListener("click", function(e) {
		this.closeMenu(2);
		loadRaw("upload");
	}.bind(this));

	return items;
}


StartMenu.prototype.generateHTML = function(id) {
	var wrapper = document.createElement("div");
	wrapper.id = id + "_wrapper";

	wrapper.style.zIndex = "300";
	// position needs to be not static for z-index to have any effect
	wrapper.style.position = "absolute";

	wrapper.style.height = "100vh";
	wrapper.style.width = "100%";
	wrapper.style.backgroundColor = "rgba(0,0,0,0.7)";

	var menu = document.createElement("div");

	menu.id = id;

	menu.style.position = "absolute";
	menu.style.top = "15%";
	menu.style.left = "15%";

	menu.style.backgroundColor = "#555";
	menu.style.width = "70%";
	menu.style.height = "70%";

	menu.style.display = "flex";
	menu.style.alignItems = "center";
	menu.style.justifyContent = "space-evenly";

	for (var i=0; i<this.items.length; i++) {
		this.items[i].ele.id = "menuitem" + i;
		menu.appendChild(this.items[i].ele);
	}

	wrapper.appendChild(menu);

	return wrapper;
}

StartMenu.prototype.showMenu = function() {
	document.body.appendChild(this.ele);
}

StartMenu.prototype.closeMenu = function(which) {
	if (which == 0) {
		width = parseInt(get("area_width").value);
		height = parseInt(get("area_height").value);

		if (width < 4 || width > 32 || height < 4 || height > 32) {
			alert("Invalid dimensions. Supports 4x4 to 32x32");
			return;
		}
		var scale = width/height;
		if (scale < 0.5 || scale > 2) {
			alert("Scale is too large, keep the dimensions ratio to at most 2");
			return;
		}

		reload(height, width);

		frameWrapper.frames = [];
		frameWrapper.addNewFrame();
		get(frameWrapper.id).innerHTML = "";
		frameWrapper.initHTML();

		this.whichFrame = 0;
		frameWrapper.loadFrame(0, "closeMenu");
	}
	document.body.removeChild(this.ele);	

	// add keypress listener
	document.addEventListener("keypress", tools.keyPressListener.bind(tools));
}