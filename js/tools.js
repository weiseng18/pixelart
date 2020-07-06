// ------
// tools
// ------

function ToolWrapper(rows, columns) {
	var element = get("tool_wrapper");
	var style = getComputedStyle(element);

	// these two variables are numbers but the unit is px
	this.height = parseInt(style.height.substring(0, style.height.length-2));
	this.width = parseInt(style.width.substring(0, style.width.length-2));

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
		row.style.height = (this.height / this.rows) + "px";

		for (var j=0; j<this.columns; j++) {
			var cell = row.insertCell();

			cell.style.verticalAlign = "middle";
			cell.style.textAlign = "center";
			var idx = i*this.columns + j;
			if (idx < this.total) {
				cell.style.cursor = "pointer";
				cell.addEventListener("click", this.items[idx].click);

				var img = new Image();
				img.src = this.items[idx].iconSrc;

				cell.appendChild(img);
			}
		}
	}

	get("tool_wrapper").appendChild(table);
}

function toggleTool(idx) {
	// set area.tool to idx unless it is already idx, which means to toggle it off
	area.tool = (area.tool == idx ? 0 : idx);
}

function Tool(name, iconSrc) {
	this.name = name;
	this.iconSrc = "img/" + iconSrc;
	this.click = function(e) {
		var cell = e.target.parentElement;
		var column = cell.cellIndex;
		var row = cell.parentElement.rowIndex;
		var idx = row * tools.columns + column;

		toggleTool(idx);
	}
}

function eyeDropper(e) {
	var cell = e.target;
	var column = cell.cellIndex;
	var row = cell.parentElement.rowIndex;

	if (area.grid[row][column] == null) return;

	updateColor(e, "eyeDropper");
	cHistory.addColor(e, "eyeDropper");
}

window.onload = function() {
	tools = new ToolWrapper(4, 6);

	var pencil = new Tool("pencil", "pencil.png")
	var eyedropper = new Tool("eyedropper", "eyedropper.png");

	tools.addTool(pencil);
	tools.addTool(eyedropper);

	tools.generateHTML();
};