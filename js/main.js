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

	var white = ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)'];
	var whiteGradient = this.LinearGradient(white, "horizontal");
	this.ctx.fillStyle = whiteGradient;
	this.ctx.fillRect(0, 0, this.width, this.height);

	var black = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)'];
	var blackGradient = this.LinearGradient(black, "vertical");
	this.ctx.fillStyle = whiteGradient;
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
	var colors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 255, 0, 1)", "rgba(0, 255, 255, 1)", "rgba(0, 0, 255, 1)", "rgba(255, 0, 255, 1)", "rgba(255, 0, 0, 1)"];
	slider.LinearGradient(colors, "vertical");

	body = new CanvasWrapper("color_body");

	// add event listener to change the color
	slider.HTML.addEventListener("click", function(e) {
		x = e.offsetX;
		y = e.offsetY;
		var data = slider.ctx.getImageData(x, y, 1, 1).data;
		var color = 'rgba(' + data[0] + ',' + data[1] + ',' + data[2] + ',1)';
		body.TwoDimGradient(color);
	});

};