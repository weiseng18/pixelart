function FrameWrapper() {
	// frame variables
	this.frames = [];
	this.whichFrame = 0;
}

function Frame(grid, actionreplay) {
	this.grid = grid;
	this.actionreplay = actionreplay;
}

// creates new frame (based on the current grid) and adds into frames[]
FrameWrapper.prototype.addNewFrame = function() {
	var grid = _.cloneDeep(area.grid);
	var rep = _.cloneDeep(actionreplay);
	var frame = new Frame(grid, rep);
	this.frames.push(frame);
}

// updates a frame previously added into frames[]
FrameWrapper.prototype.updateFrame = function() {
	this.frames[this.whichFrame].grid = _.cloneDeep(area.grid);
	this.frames[this.whichFrame].actionreplay = _.cloneDeep(actionreplay);
}

// ------
// load functions
// ------

// loads a frame from frames[] into the current draw area
FrameWrapper.prototype.loadFrame = function(id) {
	// ------
	// css
	// ------

	// previous is whichFrame, new will be id

	var ele = get("frameArea").children[this.whichFrame];
	var classArray = ele.className.split(" ");
	// only remove if it does actually have the class
	if (classArray.includes("frameSelected"))
		ele.classList.remove("frameSelected");

	var ele = get("frameArea").children[id];
	ele.classList.add("frameSelected");

	if (this.whichFrame == 0 && id == 0) {
		// this means that this function was the instance called on page load
		return;
	}

	// ------
	// functional stuff
	// ------

	this.whichFrame = id;
	frame = this.frames[id];

	var height = frame.grid.length;
	var width = frame.grid[0].length;

	// delete box
	tools.items[0].off();	// this is the binded function

	// delete area
	get(area.id).remove();

	// the following re-definitions have been copied from main.js
	// can work on this area in future for efficiency

	// re-create area
	area = new DrawArea(height, width);
	area.generateHTML();

	area.grid = _.cloneDeep(frame.grid);
	area.updateGrid();

	// re-create box
	box = new Box("cursorBox", 1);

	// re-create pencil tool
	var boxEnable = box.enable.bind(box);
	var boxDisable = box.disable.bind(box);
	var pencil = new Tool("pencil", "pencil.png", "Pencil", boxEnable, boxDisable);
	pencil.on();

	// re-create select tool
	selectCanvas = new SelectCanvas("selectCanvas");
	var on = selectCanvas.enable.bind(selectCanvas);
	var off = selectCanvas.disable.bind(selectCanvas);
	var select = new Tool("select", "select.png", "Select tool", on, off);

	// re-create history tools
	actionreplay = _.cloneDeep(frame.actionreplay);

	var undoBIND = actionreplay.undo.bind(actionreplay);
	var redoBIND = actionreplay.redo.bind(actionreplay);

	var undo = new Tool("undo", "undo.png", "Undo tool", undoBIND);
	var redo = new Tool("redo", "redo.png", "Redo tool", redoBIND);

	// due to select tool, undo, redo tool changing, the whole tools section needs to be re-generated
	tools.items[0] = pencil;
	tools.items[2] = select;
	tools.items[4] = undo;
	tools.items[5] = redo;

	tools.updateTools.call(tools);
}

// ------
// display functions
// ------

// takes in a grid, returns href;
FrameWrapper.prototype.PIXtoFrameDisplay = function(grid, height, width) {
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
FrameWrapper.prototype.updateHTML = function() {
	get("frameArea").innerHTML = "";

	var extraMargin = 5;

	var width = removePX(window.getComputedStyle(get("frameArea")).getPropertyValue("width")) - 2*extraMargin;
	var height = width;

	var outerMargin = 10;
	var innerPadding = 15;

	var imgSize = height - 2*outerMargin - 2*innerPadding;

	for (let i=0; i<this.frames.length; i++) {
		var frame = this.frames[i];
		var id = i+1;

		var wrapper = document.createElement("div");
		wrapper.className = "frame";

		wrapper.addEventListener("click", function() { frameWrapper.loadFrame(i); });
		wrapper.style.cursor = "pointer";

		wrapper.style.width = width - 2*outerMargin + "px";
		wrapper.style.height = height - 2*outerMargin + "px";

		wrapper.style.marginTop = outerMargin + extraMargin + "px";
		wrapper.style.marginLeft = outerMargin + extraMargin + "px";

		var img = document.createElement("img");
		img.src = this.PIXtoFrameDisplay(frame.grid, imgSize, imgSize);

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