// ------
// tools
// ------

function ToolWrapper(rows, columns) {
	this.wrapperID = "tool_wrapper";
	var element = get(this.wrapperID);
	var style = getComputedStyle(element);

	// these two variables are numbers but the unit is px
	this.height = removePX(style.height);
	this.width = removePX(style.width);

	this.rows = rows;
	this.columns = columns;
	this.grid = init2D(rows, columns, null);
	this.id = "tools";

	// add tools here
	this.items = [];
	this.total = 0;
}

ToolWrapper.prototype.addTool = function(Tool) {
	this.items.push(Tool);
	this.total++;
}

ToolWrapper.prototype.generateHTML = function() {
	// table
	var table = document.createElement("table");
	table.id = this.id;

	table.style.height = this.height + "px";
	table.style.width = this.width + "px";

	table.style.tableLayout = "fixed";

	table.style.borderSpacing = 0;

	for (var i=0; i<this.rows; i++) {
		var row = table.insertRow();

		// -4 to account for the 2px border
		row.style.height = (this.height / this.rows - 4) + "px";

		for (var j=0; j<this.columns; j++) {
			var cell = row.insertCell();

			cell.style.border = "solid white 2px";

			var idx = i*this.columns + j;
			if (idx < this.total) {
				cell.style.cursor = "pointer";

				cell.addEventListener("click", this.items[idx].click);
				cell.addEventListener("mouseover", this.mouseover.bind(this));
				cell.addEventListener("mouseout", this.mouseout.bind(this));

				var img = new Image();
				img.src = this.items[idx].iconSrc;
				img.style.display = "block";
				img.style.margin = "auto auto";

				cell.appendChild(img);
			}
		}
	}

	get(this.wrapperID).appendChild(table);
}

ToolWrapper.prototype.drawTooltip = function(element, idx) {
	var boundingRect = element.getBoundingClientRect();
	var topLeft = {x:boundingRect.right - 20, y:boundingRect.bottom + 5};
	var tooltipBox = document.createElement("div");

	tooltipBox.id = "tooltip_" + idx;

	tooltipBox.style.position = "fixed";
	tooltipBox.style.top = topLeft.y + "px";
	tooltipBox.style.left = topLeft.x + "px";

	tooltipBox.style.padding = "5px";

	tooltipBox.style.border = "solid black 2px";
	tooltipBox.style.backgroundColor = "#FFFB7A";

	tooltipBox.style.zIndex = "200";

	var tooltip = tools.items[idx].tooltip;
	var wrapper = document.createElement("span");
	wrapper.innerHTML = tooltip;

	tooltipBox.appendChild(wrapper);

	document.body.appendChild(tooltipBox);
}

ToolWrapper.prototype.removeTooltip = function(idx) {
	get("tooltip_" + idx).remove();
}

// call this method when there are any changes to tools
// actual changes to tools must be made before calling this method

ToolWrapper.prototype.updateTools = function() {
	get(this.wrapperID).innerHTML = "";

	this.generateHTML();

	get(this.id).addEventListener("dragstart", function(e) {
		e.preventDefault();
	});
	get(this.id).addEventListener("contextmenu", function(e) {
		e.preventDefault();
	});

	// turn on pencil tool
	toggleTool(0);
}

ToolWrapper.prototype.mouseover = function(e) {
	// change e.target <td> to e.target <img>
	var cell = e.target.children[0] != undefined ? e.target : e.target.parentElement;

	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;
	var idx = row * tools.columns + column;

	// draw tooltip
	this.drawTooltip(cell, idx);

	// taken from toggleTool()
	if (isNaN(idx) || idx == undefined || idx == null) return;
	if (idx >= tools.total) return;

	// check if hover effect should be occuring
	if (area.tool != idx) {
		getCell("tools", row, column).style.border = "solid 2px #A3DAFF";
	}
}

ToolWrapper.prototype.mouseout = function(e) {
	// change e.target <td> to e.target <img>
	var cell = e.target.children[0] != undefined ? e.target : e.target.parentElement;

	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;
	var idx = row * tools.columns + column;

	// taken from toggleTool()
	if (isNaN(idx) || idx == undefined || idx == null) return;
	if (idx >= tools.total) return;

	this.removeTooltip(idx);

	// check if hover effect should be occuring
	if (area.tool != idx) {
		getCell("tools", row, column).style.border = "solid 2px white";
	}
}

function toggleTool(idx) {
	// set area.tool to idx unless it is already idx, which means to toggle it off

	// some clicking issue to do with e.target
	// currently the method is to use e.target and find the cell chosen, but maybe clicking in between cells can cause problems

	if (isNaN(idx) || idx == undefined || idx == null) return;

	// disable first
	if (idx >= tools.total) return;

	var row = Math.floor(idx / tools.columns);
	var column = idx - row*tools.columns;

	// initial
	if (area.tool == null) {
		area.tool = 0;

		getCell("tools", 0, 0).style.backgroundColor = "#3DB1FF";
		getCell("tools", 0, 0).style.border = "solid 2px #A3DAFF";

		if (tools.items[idx].on != undefined)
			tools.items[idx].on();
		return;
	}

	if (area.tool == idx) {
		if (idx == 0) return;

		// clicking the same icon
		// resetting to 0, i.e. pencil tool
		getCell("tools", row, column).style.backgroundColor = "";
		getCell("tools", row, column).style.border = "solid 2px white";

		getCell("tools", 0, 0).style.backgroundColor = "#3DB1FF";
		getCell("tools", 0, 0).style.border = "solid 2px #A3DAFF";

		area.tool = 0;

		if (tools.items[0].on != undefined)
			tools.items[0].on();

		if (tools.items[idx].off != undefined)
			tools.items[idx].off();
	}
	else {
		var pRow = Math.floor(area.tool / tools.columns);
		var pColumn = area.tool - pRow*tools.columns;

		var pIDX = pRow*tools.columns + pColumn;

		// change directly from pencil tool to move tool
		// this should not be allowed as there is no selection to move.
		if (pIDX == 0 && idx == 3) {
			alert("No selection found");
			return;
		}

		getCell("tools", pRow, pColumn).style.backgroundColor = "";
		getCell("tools", pRow, pColumn).style.border = "solid 2px white";

		getCell("tools", row, column).style.backgroundColor = "#3DB1FF";
		getCell("tools", row, column).style.border = "solid 2px #A3DAFF";

		area.tool = idx;

		if (tools.items[pIDX].off != undefined) {
			// change directly from select tool to move tool
			// the canvas should remain and the selection should remain so that the user can interact
			// but the user should not be able to amend this selection, unless explicitly activating select tool to re-select
			if (pIDX == 2 && idx == 3) {/*pass*/}
			else
				tools.items[pIDX].off();
		}

		if (tools.items[idx].on != undefined)
			tools.items[idx].on();
	}
}

function Tool(name, iconSrc, tooltip, on, off) {
	this.name = name;
	this.iconSrc = "img/" + iconSrc;
	this.click = function(e) {
		var cell = e.target.children[0] != undefined ? e.target : e.target.parentElement;
		var column = cell.cellIndex;
		var row = cell.parentElement.rowIndex;
		var idx = row * tools.columns + column;

		toggleTool(idx);
	}
	this.on = on;
	this.off = off;

	this.tooltip = tooltip;
}

// ------
// eyedropper
// ------

function eyeDropper(e) {
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (area.grid[row][column] == null) return;

	colorPicker.updateColor(e, "eyeDropper");
}

// ------
// select tool + move tool
// ------

function SelectCanvas(id) {
	this.id = id;

	this.enabled = false;

	// constant to be used to ensure that this "extra" width and height will extend out of the drawing area
	this.borderSize = 4;

	// top left and bottom right of the selected rectangle
	// in the move tool, this only changes on mouseup event
	this.topLeft = null;
	this.bottomRight = null;

	// cell top left and bottom right, will correspond to this.grid
	this.cellTopLeft = null;
	this.cellBottomRight = null;
	this.selection = null;

	// variable to store the mousedown point for move tool
	// if it is null that means no move is in process
	this.moveStart = null;
	this.newTopLeft = null;
	this.newBottomRight = null;

	// selection top left and bottom right
	// used to delete the original selection upon moving
	this.selectionTopLeft = null;

	// element always has to be ready for append and remove
	// this has to be below this.borderSize so that this.borderSize is defined and can be used in this method
	this.ele = this.generateHTML();
}

SelectCanvas.prototype.generateHTML = function() {
	var div = document.createElement("div");
	div.id = "selectCanvas_wrapper";
	div.style.width = "75%";
	div.style.height = "92vh";
	div.style.zIndex = "100";

	div.style.padding = "0";
	div.style.margin = "0";

	div.style.position = "absolute";
	div.style.top = "8%";
	div.style.left = "25%";

	var ele = document.createElement("canvas");
	ele.id = "selectCanvas";

	var boundingRect = get(area.id).getBoundingClientRect();

	ele.style.position = "fixed";
	ele.style.top = boundingRect.top - this.borderSize + "px";
	ele.style.left = boundingRect.left - this.borderSize + "px";

	// to ensure that it floats up
	ele.style.zIndex = "100";

	// for more precise numbers
	ele.height = removePX(get(area.id).style.height) + this.borderSize*2;
	ele.width = removePX(get(area.id).style.width) + this.borderSize*2;

	div.appendChild(ele);

	return div;
}

SelectCanvas.prototype.enable = function() {
	document.body.appendChild(this.ele);

	this.mousedownBIND = this.mousedown.bind(this);
	this.mousemoveBIND = this.mousemove.bind(this);
	this.mouseupBIND = this.mouseup.bind(this);

	// add event listeners once the element is added to DOM
	get(this.ele.id).addEventListener("mousedown", this.mousedownBIND);
	get(this.ele.id).addEventListener("mousemove", this.mousemoveBIND);
	get(this.ele.id).addEventListener("mouseup", this.mouseupBIND);
}

SelectCanvas.prototype.disable = function() {
	// remove event listeners before the element is removed from DOM
	get(this.ele.id).removeEventListener("mousedown", this.mousedownBIND);
	get(this.ele.id).removeEventListener("mousemove", this.mousemoveBIND);
	get(this.ele.id).removeEventListener("mouseup", this.mouseupBIND);

	this.clearCanvas();

	// reset selection
	this.selection = null;

	get(this.ele.id).remove();
}

SelectCanvas.prototype.moveOn = function() {
	get(this.ele.id).children[0].style.cursor = "grab";
}

SelectCanvas.prototype.moveOff = function() {
	get(this.ele.id).children[0].style.cursor = "crosshair";
	this.disable();
}

// draws the select area
// assumes p1.x < p2.x and p1.y < p2.y, i.e. p1 is the top left and p2 is the bottom right of the rectangle.
SelectCanvas.prototype.drawSelectArea = function(x1, x2) {

	var p1 = _.cloneDeep(x1);
	var p2 = _.cloneDeep(x2);
	// checks to convert p1, p2 into the top left, bottom right of the rectangle

	// case 1: p2 top right
	if (p2.x > p1.x && p2.y < p1.y) {
		// swap p2.y and p1.y
		var tmp = p2.y;
		p2.y = p1.y;
		p1.y = tmp;
	}
	// case 2: p2 top left
	else if (p2.x < p1.x && p2.y < p1.y) {
		// swap both points completely
		var tmp = p2;
		p2 = p1;
		p1 = tmp;
	}
	// case 3: p2 bottom left
	else if (p2.x < p1.x && p2.y > p1.y) {
		// swap p2.x and p1.x
		var tmp = p2.x;
		p2.x = p1.x;
		p1.x = tmp;
	}

	var width = p2.x - p1.x, height = p2.y - p1.y;
	var borderColor = "rgba(128, 220, 255, 0.8)", backgroundColor = "rgba(160, 160, 255, 0.2)";

	var c = get(this.id);
	var ctx = c.getContext("2d");

	// borderSize
	ctx.lineWidth = this.borderSize;
	ctx.strokeStyle = borderColor;
	ctx.beginPath();
	ctx.rect(p1.x + this.borderSize/2, p1.y + this.borderSize/2, width + this.borderSize/2, height + this.borderSize/2);
	ctx.stroke();

	// fill
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(p1.x + this.borderSize, p1.y + this.borderSize, width, height);

}

// finds the nearest intersection on the drawing area so that the select function can appear to snap to the grid
// takes in a point (x, y) and returns a point (x, y)
SelectCanvas.prototype.findNearestIntersection = function(p) {
	var boundingRect = get("display").getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;
	var xFactor = (p.x - this.borderSize/2) / xMult, yFactor = (p.y - this.borderSize/2) / yMult;

	// round the xFactor to the closest integer, then multiply by xMult to get the intended point
	var roundedX = Math.round(xFactor) * xMult, roundedY = Math.round(yFactor) * yMult;

	return {x:roundedX, y:roundedY};
}

// find nearest intersection with out of bounds allowed, but the out of bounds will be adjusted back in accordingly
// note that this adjustment will require 2 points (topleft and bottom right) as arguments to ensure that 
// the selection does not go out of bounds
SelectCanvas.prototype.forceNearestIntersection = function(p1, p2) {
	// p1 is topleft, p2 is bottomright

	var boundingRect = get("display").getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;

	p1.xFactor = (p1.x - this.borderSize/2) / xMult, p1.yFactor = (p1.y - this.borderSize/2) / yMult;
	p2.xFactor = (p2.x - this.borderSize/2) / xMult, p2.yFactor = (p2.y - this.borderSize/2) / yMult;

	// round the xFactor to the closest integer, then multiply by xMult to get the intended point
	p1.x = Math.round(p1.xFactor) * xMult, p1.y = Math.round(p1.yFactor) * yMult;
	p2.x = Math.round(p2.xFactor) * xMult, p2.y = Math.round(p2.yFactor) * yMult;
	
	// above is copied from findNearestIntersection
	// below will be the adjustments

	while (p1.x < 0) {p1.x += xMult; p2.x += xMult;}
	while (p1.y < 0) {p1.y += yMult; p2.y += yMult;}

	while (p2.x > area.width*xMult) {p1.x -= xMult; p2.x -= xMult;}
	while (p2.y > area.height*yMult) {p1.y -= yMult; p2.y -= yMult;}

	var point1 = {x:p1.x, y:p1.y}, point2 = {x:p2.x, y:p2.y};
	return {topLeft:point1, bottomRight:point2};
}

SelectCanvas.prototype.convertIntersectionToCell = function(p) {
	var boundingRect = get("display").getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;
	var x = p.x / xMult, y = p.y / yMult;

	return {x:x, y:y};
}

// out of bounds checker
SelectCanvas.prototype.isOutOfBounds = function(p) {
	var boundingRect = get("display").getBoundingClientRect();
	return (p.x < 0 || p.x > boundingRect.width || p.y < 0 || p.y > boundingRect.height);
}

SelectCanvas.prototype.clearCanvas = function() {
	var c = get(this.id);
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
}

SelectCanvas.prototype.mousedown = function(e) {
	if (area.tool == 2) {
		// check for out of bounds
		var boundingRect = get("display").getBoundingClientRect();
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		if (this.isOutOfBounds(p)) return;

		this.enabled = true;

		var boundingRect = get("display").getBoundingClientRect();
		var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

		this.topLeft = {x:x, y:y};
		this.bottomRight = {x:x, y:y};
	}
	else if (area.tool == 3) {
		// set cursor to grabbing
		get(this.ele.id).children[0].style.cursor = "move";

		// set the move start point (relative to the draw area)
		var boundingRect = get("display").getBoundingClientRect();
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		// out of bounds check
		if (this.isOutOfBounds(p)) return;
		// passes out of bounds check so it can be the start point
		this.moveStart = p;

		// cut out the selection from area.grid
		// this area of the code allows movements to be made successive times for the same selection
		var height = this.cellBottomRight.y - this.cellTopLeft.y + 1;
		var width = this.cellBottomRight.x - this.cellTopLeft.x + 1;

		this.selectionTopLeft = this.cellTopLeft;
		this.selectionBottomRight = this.cellBottomRight;

		if (this.selection == null) {
			this.selection = init2D(height, width, null);
			for (var y=this.cellTopLeft.y; y<=this.cellBottomRight.y; y++)
				for (var x=this.cellTopLeft.x; x<=this.cellBottomRight.x; x++) {
					this.selection[y - this.cellTopLeft.y][x - this.cellTopLeft.x] = area.grid[y][x];
					area.grid[y][x] = null;
				}
		}
		else {
			for (var y=this.cellTopLeft.y; y<=this.cellBottomRight.y; y++)
				for (var x=this.cellTopLeft.x; x<=this.cellBottomRight.x; x++)
					if (this.selection[y - this.cellTopLeft.y][x - this.cellTopLeft.x] != null)
						area.grid[y][x] = null;
		}
		
		actionreplay.addState();
	}
}

SelectCanvas.prototype.mousemove = function(e) {
	if (area.tool == 2) {
		var boundingRect = get("display").getBoundingClientRect();

		// check for out of bounds
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		if (this.isOutOfBounds(p)) {
			get(this.id).style.cursor = 'default';
			if (this.enabled) this.mouseup(e);
			return;
		}
		else {
			get(this.id).style.cursor = 'crosshair';
		}
		if (this.enabled == false) return;

		this.clearCanvas();

		var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

		this.bottomRight = {x:x, y:y};
		this.drawSelectArea(this.topLeft, this.bottomRight);
	}
	else if (area.tool == 3) {
		if (this.moveStart != null) {
			// step 1: find current point
			var boundingRect = get("display").getBoundingClientRect();
			var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
			// out of bounds check
			if (this.isOutOfBounds(p)) return;

			// step 2: find delta
			var delta = {x: p.x - this.moveStart.x, y: p.y - this.moveStart.y};

			// step 3: calculate the new topleft and bottom right

			// exact values
			var newTopLeft = {x: this.topLeft.x + delta.x, y: this.topLeft.y + delta.y};
			var newBottomRight = {x: this.bottomRight.x + delta.x, y: this.bottomRight.y + delta.y};
			if (this.isOutOfBounds(newTopLeft) || this.isOutOfBounds(newBottomRight)) {
				// consider a drag where the element is at the bottom edge but NOT the cursor.
				// this allows the element to be moved right and left from the current cursor
				this.moveStart = p;
				var points = this.forceNearestIntersection(newTopLeft, newBottomRight);
				this.topLeft = points.topLeft;
				this.bottomRight = points.bottomRight;
				return;
			}
			else {
				// find nearest intersections
				this.newTopLeft = this.findNearestIntersection(newTopLeft);
				this.newBottomRight = this.findNearestIntersection(newBottomRight);

				// find corresponding cells
				var newCellTopLeft = this.convertIntersectionToCell(this.newTopLeft);
				var newCellBottomRight = this.convertIntersectionToCell(this.newBottomRight);
				newCellBottomRight = {x:newCellBottomRight.x-1, y:newCellBottomRight.y-1};

				// only move selection if it is necessary
				if (this.cellTopLeft == newCellTopLeft && this.cellBottomRight == newCellBottomRight) {}
				else {
					// only redraw the selected area if it is necessary
					this.clearCanvas();
					this.drawSelectArea(this.newTopLeft, this.newBottomRight);

					// load current grid and write cells directly to html
					// this is not a permanent action, so area.grid isn't changed and the "changes" are only written to html
					area.updateGrid();
					area.writeSelection(this.selection,	newCellTopLeft, newCellBottomRight);
					
					// update the new cells indicating that a move has been made
					// i think the this.topLeft and this.bottomRight aren't changed
					// but the cells need to be changed?
					this.cellTopLeft = newCellTopLeft;
					this.cellBottomRight = newCellBottomRight;
				}	
			}
		}
	}
}

SelectCanvas.prototype.mouseup = function(e) {
	if (area.tool == 2) {
		if (this.enabled == false) return;

		this.enabled = false;

		this.clearCanvas();

		// update the selection area

		this.topLeft = this.findNearestIntersection(this.topLeft);
		this.bottomRight = this.findNearestIntersection(this.bottomRight);
		this.drawSelectArea(this.topLeft, this.bottomRight);

		// update the cells
		this.cellTopLeft = this.convertIntersectionToCell(this.topLeft);
		this.cellBottomRight = this.convertIntersectionToCell(this.bottomRight);
		this.cellBottomRight = {x:this.cellBottomRight.x-1, y:this.cellBottomRight.y-1};
	}

	else if (area.tool == 3) {
		get(this.ele.id).children[0].style.cursor = "grab";

		this.moveStart = null;

		// update the selection area

		this.topLeft = this.newTopLeft;
		this.bottomRight = this.newBottomRight;

		this.topLeft = this.findNearestIntersection(this.topLeft);
		this.bottomRight = this.findNearestIntersection(this.bottomRight);

		// find corresponding cells
		var newCellTopLeft = this.convertIntersectionToCell(this.newTopLeft);
		var newCellBottomRight = this.convertIntersectionToCell(this.newBottomRight);
		newCellBottomRight = {x:newCellBottomRight.x-1, y:newCellBottomRight.y-1};

		// only move selection if it is necessary
		if (this.cellTopLeft == newCellTopLeft && this.cellBottomRight == newCellBottomRight) {}
		else {
			// only redraw the selected area if it is necessary
			this.clearCanvas();
			this.drawSelectArea(this.newTopLeft, this.newBottomRight);

			this.cellTopLeft = newCellTopLeft;
			this.cellBottomRight = newCellBottomRight;
		}

		// step 1: undo the removal of the selection
		// step 2: perform removal but do not record as an action
		// step 3: place the selection at the intended move area
		// step 4: record step 2 and 3 as a single action, which is what it is supposed to be.

		actionreplay.undo();

		for (var i=this.selectionTopLeft.y; i<=this.selectionBottomRight.y; i++)
			for (var j=this.selectionTopLeft.x; j<=this.selectionBottomRight.x; j++)
				// only erase if it was part of the original selection
				if (this.selection[i - this.selectionTopLeft.y][j - this.selectionTopLeft.x] != null)
					area.grid[i][j] = null;

		for (var i=newCellTopLeft.y; i<=newCellBottomRight.y; i++)
			for (var j=newCellTopLeft.x; j<=newCellBottomRight.x; j++)
				if (this.selection[i - newCellTopLeft.y][j - newCellTopLeft.x] != null)
					area.grid[i][j] = this.selection[i - newCellTopLeft.y][j - newCellTopLeft.x];
		
		area.updateGrid();

		// tentatively add state on every mouseup during move tool
		// there will need to be a check if the move tool actually changed anything
		// otherwise spam clicking will flood the history unnecessarily
		actionreplay.addState();
	}
}


// ------
// history (undo and redo)
// ------

function History() {
	this.timeline = [];
	// -1 so that if you add the initial state when page loads, it becomes 0
	this.pointer = -1;

	this.addState();
}

History.prototype.equal = function(a, b) {
	var height = a.length;
	var width = a[0].length;
	for (var i=0; i<height; i++)
		for (var j=0; j<width; j++)
			if (a[i][j] != b[i][j]) return false;
	return true;
}

History.prototype.addState = function(force) {
	// if the current area.grid has no difference with the previous entry in the history
	// >= 0 check due to the way the first item in the history is added
	if (this.pointer >= 0 && this.equal(this.timeline[this.pointer], area.grid)) {

		if (force == true) {
			// force is due to how line tool is implemented
			// for the first click after activating line tool, it plots a point at the cursor
			// moving the cursor around displays the line that would be drawn if you click again 
			// this line strts at the first click point and ends at where the cursor is
			//
			// this implementation would allow the user to cancel after clicking the first point, but it is not implemented yet
		}
		else return;
	}

	++this.pointer;
	// the while loop only gets triggered when history is changed
	while (this.timeline.length > this.pointer) this.timeline.pop();

	this.timeline.push(_.cloneDeep(area.grid));

	// pointer 0 means initialization phase, and updateFrame is not necessary
	if (this.pointer > 0) {
		frameWrapper.updateFrame();
		saveFrames("localStorage");
	}
}

History.prototype.undo = function() {
	if (this.pointer == 0) {
		alert("Nothing to undo");
		toggleTool(4);
		return;
	}
	--this.pointer;
	area.grid = _.cloneDeep(this.timeline[this.pointer]);
	area.updateGrid();

	frameWrapper.updateFrame();
	saveFrames("localStorage");
	// change tool back to previous
	// this extra check is to see if the user was the one who called this
	if (area.tool == 4)
		toggleTool(4);
}

History.prototype.redo = function() {
	if (this.pointer == this.timeline.length-1) {
		alert("Nothing to redo");
		toggleTool(5);
		return;
	}
	++this.pointer;
	area.grid = _.cloneDeep(this.timeline[this.pointer]);
	area.updateGrid();

	frameWrapper.updateFrame();
	saveFrames("localStorage");
	// change tool back to previous
	// this extra check is to see if the user was the one who called this
	if (area.tool == 5)
		toggleTool(5);
}

// flip-y
// currently does this for the whole grid, can possibly change to a selection in future

function flipY() {
	var copy = _.cloneDeep(area.grid);
	var flipped = init2D(area.height, area.width, null);

	for (var i=0; i<area.height; i++)
		for (var j=0; j<area.width; j++)
			flipped[i][area.width - 1 - j] = copy[i][j];

	area.grid = _.cloneDeep(flipped);
	area.updateGrid();

	actionreplay.addState();

	// change tool back to previous
	if (area.tool == 8)
		toggleTool(8);
}

// flip-x
// currently does this for the whole grid, can possibly change to a selection in future

function flipX() {
	var copy = _.cloneDeep(area.grid);
	var flipped = init2D(area.height, area.width, null);

	for (var i=0; i<area.height; i++)
		for (var j=0; j<area.width; j++)
			flipped[area.height - 1 - i][j] = copy[i][j];

	area.grid = _.cloneDeep(flipped);
	area.updateGrid();

	actionreplay.addState();

	// change tool back to previous
	if (area.tool == 9)
		toggleTool(9);
}

// rotate clockwise
// currently does this for the whole grid, can possibly change to a selection in future

function rotateClockwise() {
	if (area.height != area.width) {
		alert("This function only supports square grids at this moment.");

		if (area.tool == 10)
			toggleTool(10);

		return;
	}

	var copy = _.cloneDeep(area.grid);
	var rotated = init2D(area.height, area.width, null);

	for (var i=0; i<area.height; i++)
		for (var j=0; j<area.width; j++)
			rotated[i][j] = copy[area.width-j-1][i];

	area.grid = _.cloneDeep(rotated);
	area.updateGrid();

	actionreplay.addState();
	if (area.tool == 10)
		toggleTool(10);
}

// rotate counter clockwise
// currently does this for the whole grid, can possibly change to a selection in future

function rotateCounterClockwise() {
	if (area.height != area.width) {
		alert("This function only supports square grids at this moment.");

		if (area.tool == 11)
			toggleTool(11);

		return;
	}

	var copy = _.cloneDeep(area.grid);
	var rotated = init2D(area.height, area.width, null);

	for (var i=0; i<area.height; i++)
		for (var j=0; j<area.width; j++)
			rotated[i][j] = copy[j][area.height-i-1];

	area.grid = _.cloneDeep(rotated);
	area.updateGrid();

	actionreplay.addState();
	if (area.tool == 11)
		toggleTool(11);
}