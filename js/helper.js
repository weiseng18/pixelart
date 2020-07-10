function init2D(height, width, val) {
	var arr = [];
	for (var i=0; i<height; i++) {
		var row = [];
		for (var j=0; j<width; j++)
			row.push(val);
		arr.push(row);
	}
	return arr;
}

// "rgb(0, 0, 0) to #000000"
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

// convert 400px to 400 (integer)
function removePX(string) {
	return parseInt(string.substring(0, string.length-2));
}

// returns the HTML element of the xth tr of the yth td of a table.
// expects id to be the id of a table.
function getCell(id, x, y) {
	return document.getElementById(id).children[0].children[x].children[y];
}

function get(id) {
	return document.getElementById(id);
}