function GIFMenu(id) {
	this.id = id;

	this.items = this.generateItems(this.id);
	this.ele = this.generateHTML(id);
}

function GIFOption(subID, option, type, min, max) {
	this.ele = document.createElement("div");
	this.ele.className = "gifmenu_option";

	this.optionContainer = document.createElement("div");
	this.optionContainer.className = subID + "_optionContainer";

	this.optionContainer.innerHTML = option;
	this.ele.appendChild(this.optionContainer);

	this.inputContainer = document.createElement("div");
	this.inputContainer.className = subID + "_inputContainer";

	if (type == "number") {
		this.inputSlider = document.createElement("input");
		this.inputSlider.className = subID + "_slider";

		this.inputSlider.type = "range";
		this.inputSlider.min = min;
		this.inputSlider.max = max;
		this.inputSlider.value = min;

		this.inputSlider.addEventListener("change", function(e) {
			e.target.parentNode.children[1].value = e.target.value;
		});

		this.input = document.createElement("input");
		this.input.className = subID + "_value";

		this.input.type = "number";
		this.input.min = min;
		this.input.max = max;
		this.input.value = min;

		this.input.addEventListener("change", function(e) {
			e.target.parentNode.children[0].value = e.target.value;
		});

		this.inputContainer.appendChild(this.inputSlider);
		this.inputContainer.appendChild(this.input);
	}

	this.ele.appendChild(this.inputContainer);
}

GIFMenu.prototype.generateItems = function(subID) {
	var items = [];

	items[0] = new GIFOption(subID, "Scale", "number", 1, 10);
	items[1] = new GIFOption(subID, "Delay between frames (ms)", "number", 100, 1000);

	return items;
}

GIFMenu.prototype.generateHTML = function(id) {
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
	menu.style.left = "25%";

	menu.style.backgroundColor = "#555";
	menu.style.width = "50%";
	menu.style.height = "70%";

	menu.style.display = "flex";
	menu.style.flexDirection = "column";
	menu.style.alignItems = "center";
	menu.style.justifyContent = "space-evenly";

	for (var i=0; i<this.items.length; i++) {
		this.items[i].ele.id = id + "_option" + i;
		menu.appendChild(this.items[i].ele);
	}

	var footer = document.createElement("div");
	footer.style.width = "50%";
	footer.style.display = "flex";
	footer.style.justifyContent = "space-evenly";
	footer.style.alignItems = "center";

	var submit = document.createElement("button");
	submit.innerHTML = "Generate GIF";
	submit.addEventListener("click", function(e) {
		var scale = parseInt(get(id + "_option0").children[1].children[0].value);
		var delay = parseInt(get(id + "_option1").children[1].children[0].value);
		createGIF();

		this.closeMenu();
	}.bind(this));

	var cancel = document.createElement("button");
	cancel.innerHTML = "Cancel";
	cancel.addEventListener("click", function(e) {
		this.closeMenu();
	}.bind(this));

	footer.appendChild(submit);
	footer.appendChild(cancel);

	menu.appendChild(footer);

	wrapper.appendChild(menu);

	return wrapper;
}

GIFMenu.prototype.showMenu = function() {
	document.body.appendChild(this.ele);
}

GIFMenu.prototype.closeMenu = function() {
	document.body.removeChild(this.ele);
}

function createGIF(scale=1, delay=200) {
	var encoder = new GIFEncoder();

	encoder.setRepeat(0);		// infinite repeat
	encoder.setDelay(delay);	// delay between frames

	var frames = frameWrapper.frames;
	var height = area.height;
	var width = area.width;

	encoder.start();

	for (var f=0; f<frames.length; f++) {
		// step 1: create canvas
		var canvas = document.createElement("canvas");
		canvas.height = height * scale;
		canvas.width = width * scale;

		var ctx = canvas.getContext("2d");
		for (var i=0; i<height; i++)
			for (var j=0; j<width; j++) {
				var value = frames[f].grid[i][j];
				if (value != null) {
					ctx.fillStyle = value;
					ctx.fillRect(j*scale, i*scale, scale, scale);
				}
			}
		// step 2: pass canvas context
		encoder.addFrame(ctx);
	}

	encoder.finish();
	encoder.download("result.gif");
	
}