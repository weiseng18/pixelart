// ------
// drawing area
// ------

function drawArea(height, width) {
	this.height = height;
	this.width = width;
}

drawArea.prototype.generateHTML = function() {
	// table
	var table = document.createElement("table");
	table.id = "display";
	table.style.borderSpacing = 0;

	table.style.marginLeft = "auto";
	table.style.marginRight = "auto";

	table.style.height = "500px";
	table.style.width = "500px";

	for (var i=0; i<this.height; i++) {
		var row = table.insertRow();
		row.style.height = toString(500 / this.height) + "px";
		for (var j=0; j<this.width; j++) {
			var cell = row.insertCell();				
			cell.style.width = toString(500 / this.width) + "px";
			cell.style.backgroundColor = (i+j)%2 == 0 ? "#FFFFFF" : "#D8D8D8";
		}
	}
	get("mainArea").appendChild(table);
}

// ------
// color picker
// ------

function CanvasWrapper(id) {
	this.HTML = get(id);
	this.ctx = this.HTML.getContext("2d");
	this.width = this.HTML.width;
	this.height = this.HTML.height;
}

// creates a gradient of colors over the whole canvas
// colors is the list of colors (must include the end color)
// which is the direction
CanvasWrapper.prototype.LinearGradient = function() {
	var gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
	gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
	gradient.addColorStop(0.166, "rgba(255, 255, 0, 1)");
	gradient.addColorStop(0.333, "rgba(0, 255, 0, 1)");
	gradient.addColorStop(0.5, "rgba(0, 255, 255, 1)");
	gradient.addColorStop(0.666, "rgba(0, 0, 255, 1)");
	gradient.addColorStop(0.833, "rgba(255, 0, 255, 1)");
	gradient.addColorStop(1, "rgba(255, 0, 0, 1)");
	this.ctx.fillStyle = gradient;
	this.ctx.fillRect(0, 0, this.width, this.height);
}
// ------
// main
// ------

var area;

var slider;

window.onload = function() {
	area = new drawArea(20, 20);
	area.generateHTML();

	slider = new CanvasWrapper("color_slider");
	slider.LinearGradient();
};