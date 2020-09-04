// ------
// .png
// ------

// area.grid has the hex values (or null) of all the pixels

function initiateDownload(href, filename) {
	var download = document.createElement('a');
	download.href = href;
	download.download = filename;
	download.click();
}

function savePNG(scale=1) {
	var canvas = document.createElement("canvas");
	canvas.height = area.height * scale;
	canvas.width = area.width * scale;
	var ctx = canvas.getContext("2d");
	for (var i=0; i<area.height; i++) {
		for (var j=0; j<area.width; j++) {
			var value = area.grid[i][j];

			if (value != null) {
				ctx.fillStyle = value;
				ctx.fillRect(j*scale, i*scale, scale, scale);
			}
		}
	}

	// generate PNG
	var href = canvas.toDataURL('image/png');
	var filename = 'test.png';
	initiateDownload(href, filename);

}

// ------
// .gif
// ------

function createGIF(scale=1, delay=200) {
	var encoder = new GIFEncoder();

	encoder.setRepeat(0);		// infinite repeat
	encoder.setDelay(delay);	// delay between frames

	var frames = frameWrapper.frames;
	var height = area.height;
	var width = area.width;

	encoder.start();

	for (var f=0; f<frames.length; f++) {
		// step 1: create canvas
		var canvas = document.createElement("canvas");
		canvas.height = height * scale;
		canvas.width = width * scale;

		var ctx = canvas.getContext("2d");
		for (var i=0; i<height; i++)
			for (var j=0; j<width; j++) {
				var value = frames[f].grid[i][j];
				if (value != null) {
					ctx.fillStyle = value;
					ctx.fillRect(j*scale, i*scale, scale, scale);
				}
			}
		// step 2: pass canvas context
		encoder.addFrame(ctx);
	}

	encoder.finish();
	encoder.download("result.gif");
}

// ------
// .pix
// ------

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

// ------
// .frames
// ------

// number of frames : height : width : frame1 : frame2 : frame3 ...

function saveFrames(which) {
	var data = "";

	data += frameWrapper.frames.length;
	data += ":";
	data += area.height;
	data += ":";
	data += area.width;
	data += ":";

	for (var f=0; f<frameWrapper.frames.length; f++) {
		var grid = frameWrapper.frames[f].grid;

		if (f) data += ":";

		for (var i=0; i<area.height; i++) {
			if (i) data += ";";
			for (var j=0; j<area.width; j++) {
				if (j) data += ".";
				data += grid[i][j];
			}
		}
	}

	if (which == "localStorage") {
		window.localStorage.setItem('frames', data);
	}
	else if (which == "download") {
		// generate raw hex values of each pixel
		var blob = new Blob([data], {type: 'text/plain'});
		var href = URL.createObjectURL(blob);
		var filename = 'raw.frames';
		initiateDownload(href, filename);

		// allow Blob to be deleted
		URL.revokeObjectURL(href);
	}
}

function loadFrames(which) {
	if (which == "localStorage") {
		var data = window.localStorage.getItem("frames");
		handleFrames(data);
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
				handleFrames(content);
			});

		});

		input.click();
	}
}

function handleFrames(data) {
	if (data != null) {
		data = data.split(":");
		var numFrames = parseInt(data[0]);
		var height = parseInt(data[1]);
		var width = parseInt(data[2]);

		// just in case of size change
		reload(height, width);

		frameWrapper.frames = [];
		// +3 due to the other variables in the file
		for (var d=3; d<numFrames+3; d++) {
			// reset area.grid
			for (var i=0; i<height; i++)
				for (var j=0; j<width; j++)
					area.grid[i][j] = null;


			frameWrapper.addNewFrame();
			frameWrapper.loadFrame(d-3);

			grid = data[d].split(";");
			for (var i=0; i<height; i++)
				grid[i] = grid[i].split(".");

			for (var i=0; i<height; i++)
				for (var j=0; j<width; j++) {
					// localStorage stringifies stuff
					if (grid[i][j] == "null")
						area.grid[i][j] = null;
					else
						area.grid[i][j] = grid[i][j];
				}

			actionreplay.addState();
		}

		// delete innerHTML
		get(frameWrapper.id).innerHTML = "";

		// rewrite innerHTML
		frameWrapper.initHTML();

		this.whichFrame = 0;
		frameWrapper.loadFrame(0, "handleFrames");
	}
}