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