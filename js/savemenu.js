function ExportMenu(pre) {
	// pre is like gif
	// id is like gifmenu
	this.id = pre + "menu";
	this.which = pre;

	this.items = this.generateItems(this.id);
	this.ele = this.generateHTML(this.id, pre);
}

function ExportOption(id, option, type, min, max) {
	this.ele = document.createElement("div");
	this.ele.className = "exportmenu_option";

	this.optionContainer = document.createElement("div");
	this.optionContainer.className = "exportmenu_optionContainer";
	this.optionContainer.innerHTML = option;

	this.inputContainer = document.createElement("div");
	this.inputContainer.className = "exportmenu_inputContainer";

	if (type == "number") {
		this.inputSlider = document.createElement("input");
		this.inputSlider.className = "exportmenu_slider";

		this.inputSlider.type = "range";
		this.inputSlider.min = min;
		this.inputSlider.max = max;
		this.inputSlider.value = min;

		this.inputSlider.addEventListener("change", function(e) {
			e.target.parentNode.children[1].value = e.target.value;
		});

		this.input = document.createElement("input");
		this.input.className = "exportmenu_value";

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

	this.ele.appendChild(this.optionContainer);
	this.ele.appendChild(this.inputContainer);
}

ExportMenu.prototype.generateItems = function(id) {
	var items = [];

	if (id == "gifmenu") {
		items[0] = new ExportOption(id, "Scale", "number", 1, 10);
		items[1] = new ExportOption(id, "Delay between frames (ms)", "number", 100, 1000);
	}
	else if (id == "pngmenu") {
		items[0] = new ExportOption(id, "Scale", "number", 1, 10);
	}

	return items;
}

ExportMenu.prototype.generateHTML = function(id, pre) {
	var wrapper = document.createElement("div");
	wrapper.id = id + "_wrapper";
	wrapper.className = "exportmenu_wrapper";

	var menu = document.createElement("div");
	menu.id = id;
	menu.className = "exportmenu";

	for (var i=0; i<this.items.length; i++) {
		this.items[i].ele.id = id + "_option" + i;
		menu.appendChild(this.items[i].ele);
	}

	var footer = document.createElement("div");
	footer.className = "exportmenu_footer";

	var submit = document.createElement("button");
	submit.innerHTML = "Generate " + pre.toUpperCase();

	if (pre == "gif") {
		submit.addEventListener("click", function(e) {
			var scale = parseInt(get(id + "_option0").children[1].children[0].value);
			var delay = parseInt(get(id + "_option1").children[1].children[0].value);
			createGIF(scale, delay);

			this.closeMenu();
		}.bind(this));
	}
	else if (pre == "png") {
		submit.addEventListener("click", function(e) {
			var scale = parseInt(get(id + "_option0").children[1].children[0].value);
			savePNG(scale);

			this.closeMenu();
		}.bind(this));
	}

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

ExportMenu.prototype.showMenu = function() {
	document.body.appendChild(this.ele);
}

ExportMenu.prototype.closeMenu = function() {
	document.body.removeChild(this.ele);
}