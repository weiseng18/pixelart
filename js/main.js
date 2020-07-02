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


var area;

window.onload = function() {
	area = new drawArea(20, 20);
	area.generateHTML();
};