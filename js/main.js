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

	this.tool = null;

	// cell size
	this.cellHeight = null;
	this.cellWidth = null;

	// range painting
	this.points = null;

	// drag_paint
	this.previousCell = null;

	// floodfill options, currently up/down/left/right
	this.deltaLength = 4;
	this.deltaY = [-1, 1, 0, 0];
	this.deltaX = [0, 0, -1, 1];
	this.bucketEnabled = false;

	// line tool
	this.p1 = null;
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

	table.style.cursor = "none";

	// calculate the size of a cell
	this.cellHeight = removePX(table.style.height) / this.height;
	this.cellWidth = removePX(table.style.width) / this.width;

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
		table.addEventListener("click", this.click.bind(this));

		// erasing event listener
		table.addEventListener("contextmenu", this.contextmenu.bind(this));

		// allow dragging for coloring/erasing
		table.addEventListener("mousedown", this.mousedown.bind(this));
		table.addEventListener("mousemove", this.mousemove.bind(this));
		table.addEventListener("mouseup", this.mouseup.bind(this));
		table.addEventListener("mouseleave", this.mouseleave.bind(this));
	}
	else {
		this.edit = false;

		// coloring event listener
		table.removeEventListener("click", this.click.bind(this));

		// erasing event listener
		table.removeEventListener("contextmenu", this.contextmenu.bind(this));

		// allow dragging for coloring/erasing
		table.removeEventListener("mousedown", this.mousedown.bind(this));
		table.removeEventListener("mousemove", this.mousemove.bind(this));
		table.removeEventListener("mouseup", this.mouseup.bind(this));
		table.removeEventListener("mouseleave", this.mouseleave.bind(this));
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

// takes input points, the output of this.drawCursor()
// points is the clientX and clientY of the top left and bottom right of the area to be painted
DrawArea.prototype.paintRange = function(points, eventType, isErase) {	
	var color = get("color").style.backgroundColor;

	// step 1: find the nearest cell to the topLeft (points[0]), and the bottomRight (points[1])

	// step 1a: get the inner points of the box
	points[0].x += box.borderSize;
	points[0].y += box.borderSize;
	points[1].x -= box.borderSize;
	points[1].y -= box.borderSize;

	// step 1b: convert coordinates into row, column
	points[0].x = Math.round(points[0].x / this.cellWidth);
	points[0].y = Math.round(points[0].y / this.cellHeight);
	points[1].x = Math.round(points[1].x / this.cellWidth) - 1;
	points[1].y = Math.round(points[1].y / this.cellHeight) - 1;

	// step 2: check if this function was triggered by a mousemove
	// if triggered by a mousemove, draw lines instead of filling in cells to prevent issue #4
	if (eventType == "mousemove" && this.points != null) {
		// step 3: paint with lines
		for (var i=0; i<=points[1].y - points[0].y; i++)
			for (var j=0; j<=points[1].x - points[0].x; j++) {
				var prevPoint = {x:this.points[0].x + j, y:this.points[0].y + i};
				var currPoint = {x:points[0].x + j, y:points[0].y + i};
				this.drawLine(prevPoint, currPoint, isErase);
			}
	}
	else {
		// step 3: paint
		for (var i=points[0].y; i<=points[1].y; i++)
			for (var j=points[0].x; j<=points[1].x; j++) {
				if (isErase)
					this.paint({x:j, y:i}, null, true);
				else
					this.paint({x:j, y:i}, color, true);
			}
	}

	// step 4: update the previously drawn range, to be used in step 2
	this.points = _.cloneDeep(points);
}

DrawArea.prototype.click = function(e) {
	if (this.tool == 0) {
		// draw cursor box
		var points = box.drawCursor(e);
		this.paintRange(points, "click", false);
	}
	else if (this.tool == 1) {
		eyeDropper(e);
		toggleTool(this.tool);
	}
	else if (this.tool == 6) {
		this.bucket(e);
		actionreplay.addState();
	}
	else if (this.tool == 7) {
		this.lineHelper(e);
	}
}

DrawArea.prototype.contextmenu = function(e) {
	if (this.tool == 0) {
		e.preventDefault();
		// draw cursor box
		var points = box.drawCursor(e);
		this.paintRange(points, "click", true);
	}
}

DrawArea.prototype.mousedown = function(e) {
	if (this.tool == 0) {
		if (e.which == 1) {
			this.drag_paint = true;
			var points = box.drawCursor(e);
			this.paintRange(points, "mousedown", false);
		}
		else if (e.which == 3) {
			e.preventDefault();
			this.drag_erase = true;
			this.paintRange(points, "mousedown", true);
		}
	}
}

DrawArea.prototype.mousemove = function(e) {
	if (this.tool == 0) {
		// draw cursor box
		var points = box.drawCursor(e);
		if (this.drag_paint)
			this.paintRange(points, "mousemove", false);
		if (this.drag_erase)
			this.paintRange(points, "mousemove", true);
	}
	else if (this.tool == 7)
		if (this.p1 != null) {
			this.lineHover(e);
		}
}

DrawArea.prototype.mouseup = function(e) {
	if (this.tool == 0) {
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
	if (this.tool == 0) {
		this.drag_paint = false;
		this.drag_erase = false;

		box.clearCanvas();
	}
}

// ------
// drawing pencil size
// ------

function Box(id, size) {
	this.id = id;
	this.enabled = false;
	this.borderSize = 1;

	this.pencilSize = size;

	// stores HTML element for size chooser
	this.sizeChooserID = "sizeChooser";
	this.sizeChooser = this.generateSizeChooser();

	this.cellHeight = area.cellHeight;
	this.cellWidth = area.cellWidth;

	this.boxHeight = this.pencilSize * this.cellHeight;
	this.boxWidth = this.pencilSize * this.cellWidth;

	this.ele = this.generateBoxHTML(id);
}

Box.prototype.updatePencilSize = function(e) {
	var size = get(this.sizeChooserID).value;
	this.pencilSize = size;
	this.boxHeight = this.pencilSize * this.cellHeight;
	this.boxWidth = this.pencilSize * this.cellWidth;
}

Box.prototype.generateSizeChooser = function() {
	var div = document.createElement("div");
	div.id = "sizeChooser_wrapper";
	div.style.zIndex = "100";

	div.style.padding = "5px";
	div.style.margin = "0";

	div.style.position = "absolute";
	div.style.top = "8%";
	div.style.left = "25%";

	div.style.width = "250px";
	div.style.height = "6vh";

	div.style.backgroundColor = "#ffffff";

	div.style.display = "flex";

	var text = document.createElement("div");
	text.innerHTML = "Pencil/Eraser Size:";
	text.style.margin = "10px auto";

	var input = document.createElement("input");
	input.id = this.sizeChooserID;
	input.type = "number";
	input.min = 1;
	input.max = Math.min(area.height, area.width) / 2;
	input.style.width = "40px";
	input.style.margin = "5px auto";

	// set default value for browsers that have autocomplete
	input.value = 1;

	// event listener
	input.addEventListener("change", this.updatePencilSize.bind(this));

	div.appendChild(text);
	div.appendChild(input);

	return div;
}

Box.prototype.generateBoxHTML = function(id) {
	var ele = document.createElement("canvas");
	ele.id = id;

	var boundingRect = get(area.id).getBoundingClientRect();

	ele.style.position = "fixed";
	ele.style.top = boundingRect.top - this.borderSize + "px";
	ele.style.left = boundingRect.left - this.borderSize + "px";

	// to ensure that it floats up
	ele.style.zIndex = "100";

	// to ensure it does not interfere with js events
	// the purpose of this is only to draw the pencil size
	ele.style.pointerEvents = "none";

	// for more precise numbers
	ele.height = removePX(get(area.id).style.height) + this.borderSize*2;
	ele.width = removePX(get(area.id).style.width) + this.borderSize*2;

	return ele;
}

Box.prototype.isOutOfBounds = function(p) {
	if (p.x < 0 || p.y < 0 || p.x >= this.ele.width || p.y >= this.ele.height) return true;
}

Box.prototype.drawCursor = function(e) {
	var boundingRect = get(area.id).getBoundingClientRect();
	var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};

	var topLeft = {x:p.x - this.boxWidth / 2, y:p.y - this.boxHeight / 2};
	var bottomRight = {x:topLeft.x + this.boxWidth + 2*this.borderSize, y:topLeft.y + this.boxHeight + 2*this.borderSize};
	if (this.isOutOfBounds(topLeft) || this.isOutOfBounds(bottomRight)) return;

	var c = get(this.id);
	var ctx = c.getContext("2d");
	ctx.lineWidth = this.borderSize;
	ctx.setLineDash([2, 1]);

	this.clearCanvas();

	ctx.strokeRect(topLeft.x, topLeft.y, this.boxWidth, this.boxHeight);
	return [topLeft, bottomRight];
}

Box.prototype.clearCanvas = function() {
	var c = get(this.id);
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
}

Box.prototype.enable = function(e) {
	document.body.appendChild(this.ele);
	document.body.appendChild(this.sizeChooser);
}

Box.prototype.disable = function(e) {
	this.clearCanvas();
	document.body.removeChild(this.ele);
	document.body.removeChild(this.sizeChooser);
}

// ------
// move tool drawArea functions
// ------

DrawArea.prototype.writeSelection = function(selection, p1, p2) {
	// p1, p2 is topleft, bottomright of new location for selection
	// as the function name suggests, this only writes the selection to the HTML, but not to the actual grid.
	// this triggers on mousemove and only displays what the moved selection will look like

	var width = p2.x - p1.x + 1;
	var height = p2.y - p1.y + 1;

	// update new location for selection
	for (var y=p1.y; y<=p2.y; y++)
		for (var x=p1.x; x<=p2.x; x++)
			if (selection[y - p1.y][x - p1.x] != null)
				this.paint({x:x, y:y}, selection[y - p1.y][x - p1.x], false);
}

// write variable checks if you are just writing to the HTML grid (temporarily) or writing to area.grid (permanently) as well
// the temporary is for mousemove for select tool
// erase tool is also combined in here
DrawArea.prototype.paint = function(p, color, write) {
	// update HTML
	if (color == null) // erase
		getCell("display", p.y, p.x).style.backgroundColor = (p.y+p.x)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
	else
		getCell("display", p.y, p.x).style.backgroundColor = color;

	// update area.grid
	if (write) area.grid[p.y][p.x] = color;
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
// line tool drawArea functions
// ------

// the method used is Bresenham's line algorithm
// consider a point in the center of a 2D plane, p1
// WLOG let the 2D plane be the Cartesian plane and let p1 be (0, 0).
// Draw the lines y=0, x=0, y=x, y=-x. This will divide the plane into 8 equal octants.
// p2 can lie in any of the 8 octets, and this corresponds to the 8 cases of (p1, p2) that this algorithm considers.
// 
// let f(x, y) = ax + by + c = 0 be the Cartesian line that p1 and p2 both lie on,
// where a, b, c are real constants.
//
// the algorithm needs to know if |delta x| or |delta y| is larger
// delta x is defined as p2.x - p1.x
// delta y is defined as p2.y - p1.y
//
// if |delta x| is larger, then in the line drawn from p1 to p2, every x has only one y.
// this y is solved from f(x, y) = 0, and rounded to the nearest integer.
// if |delta y| is larger, then in the line drawn from p1 to p2, every y has only one x.
// this x is solved from f(x, y) = 0, and rounded to the nearest integer.
//
// let octet 1 be the octet between the line y=0 for x>=0 and the line y=-x for x>=0.
// let the following octets be given a number in a clockwise fashion.
//
// # | dx  | dy  | larger
// 1 | +ve | +ve |   dx
// 2 | +ve | +ve |   dy
// 3 | -ve | +ve |   dy
// 4 | -ve | +ve |   dx
// 5 | -ve | -ve |   dx
// 6 | -ve | -ve |   dy
// 7 | +ve | -ve |   dy
// 8 | +ve | -ve |   dx
//
// number of cases is 8 but can be reduced to 4
// case i and i+4 is symmetrical, if the points for either case is swapped.
//
// the general equation is given by
//
//    y - p1.y        x - p1.x
// ------------- = -------------
//  p2.y - p1.y      p2.x - p1.x

// take in 2 points and return an array of the points to draw (on the grid)
DrawArea.prototype.generatePoints = function(p1, p2) {
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	// first check is to filter out cases 5-8 so that p1, p2 can be swapped/
	// this will reduce the number of cases to 4
	// from the case listing above, dy < 0 is the similarity between cases 5-8.
	if (dy < 0) {
		[p1, p2] = [p2, p1];
		dx *= -1;
		dy *= -1;
	}

	var points = [];
	// now the number of cases is 4
	// case 1 or 2
	if (dx > 0) {
		// no need for absolute sign as both are positive
		if (dx >= dy) {
			var m = dy/dx || 0;
			var c = m * -p1.x + p1.y;
			for (var x=p1.x; x<=p2.x; x++) {
				var y = Math.round(m*x + c);
				points.push({x:x, y:y});
			}
		}
		else {
			var m = dx/dy || 0;
			var c = m * -p1.y + p1.x;
			for (var y = p1.y; y<=p2.y; y++) {
				var x = Math.round(m*y + c);
				points.push({x:x, y:y});
			}
		}
	}
	else {
		if (dy >= -dx) {
			var m = dx/dy || 0;
			var c = m * -p1.y + p1.x;
			for (var y = p1.y; y<=p2.y; y++) {
				var x = Math.round(m*y + c);
				points.push({x:x, y:y});
			}
		}
		else {
			var m = dy/dx || 0;
			var c = m * -p1.x + p1.y;
			for (var x=p1.x; x>=p2.x; x--) {
				var y = Math.round(m*x + c);
				points.push({x:x, y:y});
			}
		}
	}
	return points;
}

DrawArea.prototype.drawLine = function(p1, p2, isErase) {
	var color = get("color").style.backgroundColor;

	if (isErase)  // overwrite color during erase
		color = null;

	this.updateGrid();
	var points = this.generatePoints(p1, p2);
	for (var i=0; i<points.length; i++) {
		var x = points[i].x;
		var y = points[i].y;
		this.paint({x:x, y:y}, color, true);
	}
}

// helper function to get first point and wait for second point
DrawArea.prototype.lineHelper = function(e) {
	var color = get("color").style.backgroundColor;
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (this.p1 == null) {
		this.p1 = {x:column, y:row};
		getCell("display", this.p1.y, this.p1.x).style.backgroundColor = color;
		actionreplay.addState(true);
	}
	else {
		actionreplay.undo();
		var p2 = {x:column, y:row};
		this.drawLine(this.p1, p2);
		this.p1 = null;
		actionreplay.addState();
	}
}

// draw line from p1 to hovered position
DrawArea.prototype.lineHover = function(e) {
	var color = get("color").style.backgroundColor;
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (row == undefined || column == undefined) return;

	var p2 = {x:column, y:row};
	var points = this.generatePoints(this.p1, p2);

	this.updateGrid();
	for (var i=0; i<points.length; i++)
		getCell("display", points[i].y, points[i].x).style.backgroundColor = color;
	
}

DrawArea.prototype.lineEnable = function() {
	get(this.id).style.cursor = "pointer";
}

DrawArea.prototype.lineDisable = function() {
	get(this.id).style.cursor = "none";
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

var area, box;

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
	box = new Box("cursorBox", 1);

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
	var boxEnable = box.enable.bind(box);
	var boxDisable = box.disable.bind(box);
	var pencil = new Tool("pencil", "pencil.png", "Pencil", boxEnable, boxDisable);

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

	// line tool
	var lineOn = area.lineEnable.bind(area);
	var lineOff = area.lineDisable.bind(area);
	var line = new Tool("line", "line.png", "Line tool<br><strong>Click</strong> two points to draw a line", lineOn, lineOff);

	tools.addTool(pencil);
	tools.addTool(eyedropper);
	tools.addTool(select);
	tools.addTool(move);
	tools.addTool(undo);
	tools.addTool(redo);
	tools.addTool(bucket);
	tools.addTool(line);

	tools.generateHTML();

	get(tools.id).addEventListener("dragstart", function(e) {
		e.preventDefault();
	});
	get(tools.id).addEventListener("contextmenu", function(e) {
		e.preventDefault();
	});

	// turn on pencil tool
	toggleTool(0);

};