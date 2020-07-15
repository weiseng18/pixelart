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

	// floodfill options, currently up/down/left/right
	this.deltaLength = 4;
	this.deltaY = [-1, 1, 0, 0];
	this.deltaX = [0, 0, -1, 1];
	this.bucketEnabled = false;
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
	else if (area.tool == 6) {
		area.bucket(e);
		actionreplay.addState();
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
			// only add state when mouseup
			actionreplay.addState();
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
// bucket tool drawArea functions
// ------

// check for out of bounds (this.grid, i.e. 0 <= y <= this.height and 0 <= x <= this.width)
DrawArea.prototype.isOutOfBounds = function(y, x) {
	return (y < 0 || y >= this.height || x < 0 || x >= this.width);
}

DrawArea.prototype.bucket = function(e) {
	var color = get("color").style.backgroundColor;
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	// this variable stores what the original color of the selected cell is
	// bucket tool fills all squares connected directly/indirectly by a whole edge
	// that are the same color as the initial cell.
	var initial = area.grid[row][column];

	this.floodfill(row, column, color, initial);

	// update the displayed grid
	this.updateGrid();

	toggleTool(6);
}

DrawArea.prototype.floodfill = function(y, x, color, initial) {
	area.grid[y][x] = color;
	for (var i=0; i<this.deltaLength; i++) {
		var newY = y + this.deltaY[i];
		var newX = x + this.deltaX[i];
		if (!this.isOutOfBounds(newY, newX) && area.grid[newY][newX] == initial)
			this.floodfill(newY, newX, color, initial);
	}
}

// ------
// shared drawArea functions
// ------

DrawArea.prototype.updateGrid = function() {
	for (var i=0; i<this.height; i++)
		for (var j=0; j<this.width; j++) {
			if (this.grid[i][j] == null)
				getCell(this.id, i, j).style.backgroundColor = (i+j)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
			else
				getCell(this.id, i, j).style.backgroundColor = this.grid[i][j];
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

// undo and redo
var actionreplay;

window.onload = function() {
	// ------
	// drawing area
	// ------
	area = new DrawArea(32, 32);
	area.generateHTML();

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

	// initialize pencil color to black, so that if the user tries to draw before selecting a color, it works
	get("color").style.backgroundColor = "rgb(0, 0, 0)";
	colorPicker.updateColorValue("rgb(0, 0, 0)", "color_history");

	// set default value because certain browsers like firefox has autocomplete
	// autocomplete causes the value to stay the same as previously selected before a F5
	get(colorPicker.colorTypeID).value = "RGB";

	get(colorPicker.colorTypeID).addEventListener("change", colorPicker.toggleColorType.bind(colorPicker));
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
	// history
	// ------

	actionreplay = new History();

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

	// undo and redo tools
	var undoBIND = actionreplay.undo.bind(actionreplay);
	var redoBIND = actionreplay.redo.bind(actionreplay);

	var undo = new Tool("undo", "undo.png", "Undo tool", undoBIND);
	var redo = new Tool("redo", "redo.png", "Redo tool", redoBIND);

	// bucket tool
	var bucket = new Tool("bucket", "bucket.png", "Bucket tool");

	tools.addTool(pencil);
	tools.addTool(eyedropper);
	tools.addTool(select);
	tools.addTool(move);
	tools.addTool(undo);
	tools.addTool(redo);
	tools.addTool(bucket);

	tools.generateHTML();

	// turn on pencil tool
	toggleTool(0);

};