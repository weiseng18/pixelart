// ------
// color picker
// ------

function ColorPicker(slider_id, body_id, defaultColorType) {
	// color slider
	this.slider = new CanvasWrapper(slider_id);
	var colors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 255, 0, 1)", "rgba(0, 255, 255, 1)", "rgba(0, 0, 255, 1)", "rgba(255, 0, 255, 1)", "rgba(255, 0, 0, 1)"];
	this.slider.LinearGradient(colors, "vertical");

	// color body
	this.body = new CanvasWrapper(body_id);

	// display actual color
	this.colorType = defaultColorType;
	this.buttonID = "color_select";
	this.colorTypeID = "color_type";
}

function CanvasWrapper(id) {
	this.HTML = get(id);
	this.ctx = this.HTML.getContext("2d");
	this.width = this.HTML.width;
	this.height = this.HTML.height;
	this.drag = false;
}

// creates a gradient of colors over the whole canvas
// colors is the list of colors (must include the end color)
// which is the direction
CanvasWrapper.prototype.LinearGradient = function(colors, which) {
	var gradient;
	if (which == "vertical")
		gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
	else
		gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
	var ratio = colors.length - 1;
	for (var i=0; i<colors.length; i++) 
		gradient.addColorStop(i/ratio, colors[i]);
	this.ctx.fillStyle = gradient;
	this.ctx.fillRect(0, 0, this.width, this.height);
}

// creates a 2d gradient of colors over the whole canvas
// to the right is more intensity in the color (i.e. redder)
// to the bottom is less opacity in the color (i.e. darker)
CanvasWrapper.prototype.TwoDimGradient = function(color) {
	// this is done in 3 steps
	
	// step 1: color the whole canvas as the selected color
	this.ctx.fillStyle = color;
	this.ctx.fillRect(0, 0, this.width, this.height);

	// step 2: gradient from left to right of white (right is less white)
	var white = ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)'];
	var whiteGradient = this.LinearGradient(white, "horizontal");
	this.ctx.fillStyle = whiteGradient;
	this.ctx.fillRect(0, 0, this.width, this.height);

	// step 3: gradient from top to bottom of black (down is more black)
	var black = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 1)'];
	var blackGradient = this.LinearGradient(black, "vertical");
	this.ctx.fillStyle = blackGradient;
	this.ctx.fillRect(0, 0, this.width, this.height);
}

// updates the color in #color_body based on a color picked from #color_slider
ColorPicker.prototype.updateColorBody = function(e) {
	x = e.offsetX;
	y = e.offsetY;
	var data = this.slider.ctx.getImageData(x, y, 1, 1).data;
	var color = 'rgba(' + data[0] + ',' + data[1] + ',' + data[2] + ',1)';
	this.body.TwoDimGradient(color);
}

// updates the color in #color (i.e. the actual color chosen) based on a color picked from #color_body
ColorPicker.prototype.updateColor = function(e, source) {
	if (source == "color_picker") {
		x = e.offsetX;
		y = e.offsetY;
		var data = this.body.ctx.getImageData(x, y, 1, 1).data;
		var color = 'rgba(' + data[0] + ',' + data[1] + ',' + data[2] + ',1)';
	}
	else if (source == "color_history" || source == "eyeDropper") {
		var color = e.target.style.backgroundColor;
	}

	// update color
	get("color").style.backgroundColor = color;

	this.updateColorValue(color, source);
}

// displays the raw value of the color
// can choose between RGB and hex value
ColorPicker.prototype.updateColorValue = function(color, source) {
	if (this.colorType == "RGB") {
		var colors;
		if (source == "color_picker") {
			// input format: rgba(0,0,0,0)
			colors = color.split("(")[1].split(",");
		}
		else if (source == "color_history" || source == "eyeDropper" || source == "manual") {
			// input format: rgb(0, 0, 0)
			// note the spaces in the rgb
			colors = color.split("(")[1].split(", ");
			colors[2] = colors[2].substring(0, colors[2].length-1);
		}
		// split up rgb
		for (var i=0; i<3; i++)
			get("color_text").children[i*2+1].value = colors[i];
	}
	else if (this.colorType == "hex") {
		var rgb;
		if (source == "color_picker") {
			// convert from rgba(0,0,0,0) to rgb(0, 0, 0)
			// note the spaces in the rgb
			rgb = color.split(",");

			// remove the a from rgba
			rgb[0] = "rgb(" + rgb[0].substring(5);
			// remove opacity value
			rgb[3] = "";

			rgb = rgb.join(", ");
			rgb = rgb.substring(0, rgb.length-2) + ")";
		}
		else if (source == "color_history" || source == "eyeDropper" || source == "manual") {
			rgb = color;
		}

		// convert to hex
		var hex = RGBStringToHexString(rgb);
		// remove the #
		hex = hex.substring(1);

		get("color_text").children[1].value = hex;
	}
}

// toggle between RGB and hex value
ColorPicker.prototype.toggleColorType = function() {
	var pickedType = get(this.colorTypeID).value;
	if (pickedType == "RGB") {
		this.colorType = "RGB";
		get("color_text").innerHTML = "";
		this.createDisplayArea();
		var color = get("color").style.backgroundColor;
		this.updateColorValue(color, "manual");
	}
	else {
		this.colorType = "hex";
		get("color_text").innerHTML = "";
		this.createDisplayArea();
		var color = get("color").style.backgroundColor;
		this.updateColorValue(color, "manual");
	}
}

// confirms the color manually typed out/scroll through
// from the rgb/hex value area, and adds this color to color history
ColorPicker.prototype.selectColor = function() {
	var colorPicked;
	if (this.colorType == "RGB") {
		var r = parseInt(get("color_text").children[1].value);
		var g = parseInt(get("color_text").children[3].value);
		var b = parseInt(get("color_text").children[5].value);
		colorPicked = "rgb(" + r + ", " + g + ", " + b + ")";
	}
	else if (this.colorType == "hex") {
		// cannot prevent user from backspacing in the hex area
		// check of hex string length < 6 must be done here only

		var hexValue = get("color_text").children[1].value;

		if (hexValue.length < 6) { //less than 6, i.e. invalid
			return;
		}

		var hex = "#" + hexValue;
		colorPicked = HexStringToRGBString(hex);
	}

	// colorPicked is a RGB string that indicates the color chosen

	// update color
	get("color").style.backgroundColor = colorPicked;
}

// turns of keypress event listener for keytriggers, so that typing in RGB/Hex is allowed
ColorPicker.prototype.enableTyping = function() {
	tools.toggleKeyPressListener();
}

// creates the area (and structure) to display raw value of the color
ColorPicker.prototype.createDisplayArea = function() {
	if (this.colorType == "RGB") {

		var values = [" R: ", " G: ", " B: "];
		var color = ["#FF0000", "#00FF00", "#0000FF"];

		var ele_color = [null, null, null];
		for (var i=0; i<3; i++) {
			ele_color[i] = document.createElement("span");
			ele_color[i].innerHTML = values[i];
			ele_color[i].style.verticalAlign = "middle";
			ele_color[i].style.color = color[i];
		}

		var ele_input = [null, null, null];
		for (var i=0; i<3; i++) {
			ele_input[i] = document.createElement("input");
			ele_input[i].type = "number";
			ele_input[i].style.width = "15%";
			ele_input[i].style.verticalAlign = "middle";
			ele_input[i].min = 0;
			ele_input[i].max = 255;
			ele_input[i].addEventListener("keypress", this.validateRGBKeypress);
			ele_input[i].addEventListener("input", this.selectColor.bind(this));
			ele_input[i].addEventListener("paste", this.handlePaste.bind(this));

			ele_input[i].addEventListener("focus", this.enableTyping);
			ele_input[i].addEventListener("blur", this.enableTyping);
		}

		for (var i=0; i<3; i++) {
			get("color_text").appendChild(ele_color[i]);
			get("color_text").appendChild(ele_input[i]);
		}
	}
	else if (this.colorType == "hex") {

		var hashsymbol = document.createElement("span");
		hashsymbol.innerHTML = "#";
		hashsymbol.style.verticalAlign = "middle";

		var value = document.createElement("input");
		value.type = "text";
		value.style.width = "50%";
		value.addEventListener("keypress", this.validateHexKeypress);
		value.addEventListener("input", this.selectColor.bind(this));
		value.addEventListener("paste", this.handlePaste.bind(this));

		value.addEventListener("focus", this.enableTyping);
		value.addEventListener("blur", this.enableTyping);

		get("color_text").appendChild(hashsymbol);
		get("color_text").appendChild(value);
	}
}

ColorPicker.prototype.handlePaste = function(e) {
	var paste = (e.clipboardData || window.clipboardData).getData('text');
	if (this.colorType == "RGB") {
		var pattern = new RegExp("^[0-9]{1,3}$");
		var res = pattern.test(paste);
		if (res == false) { // invalid string
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			alert("Invalid RGB value!")
		}
		else {
			// clear the box
			e.target.value = "";
			var number = parseInt(paste);
			if (number < 0 || number > 255) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				alert("Invalid RGB value!")
			}
		}
	}
	else if (this.colorType == "hex") {
		var pattern = new RegExp("^(0x|0X|#)?[0-9a-fA-F]{6}$");
		var res = pattern.test(paste);
		if (res == false) { // invalid string
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			alert("Invalid hex value!")
		}
		else {
			// clear the box
			e.target.value = "";
			if (RegExp("^#").test(paste))
				paste = paste.substring(1);
			else if (RegExp("^(0x|0X)").test(paste))
				paste = paste.substring(2);

			// want to prevent default paste in order to remove the # or 0x or 0X
			e.target.value = paste;
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
	}
}

ColorPicker.prototype.validateRGBKeypress = function(e) {
	var key = e.which || e.keyCode;
	if (key == 8) // backspace
		return true;
	else if (key < 48 || key > 57) // not a digit
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
	else
		return true;
}

ColorPicker.prototype.validateHexKeypress = function(e) {
	// check if selected
	var ele = get("color_text").children[1];
	var selectionStart = ele.selectionStart;
	var selectionEnd = ele.selectionEnd;

	var selected = false;
	if (typeof selectionStart == "number" && typeof selectionEnd == "number")
		if (selectionEnd > selectionStart) {
			selected = true;
		}

	var key = e.which || e.keyCode;
	if (key == 8) // backspace
		return true;
	else {
		if (e.target.value.length == 6) { // check for length
			// check if selected
			if (selected)
				return true;
			else
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
		else if (48 <= key && key <= 57) // digit
			return true;
		else if (65 <= key && key <= 70) // [A-F]
			return true;
		else if (97 <= key && key <= 102) // [a-f]
			return true;
		else {
			// check if selected
			if (selected)
				return true;
			else
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
	}
}

// event listeners
ColorPicker.prototype.slider_click = function(e) {
	this.updateColorBody(e);
}

ColorPicker.prototype.slider_mousedown = function(e) {
	this.slider.drag = true;
	this.updateColorBody(e);
}

ColorPicker.prototype.slider_mousemove = function(e) {
	if (this.slider.drag)
		this.updateColorBody(e);
}

ColorPicker.prototype.slider_mouseup = function(e) {
	this.slider.drag = false;
}

ColorPicker.prototype.slider_mouseleave = function(e) {
	this.slider.drag = false;
}

ColorPicker.prototype.body_click = function(e) {
	this.updateColor(e, "color_picker");
}

ColorPicker.prototype.body_mousedown = function(e) {
	this.body.drag = true;
	this.updateColor(e, "color_picker");
}

ColorPicker.prototype.body_mousemove = function(e) {
	if (this.body.drag)
		this.updateColor(e, "color_picker");
}

ColorPicker.prototype.body_mouseup = function(e) {
	this.body.drag = false;
}

ColorPicker.prototype.body_mouseleave = function(e) {
	this.body.drag = false;
}

ColorPicker.prototype.addEventListeners = function() {
	// add event listener to change the color gradient displayed in body
	this.slider.HTML.addEventListener("click", this.slider_click.bind(this));

	// allow dragging on the slider
	this.slider.HTML.addEventListener("mousedown", this.slider_mousedown.bind(this));
	this.slider.HTML.addEventListener("mousemove", this.slider_mousemove.bind(this));
	this.slider.HTML.addEventListener("mouseup", this.slider_mouseup.bind(this));
	this.slider.HTML.addEventListener("mouseleave", this.slider_mouseleave.bind(this));

	// add event listener to change the color displayed
	this.body.HTML.addEventListener("click", this.body_click.bind(this));

	// allow dragging on the body
	this.body.HTML.addEventListener("mousedown", this.body_mousedown.bind(this));
	this.body.HTML.addEventListener("mousemove", this.body_mousemove.bind(this));
	this.body.HTML.addEventListener("mouseup", this.body_mouseup.bind(this));
	this.body.HTML.addEventListener("mouseleave", this.body_mouseleave.bind(this));
}