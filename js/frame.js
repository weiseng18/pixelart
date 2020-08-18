function FrameWrapper(id) {
	// frame variables
	this.frames = [];
	this.whichFrame = 0;

	this.id = id;
	// will be initialized in updateHTML()
	// currently updateHTML() treats the image as a square.
	// for rectangles updateHTML() should scale down the image while keeping the ratio of the width and height constant.
	// this will be implemented
	this.imgSize = 0;

	// css values
	this.externalMargin = 5;
	this.frameMargin = 10;
	this.imageMargin = 15;
}

function Frame(grid, actionreplay) {
	if (grid != undefined && actionreplay != undefined) {
		this.grid = grid;
		this.actionreplay = actionreplay;
	}
	else {
		this.grid = init2D(area.height, area.width, null);
		this.actionreplay = new History();
	}
}

// creates new empty frame and adds into frames[]
FrameWrapper.prototype.addNewFrame = function(grid, actionreplay, copy) {
	var frame;
	if (grid != undefined && actionreplay != undefined) {
		// this is only used in main.js
		// this is used for init, so do not saveFrames() here as it will overwrite past data
		frame = new Frame(grid, actionreplay);
		this.frames.push(frame);
	}
	else if (copy == true) {
		var fr = frameWrapper.frames[this.whichFrame];
		frame = new Frame(_.cloneDeep(fr.grid), _.cloneDeep(fr.actionreplay));
		this.frames.push(frame);
		this.addSingle();
		saveFrames("localStorage");
	}
	else {
		frame = new Frame();
		this.frames.push(frame);
		this.addSingle();
		saveFrames("localStorage");
	}
}

FrameWrapper.prototype.deleteFrame = function() {
	if (this.frames.length == 1) {
		alert("Cannot delete only frame");
		return;
	}

	// step 1: unload the current frame
	var toDelete = this.whichFrame;
	var last = false;
	if (this.whichFrame == this.frames.length-1) {
		last = true;
		this.loadFrame(this.whichFrame - 1);
	}
	else
		this.loadFrame(this.whichFrame + 1);

	// step 2: delete frame from frames
	this.frames.splice(toDelete, 1);

	// step 3: update HTML
	// currently this method wipes the whole HTML
	// can possibly have a method to remove a single frame and update the numbering just like in drag and drop
	var wrapper = get(this.id);
	wrapper.removeChild(wrapper.childNodes[toDelete]);

	for (var i=0; i<wrapper.children.length; i++)
		wrapper.children[i].children[1].innerHTML = i+1;

	// step 4: load correct frame
	// unless it is the last element, deleting the current frame make frame+1 be selected.
	// frame is then deleted, so frame+1 becomes frame and the this.whichFrame does not actually change overall.
	// this.whichFrame is set manually to prevent accessing out of bounds, when attempting to unload the css for selected frame
	if (last) {
		this.whichFrame = toDelete - 1;
		this.loadFrame(toDelete - 1);
	}
	else {
		this.whichFrame = toDelete;
		this.loadFrame(toDelete);
	}

	saveFrames("localStorage");
}

// updates a frame that has already been added into frames[]
FrameWrapper.prototype.updateFrame = function() {
	this.frames[this.whichFrame].grid = _.cloneDeep(area.grid);
	this.frames[this.whichFrame].actionreplay = _.cloneDeep(actionreplay);

	this.updateSingle();
}

// ------
// load functions
// ------

// loads a frame from frames[] into the current draw area
// source is either 'click', 'init', 'handleFrames', 'closeMenu'
// for now only matters if source is handleFrames

FrameWrapper.prototype.loadFrame = function(id, source) {
	var prevTool = area.tool;
	toggleTool(prevTool);

	// ------
	// css
	// ------

	// previous is whichFrame, new will be id

	var ele = get(this.id).children[this.whichFrame];
	var classArray = ele.className.split(" ");
	// only remove if it does actually have the class
	if (classArray.includes("frameSelected"))
		ele.classList.remove("frameSelected");

	var ele = get(this.id).children[id];
	ele.classList.add("frameSelected");

	if (this.whichFrame == 0 && id == 0 && source != "handleFrames") {
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

	toggleTool(prevTool);
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

// adds a newly added frame into the #frameArea html
FrameWrapper.prototype.addSingle = function() {
	var style = window.getComputedStyle(get(this.id));
	var width = removePX(style.getPropertyValue("width")) - 2*this.externalMargin;
	var height = width;

	var imgSize = height - 2*this.frameMargin - 2*this.imageMargin;

	// find last frame
	var id = this.frames.length - 1;
	var ele = this.createDotFrame(id, width, height);
	get(this.id).appendChild(ele);

}

// accesses the specific element representing the current frame, and only changes the image
// does not have any parameters since the current frame is an attribute of FrameWrapper
FrameWrapper.prototype.updateSingle = function() {
	var ele = get(this.id).children[this.whichFrame];
	ele.children[0].src = this.PIXtoFrameDisplay(this.frames[this.whichFrame].grid, this.imgSize, this.imgSize);
}

// this function is called once only, inits HTML
// the reason why this loads this.frames.length frames, is that it would allow a new loading format with multiple frames
FrameWrapper.prototype.initHTML = function() {
	var style = window.getComputedStyle(get(this.id));
	var width = removePX(style.getPropertyValue("width")) - 2*this.externalMargin;
	var height = width;

	var imgSize = height - 2*this.frameMargin - 2*this.imageMargin;
	this.imgSize = imgSize;

	for (let i=0; i<this.frames.length; i++) {
		var ele = this.createDotFrame(i, width, height);
		get(this.id).appendChild(ele);
	}

}

// wrapper function to create a .frame element, does not add to HTML
// width and height values seem a bit repetitive for the function call
FrameWrapper.prototype.createDotFrame = function(id, width, height) {
	var frame = this.frames[id];

	var wrapper = document.createElement("div");
	wrapper.className = "frame";

	wrapper.style.cursor = "pointer";

	wrapper.style.width = width - 2*this.frameMargin + "px";
	wrapper.style.height = height - 2*this.frameMargin + "px";

	wrapper.style.marginTop = this.frameMargin + this.externalMargin + "px";
	wrapper.style.marginLeft = this.frameMargin + this.externalMargin + "px";

	var img = document.createElement("img");
	img.src = this.PIXtoFrameDisplay(frame.grid, this.imgSize, this.imgSize);

	var idEle = document.createElement("span");
	idEle.style.position = "absolute";
	idEle.style.top = "10px";
	idEle.style.left = "10px";
	idEle.innerHTML = id+1;
	idEle.zIndex = 100;

	wrapper.appendChild(img);
	wrapper.appendChild(idEle);

	wrapper.addEventListener("click", function() { frameWrapper.loadFrame(parseInt(this.children[1].innerHTML)-1, "click"); });

	return wrapper;
}