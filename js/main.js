// ------
// drawing area
// ------

function DrawArea(height, width) {
	this.height = height;
	this.width = width;
	this.grid = init2D(height, width, null);
	this.id = "display";
	this.drag_paint = false;
	this.drag_erase = false;

	this.edit = false;

	this.tool = 0;
}

DrawArea.prototype.generateHTML = function() {
	// table
	var table = document.createElement("table");
	table.id = this.id;
	table.style.borderSpacing = 0;

	table.style.marginLeft = "auto";
	table.style.marginRight = "auto";

	table.style.height = "400px";
	table.style.width = (400 / this.height * this.width).toString() + "px";

	for (var i=0; i<this.height; i++) {
		var row = table.insertRow();
		row.style.height = toString(400 / this.height) + "px";
		for (var j=0; j<this.width; j++) {
			var cell = row.insertCell();				
			cell.style.width = toString(400 / this.width) + "px";
			cell.style.backgroundColor = (i+j)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
		}
	}

	// prevent dragging of ghost image
	table.addEventListener("dragstart", function(e) {
		e.preventDefault();
	});

	get("mainArea").appendChild(table);

	this.toggleEdit();
}

DrawArea.prototype.toggleEdit = function() {
	var table = get(this.id);

	// turn on event listeners
	if (this.edit == false) {
		this.edit = true;

		// coloring event listener
		table.addEventListener("click", this.click);

		// erasing event listener
		table.addEventListener("contextmenu", this.contextmenu);

		// allow dragging for coloring/erasing
		table.addEventListener("mousedown", this.mousedown);
		table.addEventListener("mousemove", this.mousemove);
		table.addEventListener("mouseup", this.mouseup);
		table.addEventListener("mouseleave", this.mouseleave);
	}
	else {
		this.edit = false;

		// coloring event listener
		table.removeEventListener("click", this.click);

		// erasing event listener
		table.removeEventListener("contextmenu", this.contextmenu);

		// allow dragging for coloring/erasing
		table.removeEventListener("mousedown", this.mousedown);
		table.removeEventListener("mousemove", this.mousemove);
		table.removeEventListener("mouseup", this.mouseup);
		table.removeEventListener("mouseleave", this.mouseleave);
	}
}

function paint(e) {
	var color = get("color").style.backgroundColor;
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (row == undefined || column == undefined) return;

	// update HTML
	cell.style.backgroundColor = color;

	// update grid
	area.grid[row][column] = RGBStringToHexString(color);
}

function erase(e) {
	e.preventDefault();

	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	// update HTML
	cell.style.backgroundColor = (row+column)%2 == 0 ? "#FFFFFF" : "#D8D8D8";

	// update grid
	area.grid[row][column] = null;

	//disable default right click context menu
	return false;
}

DrawArea.prototype.click = function(e) {
	if (area.tool == 0) {
		paint(e);
	}
	else if (area.tool == 1) {
		eyeDropper(e);
		toggleTool(area.tool);
	}
}

DrawArea.prototype.contextmenu = function(e) {
	if (area.tool == 0) {
		erase(e);
	}
}

DrawArea.prototype.mousedown = function(e) {
	if (area.tool == 0) {
		if (e.which == 1) {
			this.drag_paint = true;
			paint(e);
		}
		else if (e.which == 3) {
			e.preventDefault();
			this.drag_erase = true;
			erase(e);
		}
	}
}

DrawArea.prototype.mousemove = function(e) {
	if (area.tool == 0) {
		if (this.drag_paint)
			paint(e);
		if (this.drag_erase)
			erase(e);
	}
}

DrawArea.prototype.mouseup = function(e) {
	if (area.tool == 0) {
		if (e.which == 1 || e.which == 3) {
			this.drag_paint = false;
			this.drag_erase = false;
		}
		else if (e.which == 2) {
			// middle click (eyeDropper)
			eyeDropper(e);
		}
	}
}

DrawArea.prototype.mouseleave = function(e) {
	if (area.tool == 0) {
		this.drag_paint = false;
		this.drag_erase = false;
	}
}

// ------
// move tool drawArea functions
// ------

DrawArea.prototype.moveSelection = function(selection, p1, p2, p3, p4) {
	// p1, p2 is topleft, bottomright of original location selection
	// p3, p4 is topleft, bottomright of new location for selection

	var width = p2.x - p1.x + 1;
	var height = p2.y - p1.y + 1;

	// erase and write back original grid
	for (var y=p1.y; y<=p2.y; y++)
		for (var x=p1.x; x<=p2.x; x++) {
			this.erase({x:x, y:y});
			if (this.grid[y][x] != null) {
				this.paint({x:x, y:y}, this.grid[y][x]);
			}
		}

	// update new location for selection
	for (var y=p3.y; y<=p4.y; y++)
		for (var x=p3.x; x<=p4.x; x++)
			if (selection[y - p3.y][x - p3.x] != null)
				this.paint({x:x, y:y}, selection[y - p3.y][x - p3.x]);
}

DrawArea.prototype.erase = function(p) {
	selectCanvas.grid[p.y][p.x] = null;
	getCell("display", p.y, p.x).style.backgroundColor = (p.y+p.x)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
}

DrawArea.prototype.paint = function(p, color) {
	selectCanvas.grid[p.y][p.x] = color;
	if (color != null)
		getCell("display", p.y, p.x).style.backgroundColor = color;
	else
		getCell("display", p.y, p.x).style.backgroundColor = (p.y+p.x)%2 == 0 ? "#FFFFFF" : "#D8D8D8";

}

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
	this.ctx.fillStyle = whiteGradient;
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
		else if (source == "color_history" || source == "eyeDropper") {
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
		else if (source == "color_history" || source == "eyeDropper") {
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
	}
	else {
		this.colorType = "hex";
		get("color_text").innerHTML = "";
		this.createDisplayArea();
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
		// allowing 3 digit #fbc == #ffbbcc

		var hexValue = get("color_text").children[1].value;

		if (hexValue.length == 3) {
			var expanded = "";
			for (var i=0; i<3; i++)
				expanded += hexValue[i] + hexValue[i];
			hexValue = expanded;
			get("color_text").children[1].value = hexValue;
		}

		else if (hexValue.length < 6) { // not 3 and less than 6, i.e. invalid
			alert("Invalid hex value!");
			return;
		}

		var hex = "#" + hexValue;
		colorPicked = HexStringToRGBString(hex);
	}

	// colorPicked is a RGB string that indicates the color chosen

	// update color
	get("color").style.backgroundColor = colorPicked;
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
			ele_input[i].addEventListener("keypress", this.validateRGB);
			ele_input[i].addEventListener("paste", this.handlePaste.bind(this));
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
		value.addEventListener("keypress", this.validateHex);
		value.addEventListener("paste", this.handlePaste.bind(this));

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

ColorPicker.prototype.validateRGB = function(e) {
	var key = e.which || e.keyCode;
	if (key == 8) // backspace
		return true;
	else if (key < 48 || key > 57) // not a digit
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
	else
		return true;
}

ColorPicker.prototype.validateHex = function(e) {
	var key = e.which || e.keyCode;
	if (key == 8) // backspace
		return true;
	else {
		if (e.target.value.length == 6) // check for length
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		else if (48 <= key && key <= 57) // digit
			return true;
		else if (65 <= key && key <= 70) // [A-F]
			return true;
		else if (97 <= key && key <= 102) // [a-f]
			return true;
		else
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
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

// ------
// save to file
// ------

// area.grid has the hex values (or null) of all the pixels

function initiateDownload(href, filename) {
	var download = document.createElement('a');
	download.href = href;
	download.download = filename;
	download.click();
}

function savePNG() {
	var canvas = document.createElement("canvas");
	canvas.height = area.height;
	canvas.width = area.width;
	var ctx = canvas.getContext("2d");
	for (var i=0; i<area.height; i++) {
		for (var j=0; j<area.width; j++) {
			var value = area.grid[i][j];

			if (value != null) {
				ctx.fillStyle = value;
				ctx.fillRect(j, i, 1, 1);
			}
		}
	}

	// generate PNG
	var href = canvas.toDataURL('image/png');
	var filename = 'test.png';
	initiateDownload(href, filename);

}

// save raw data
// current format is hex values separated by commas for pixels on the same row
// and semicolons for row break
// transparent cells have 'null' as their hex value

function saveRaw(which) {
	var data = "";
	for (var i=0; i<area.height; i++) {
		if (i) data += ";";
		for (var j=0; j<area.width; j++) {
			if (j) data += ",";
			data += area.grid[i][j];
		}
	}

	if (which == "localStorage") {
		window.localStorage.setItem('data', data);
	}
	else if (which == "download") {
		// generate raw hex values of each pixel
		var blob = new Blob([data], {type: 'text/plain'});
		var href = URL.createObjectURL(blob);
		var filename = 'raw.pix';
		initiateDownload(href, filename);

		// allow Blob to be deleted
		URL.revokeObjectURL(href);
	}
}

function loadRaw(which) {
	if (which == "localStorage") {
		var data = window.localStorage.getItem("data");
		handleRaw(data);
	}
	else if (which == "upload") {
		var input = document.createElement("input");
		input.style.display = "none";
		input.type = "file";

		input.addEventListener("change", function(e) {
			// file reference
			var file = e.target.files[0];

			// set up file reader
			var reader = new FileReader();
			reader.readAsText(file, "UTF-8");

			reader.addEventListener("load", function(e) {
				var content = e.target.result;
				handleRaw(content);
			});

		});

		input.click();
	}
}

function handleRaw(data) {
	if (data != null) {
		data = data.split(";");
		var height = data.length;
		for (var i=0; i<height; i++)
			data[i] = data[i].split(',');
		var width = data[0].length;

		// tentative method for loading raw data
		// will be changed once action tracking: undo/redo is implemented
		//
		// current method for painting is only paint(e) where e is a event
		// when undo/redo is implemented there will be a method to paint without event

		for (var i=0; i<height; i++)
			for (var j=0; j<width; j++) {
				// localStorage stringifies stuff
				if (data[i][j] == "null") {
					area.grid[i][j] = null;
					getCell(area.id, i, j).style.backgroundColor = (i+j)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
				}
				else {
					area.grid[i][j] = data[i][j];
					// works but loading from localStorage gives hex value, whereas in normal editing it gives css rgb function
					getCell(area.id, i, j).style.backgroundColor = data[i][j];
				}
			}
	}
}

// ------
// color history
// ------

function ColorHistory(rows, columns) {
	// tentatively hardcoded size
	var element = get("color_history_wrapper");
	var style = getComputedStyle(element);
	this.height = style.height;
	this.width = style.width;

	this.rows = rows;
	this.columns = columns;
	this.grid = init2D(rows, columns, null);
	this.id = "color_history";

	this.colorsLength = rows*columns;
	this.colors = [];
	for (var i=0; i<this.colorsLength; i++) {
		// defined as black: rgb(0, 0, 0) so there will not be any undefined behavior
		this.colors.push("rgb(0, 0, 0)");
	}
}

ColorHistory.prototype.generateHTML = function() {
	// table
	var table = document.createElement("table");
	table.id = this.id;
	table.style.border = "solid white 4px";

	table.style.height = this.height;
	table.style.width = this.width;

	table.style.tableLayout = "fixed";

	for (var i=0; i<this.rows; i++) {
		var row = table.insertRow();
		for (var j=0; j<this.columns; j++) {
			var cell = row.insertCell();
			cell.style.backgroundColor = this.colors[i*this.rows + j];
			cell.style.border = "solid white 4px";
			cell.style.cursor = "pointer";
		}
	}

	table.addEventListener("click", function(e) {
		colorPicker.updateColor(e, "color_history");
	});

	get("color_history_wrapper").appendChild(table);
}

// displays in HTML the current color history
ColorHistory.prototype.updateHTML = function() {
	for (var i=0; i<this.colorsLength; i++) {
		var row = Math.floor(i / this.columns);
		var column = i - row*this.columns;
		getCell("color_history", row, column).style.backgroundColor = this.colors[i];
	}
}

// shifts everything one to the right, last color in the history is effectively deleted from history
// adding to history is only triggered by the following methods:
// 1. pressing add color to history
// 2. eyedropper tool

ColorHistory.prototype.addColor = function() {
	var color = get("color").style.backgroundColor;

	// shift by one to the right
	var prevColor = this.colors[0], curColor = this.colors[0];
	var idx = 1;
	while (idx < this.colorsLength && curColor != color) {
		curColor = this.colors[idx];
		this.colors[idx] = prevColor;
		prevColor = curColor;
		idx++;
	}

	// add new colour
	this.colors[0] = color;
	this.updateHTML();
}

// ------
// main
// ------

var area;

var colorPicker;

var tools;

var cHistory;

window.onload = function() {
	// ------
	// drawing area
	// ------
	area = new DrawArea(32, 32);
	area.generateHTML();

	// initialize pencil color to black, so that if the user tries to draw before selecting a color, it works
	get("color").style.backgroundColor = "rgb(0, 0, 0)";

	// ------
	// color history
	// ------
	cHistory = new ColorHistory(2, 7);
	cHistory.generateHTML();

	// ------
	// color picker
	// ------
	colorPicker = new ColorPicker("color_slider", "color_body", "RGB");
	colorPicker.addEventListeners();
	colorPicker.createDisplayArea();

	// set default value because certain browsers like firefox has autocomplete
	// autocomplete causes the value to stay the same as previously selected before a F5
	get(colorPicker.colorTypeID).value = "RGB";

	get(colorPicker.colorTypeID).addEventListener("change", colorPicker.toggleColorType.bind(colorPicker));
	console.log(cHistory);
	get(colorPicker.buttonID).addEventListener("click", cHistory.addColor.bind(cHistory));

	// ------
	// menu bar / saving functions
	// ------
	get("savePNG").addEventListener("click", function(e) {
		savePNG();
	});
	get("saveRaw").addEventListener("click", function(e) {
		saveRaw("localStorage");
	});
	get("loadRaw").addEventListener("click", function(e) {
		loadRaw("localStorage");
	});
	get("downloadRaw").addEventListener("click", function(e) {
		saveRaw("download");
	});
	get("uploadRaw").addEventListener("click", function(e) {
		loadRaw("upload");
	});

	// ------
	// tools
	// ------
	tools = new ToolWrapper(2, 6);

	// pencil tool
	var pencil = new Tool("pencil", "pencil.png", "Pencil")

	// eyedropper tool
	var eyedropper = new Tool("eyedropper", "eyedropper.png", "Eyedropper tool");

	// select tool
	selectCanvas = new SelectCanvas("selectCanvas");
	var on = selectCanvas.enable.bind(selectCanvas);
	var off = selectCanvas.disable.bind(selectCanvas);
	var select = new Tool("select", "select.png", "Select tool", on, off);

	// move tool
	var moveOn = selectCanvas.moveOn.bind(selectCanvas);
	var moveOff = selectCanvas.moveOff.bind(selectCanvas);
	var move = new Tool("move", "move.png", "Move tool", moveOn, moveOff);

	tools.addTool(pencil);
	tools.addTool(eyedropper);
	tools.addTool(select);
	tools.addTool(move);

	tools.generateHTML();

	// turn on pencil tool
	toggleTool(0);

};