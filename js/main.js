// ------
// drawing area
// ------

function drawArea(height, width) {
	this.height = height;
	this.width = width;
	this.grid = init2D(height, width, null);
	this.id = "display";
	this.drag_paint = false;
	this.drag_erase = false;

	this.edit = false;
}

drawArea.prototype.generateHTML = function() {
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

drawArea.prototype.toggleEdit = function() {
	var table = get(this.id);

	// turn on event listeners
	if (this.edit == false) {
		this.edit = true;

		// coloring event listener
		table.addEventListener("click", paint);

		// erasing event listener
		table.addEventListener("contextmenu", erase);

		// allow dragging for coloring/erasing
		table.addEventListener("mousedown", this.mousedown);
		table.addEventListener("mousemove", this.mousemove);
		table.addEventListener("mouseup", this.mouseup);
		table.addEventListener("mouseleave", this.mouseleave);
	}
	else {
		this.edit = false;

		// coloring event listener
		table.removeEventListener("click", paint);

		// erasing event listener
		table.removeEventListener("contextmenu", erase);

		// allow dragging for coloring/erasing
		table.removeEventListener("mousedown", this.mousedown);
		table.removeEventListener("mousemove", this.mousemove);
		table.removeEventListener("mouseup", this.mouseup);
		table.removeEventListener("mouseleave", this.mouseleave);
	}
}

drawArea.prototype.eyeDropper = function(e) {
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (area.grid[row][column] == null) return;

	updateColor(e, "eyeDropper");
	cHistory.addColor(e, "eyeDropper");
}

function RGBStringToHexString(string) {
	var split = string.split(", ");
	var r = parseInt(split[0].substring(4)).toString(16),
		g = parseInt(split[1]).toString(16);
		b = parseInt(split[2].substring(0, split[2].length-1)).toString(16);

	if (r.length == 1) r = "0" + r;
	if (g.length == 1) g = "0" + g;
	if (b.length == 1) b = "0" + b;

	return "#" + r + g + b;
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

drawArea.prototype.mousedown = function(e) {
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

drawArea.prototype.mousemove = function(e) {
	if (this.drag_paint)
		paint(e);
	if (this.drag_erase)
		erase(e);
}

drawArea.prototype.mouseup = function(e) {
	if (e.which == 1 || e.which == 3) {
		this.drag_paint = false;
		this.drag_erase = false;
	}
	else if (e.which == 2) {
		// middle click (eyeDropper)
		area.eyeDropper(e);
	}
}

drawArea.prototype.mouseleave = function(e) {
	this.drag_paint = false;
	this.drag_erase = false;
}

// ------
// color picker
// ------

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
	// step 2: gradient from left to right of white (right is less white)
	// step 3: gradient from top to bottom of black (down is more black)

	this.ctx.fillStyle = color;
	this.ctx.fillRect(0, 0, this.width, this.height);

	var white = ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)'];
	var whiteGradient = this.LinearGradient(white, "horizontal");
	this.ctx.fillStyle = whiteGradient;
	this.ctx.fillRect(0, 0, this.width, this.height);

	var black = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 1)'];
	var blackGradient = this.LinearGradient(black, "vertical");
	this.ctx.fillStyle = whiteGradient;
	this.ctx.fillRect(0, 0, this.width, this.height);
}

function updateColorBody(e) {
	x = e.offsetX;
	y = e.offsetY;
	var data = slider.ctx.getImageData(x, y, 1, 1).data;
	var color = 'rgba(' + data[0] + ',' + data[1] + ',' + data[2] + ',1)';
	body.TwoDimGradient(color);
}

function updateColor(e, source) {
	if (source == "color_picker") {
		x = e.offsetX;
		y = e.offsetY;
		var data = body.ctx.getImageData(x, y, 1, 1).data;
		var color = 'rgba(' + data[0] + ',' + data[1] + ',' + data[2] + ',1)';
	}
	else if (source == "color_history" || source == "eyeDropper") {
		var color = e.target.style.backgroundColor;
	}
	get("color").style.backgroundColor = color;
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

function saveRaw() {
	var data = "";
	for (var i=0; i<area.height; i++) {
		if (i) data += ";";
		for (var j=0; j<area.width; j++) {
			if (j) data += ",";
			data += area.grid[i][j];
		}
	}

	// generate raw hex values of each pixel
	var blob = new Blob([data], {type: 'text/plain'});
	var href = URL.createObjectURL(blob);
	var filename = 'raw.pix';
	//initiateDownload(href, filename);

	window.localStorage.setItem('data', data);

	// allow Blob to be deleted
	URL.revokeObjectURL(href);

}

function loadRaw() {
	var data = window.localStorage.getItem("data");
	var height, width;
	if (data != null) {
		data = data.split(";");
		height = data.length;
		for (var i=0; i<height; i++)
			data[i] = data[i].split(',');
		width = data[0].length;

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

function colorHistory(rows, columns) {
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

colorHistory.prototype.generateHTML = function() {
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
		updateColor(e, "color_history");
		cHistory.addColor(e, "color_history");
	});

	get("color_history_wrapper").appendChild(table);
}

// displays in HTML the current color history
colorHistory.prototype.updateHTML = function() {
	for (var i=0; i<this.colorsLength; i++) {
		var row = Math.floor(i / this.columns);
		var column = i - row*this.columns;
		getCell("color_history", row, column).style.backgroundColor = this.colors[i];
	}
}

// shifts everything one to the right, last color in the history is effectively deleted from history
// only triggers on mouseup as dragging (mousemove) will cause a lot of colours to be added and history will change very quickly

colorHistory.prototype.addColor = function(e, source) {
	var color;

	if (source == "color_picker")
		color = get("color").style.backgroundColor;
	else if (source == "color_history" || source == "eyeDropper")
		color = e.target.style.backgroundColor;

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
// tools
// ------

function toolWrapper(rows, columns) {
	// tentatively hardcoded size
	var element = get("tool_wrapper");
	var style = getComputedStyle(element);
	this.height = style.height;
	this.width = style.width;

	this.rows = rows;
	this.columns = columns;
	this.grid = init2D(rows, columns, null);
	this.id = "tools";

	// add tools here
}

toolWrapper.prototype.generateHTML = function() {
	// table
	var table = document.createElement("table");
	table.id = this.id;

	table.style.height = this.height;
	table.style.width = this.width;

	table.style.tableLayout = "fixed";

	for (var i=0; i<this.rows; i++) {
		var row = table.insertRow();
		for (var j=0; j<this.columns; j++) {
			var cell = row.insertCell();
			cell.style.cursor = "pointer";
		}
	}

	get("tool_wrapper").appendChild(table);
}

// ------
// main
// ------

var area;

var slider, body;

var cHistory;

window.onload = function() {
	area = new drawArea(16, 16);
	area.generateHTML();

	// initialize pencil color to black, so that if the user tries to draw before selecting a color, it works
	get("color").style.backgroundColor = "rgb(0, 0, 0)";

	tools = new toolWrapper(4, 6);
	tools.generateHTML();

	slider = new CanvasWrapper("color_slider");
	var colors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 255, 0, 1)", "rgba(0, 255, 255, 1)", "rgba(0, 0, 255, 1)", "rgba(255, 0, 255, 1)", "rgba(255, 0, 0, 1)"];
	slider.LinearGradient(colors, "vertical");

	body = new CanvasWrapper("color_body");

	// add event listener to change the color gradient displayed in body
	slider.HTML.addEventListener("click", function(e) {
		updateColorBody(e);
	});

	// allow dragging on the slider
	slider.HTML.addEventListener("mousedown", function(e) {
		this.drag = true;
		updateColorBody(e);
	});
	slider.HTML.addEventListener("mousemove", function(e) {
		if (this.drag)
			updateColorBody(e);
	});
	slider.HTML.addEventListener("mouseup", function(e) {
		this.drag = false;
	});
	slider.HTML.addEventListener("mouseleave", function(e) {
		this.drag = false;
	});

	// add event listener to change the color displayed
	body.HTML.addEventListener("click", function(e) {
		updateColor(e, "color_picker");
	})

	// allow dragging on the body
	body.HTML.addEventListener("mousedown", function(e) {
		this.drag = true;
		updateColor(e, "color_picker");
	});
	body.HTML.addEventListener("mousemove", function(e) {
		if (this.drag)
			updateColor(e, "color_picker");
	});
	body.HTML.addEventListener("mouseup", function(e) {
		this.drag = false;
		cHistory.addColor(e, "color_picker");
	});
	body.HTML.addEventListener("mouseleave", function(e) {
		this.drag = false;
	});

	// color history
	cHistory = new colorHistory(2, 7);
	cHistory.generateHTML();

	// menu bar
	get("savePNG").addEventListener("click", function(e) {
		savePNG();
	});
	get("saveRaw").addEventListener("click", function(e) {
		saveRaw();
	});
	get("loadRaw").addEventListener("click", function(e) {
		loadRaw();
	});

};