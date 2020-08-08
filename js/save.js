// ------
// save to file
// ------

// area.grid has the hex values (or null) of all the pixels

function initiateDownload(href, filename) {
	var download = document.createElement('a');
	download.href = href;
	download.download = filename;
	download.click();
}

function savePNG() {
	var canvas = document.createElement("canvas");
	canvas.height = area.height;
	canvas.width = area.width;
	var ctx = canvas.getContext("2d");
	for (var i=0; i<area.height; i++) {
		for (var j=0; j<area.width; j++) {
			var value = area.grid[i][j];

			if (value != null) {
				ctx.fillStyle = value;
				ctx.fillRect(j, i, 1, 1);
			}
		}
	}

	// generate PNG
	var href = canvas.toDataURL('image/png');
	var filename = 'test.png';
	initiateDownload(href, filename);

}

// save raw data
// current format is hex values separated by commas for pixels on the same row
// and semicolons for row break
// transparent cells have 'null' as their hex value

function saveRaw(which) {
	var data = "";
	for (var i=0; i<area.height; i++) {
		if (i) data += ";";
		for (var j=0; j<area.width; j++) {
			if (j) data += ".";
			data += area.grid[i][j];
		}
	}

	if (which == "localStorage") {
		window.localStorage.setItem('data', data);
	}
	else if (which == "download") {
		// generate raw hex values of each pixel
		var blob = new Blob([data], {type: 'text/plain'});
		var href = URL.createObjectURL(blob);
		var filename = 'raw.pix';
		initiateDownload(href, filename);

		// allow Blob to be deleted
		URL.revokeObjectURL(href);
	}
}

function loadRaw(which) {
	if (which == "localStorage") {
		var data = window.localStorage.getItem("data");
		handleRaw(data);
	}
	else if (which == "upload") {
		var input = document.createElement("input");
		input.style.display = "none";
		input.type = "file";

		input.addEventListener("change", function(e) {
			// file reference
			var file = e.target.files[0];

			// set up file reader
			var reader = new FileReader();
			reader.readAsText(file, "UTF-8");

			reader.addEventListener("load", function(e) {
				var content = e.target.result;
				handleRaw(content);
			});

		});

		input.click();
	}
}

function handleRaw(data) {
	if (data != null) {
		data = data.split(";");
		var height = data.length;
		for (var i=0; i<height; i++)
			data[i] = data[i].split('.');
		var width = data[0].length;

		// reload the grid if dimensions have changed
		// history is forced to reset now, due to frame.js
		reload(height, width);

		for (var i=0; i<height; i++)
			for (var j=0; j<width; j++) {
				// localStorage stringifies stuff
				if (data[i][j] == "null")
					area.grid[i][j] = null;
				else
					area.grid[i][j] = data[i][j];
			}

		area.updateGrid();
		actionreplay.addState();
	}
}