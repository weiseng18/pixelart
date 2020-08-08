function Frame(grid, actionreplay) {
	this.grid = grid;
	this.actionreplay = actionreplay;
}

// creates new frame and adds into frames[]
function addNewFrame() {
	var grid = _.cloneDeep(area.grid);
	var rep = _.cloneDeep(actionreplay);
	var frame = new Frame(grid, rep);
	frames.push(frame);
}

// updates a frame previously added into frames[]
function updateFrame(id) {
	frames[id].grid = _.cloneDeep(area.grid);
	frames[id].actionreplay = _.cloneDeep(actionreplay);
}

// loads a frame from frames[] into the current draw area
function loadFrame(id) {
	area.grid = _.cloneDeep(frames[id].grid);
	actionreplay = _.cloneDeep(frames[id].actionreplay);

	area.updateGrid();

	// reload undo/redo functions

	var undoBIND = actionreplay.undo.bind(actionreplay);
	var redoBIND = actionreplay.redo.bind(actionreplay);

	var undo = new Tool("undo", "undo.png", "Undo tool", undoBIND);
	var redo = new Tool("redo", "redo.png", "Redo tool", redoBIND);

	tools.items[4] = undo;
	tools.items[5] = redo;

	tools.updateTools.call(tools);
}

// takes in a grid, returns href;
function PIXtoFrameDisplay(grid, height, width) {
	var canvas = document.createElement("canvas");

	var rows = grid.length;
	var cols = grid[0].length;

	var cellHeight = height / rows;
	var cellWidth = width / cols;

	canvas.height = height;
	canvas.width = width;

	var ctx = canvas.getContext("2d");
	for (var i=0; i<rows; i++) {
		for (var j=0; j<cols; j++) {
			var value = grid[i][j];

			if (value != null) {
				ctx.fillStyle = value;
				ctx.fillRect(j*cellWidth, i*cellHeight, cellWidth, cellHeight);
			}
		}
	}
	
	var href = canvas.toDataURL('image/png');
	return href;
}

// updates #frameArea with the current state of frames[]
function updateHTML() {
	get("frameArea").innerHTML = "";

	var width = removePX(window.getComputedStyle(get("frameArea")).getPropertyValue("width"));
	var height = width;

	var outerMargin = 10;
	var innerPadding = 15;

	var imgSize = height - 2*outerMargin - 2*innerPadding;

	for (var i=0; i<frames.length; i++) {
		var frame = frames[i];
		var id = i+1;

		var wrapper = document.createElement("div");
		wrapper.className = "frame";

		wrapper.style.width = width - 2*outerMargin + "px";
		wrapper.style.height = height - 2*outerMargin + "px";

		wrapper.style.marginTop = outerMargin + "px";
		wrapper.style.marginLeft = outerMargin + "px";

		var img = document.createElement("img");
		img.src = PIXtoFrameDisplay(frame.grid, imgSize, imgSize);

		var idEle = document.createElement("span");
		idEle.style.position = "absolute";
		idEle.style.top = "10px";
		idEle.style.left = "10px";
		idEle.innerHTML = id;
		idEle.zIndex = 100;

		wrapper.appendChild(img);
		wrapper.appendChild(idEle);

		get("frameArea").appendChild(wrapper);
	}
}