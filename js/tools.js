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

	// currently, keybinds will be a single letter only
	this.keybinds = ["Q", "W", "E", "R", "T", "Y", "A", "S", "D", "F", "G", "H"];
}

ToolWrapper.prototype.addTool = function(tool) {
	tool.keyTrigger = this.keybinds[this.total];

	this.items.push(tool);
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

ToolWrapper.prototype.keyPressListener = function(e) {
	var key = e.which || e.keyCode;

	// force upper
	if (97 <= key && key <= 122) // a-z
		key -= 32;

	if (65 <= key && key <= 90) { // A-Z
		var char = String.fromCharCode(key);
		var idx = this.keybinds.indexOf(char);

		if (idx == -1) return;
		else toggleTool(idx);
	}
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

	var keyTrigger = "<strong>(" + this.keybinds[idx] + ")</strong>";

	var tooltip = keyTrigger + " " + tools.items[idx].tooltip;
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

		// change directly from select tool to move tool, but there is no selection
		if (pIDX == 2 && idx == 3 && selectCanvas.selection == null) {
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
			if (pIDX == 2 && idx == 3) {
				// this should not just be a pass
				// this should also be a return as the .on() at the bottom will make double event listeners
				return;
			}
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

	// this line ensures that if this is a new history object, then the 0th entry is necessarily a blank grid.
	if (this.pointer == 0)
		this.timeline.push(init2D(area.height, area.width, null));
	else
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