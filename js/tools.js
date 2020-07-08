// ------
// tools
// ------

function ToolWrapper(rows, columns) {
	var element = get("tool_wrapper");
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

	console.log(this.height);

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
				cell.addEventListener("mouseover", this.mouseover);
				cell.addEventListener("mouseout", this.mouseout);

				var img = new Image();
				img.src = this.items[idx].iconSrc;
				img.style.display = "block";
				img.style.margin = "auto auto";

				cell.appendChild(img);
			}
		}
	}

	get("tool_wrapper").appendChild(table);
}

ToolWrapper.prototype.mouseover = function(e) {
	// change e.target <td> to e.target <img>
	var cell = e.target.children[0] != undefined ? e.target : e.target.parentElement;

	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;
	var idx = row * tools.columns + column;

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

	if (area.tool == idx) {
		// resetting to 0, i.e. pencil tool
		getCell("tools", row, column).style.backgroundColor = "";
		getCell("tools", row, column).style.border = "solid 2px white";

		getCell("tools", 0, 0).style.backgroundColor = "#3DB1FF";
		getCell("tools", 0, 0).style.border = "solid 2px #A3DAFF";

		area.tool = 0;

		if (tools.items[idx].off != undefined)
			tools.items[idx].off();
	}
	else {
		var pRow = Math.floor(area.tool / tools.columns);
		var pColumn = area.tool - pRow*tools.columns;

		var pIDX = pRow*tools.columns + pColumn;

		getCell("tools", pRow, pColumn).style.backgroundColor = "";
		getCell("tools", pRow, pColumn).style.border = "solid 2px white";

		getCell("tools", row, column).style.backgroundColor = "#3DB1FF";
		getCell("tools", row, column).style.border = "solid 2px #A3DAFF";

		area.tool = idx;

		if (tools.items[pIDX].off != undefined)
			tools.items[pIDX].off();

		if (tools.items[idx].on != undefined)
			tools.items[idx].on();
	}
}

function Tool(name, iconSrc, on, off) {
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
}

function eyeDropper(e) {
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (area.grid[row][column] == null) return;

	updateColor(e, "eyeDropper");
	cHistory.addColor(e, "eyeDropper");
}

function SelectCanvas(id) {
	this.id = id;

	// element always has to be ready for append and remove
	this.ele = this.generateHTML();

	this.enabled = false;

	this.topLeft = null;
	this.bottomRight = null;
}

SelectCanvas.prototype.generateHTML = function() {
	var ele = document.createElement("canvas");
	ele.id = "selectCanvas";

	var boundingRect = get("display").getBoundingClientRect();

	ele.style.position = "absolute";
	ele.style.top = boundingRect.top + "px";
	ele.style.left = boundingRect.left + "px";

	// to ensure that it floats up
	ele.style.zIndex = "100";

	// for more precise numbers
	ele.height = removePX(get("display").style.height);
	ele.width = removePX(get("display").style.width);

	return ele;
}

SelectCanvas.prototype.enable = function() {
	document.body.appendChild(this.ele);

	// add event listeners once the element is added to DOM
	get(this.ele.id).addEventListener("mousedown", this.mousedown);
	get(this.ele.id).addEventListener("mousemove", this.mousemove);
	get(this.ele.id).addEventListener("mouseup", this.mouseup);
}

SelectCanvas.prototype.disable = function() {
	// remove event listeners before the element is removed from DOM
	get(this.ele.id).removeEventListener("mousedown", this.mousedown);
	get(this.ele.id).removeEventListener("mousemove", this.mousemove);
	get(this.ele.id).removeEventListener("mouseup", this.mouseup);

	get(this.id).remove();
}

// draws the select area
SelectCanvas.prototype.drawSelectArea = function(p1, p2) {
	var width = p2.x - p1.x, height = p2.y - p1.y;
	var borderColor = "rgba(128, 220, 255, 0.8)", backgroundColor = "rgba(160, 160, 255, 0.2)";
	var borderSize = 4;

	var c = get(this.id);
	var ctx = c.getContext("2d");

	// borderSize
	ctx.lineWidth = borderSize;
	ctx.strokeStyle = borderColor;
	ctx.beginPath();
	ctx.rect(p1.x + borderSize/2, p1.y + borderSize/2, width, height);
	ctx.stroke();

	// fill
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(p1.x + borderSize, p1.y + borderSize, width - borderSize, height - borderSize);

}

SelectCanvas.prototype.mousedown = function(e) {
	selectCanvas.enabled = true;

	var boundingRect = get("display").getBoundingClientRect();
	var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

	selectCanvas.topLeft = {x:x, y:y};
	selectCanvas.bottomRight = {x:x, y:y};
}

SelectCanvas.prototype.mousemove = function(e) {
	if (selectCanvas.enabled == false) return;

	// clear canvas
	var c = get("selectCanvas");
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);

	var boundingRect = get("display").getBoundingClientRect();
	var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

	// temporarily assuming the mousedown spot is closer to top left than mousemove
	selectCanvas.bottomRight = {x:x, y:y};
	selectCanvas.drawSelectArea(selectCanvas.topLeft, selectCanvas.bottomRight);
}

SelectCanvas.prototype.mouseup = function(e) {
	selectCanvas.enabled = false;
}