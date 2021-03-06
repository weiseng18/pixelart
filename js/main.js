// ------
// main
// ------

var startmenu;

var pngmenu, gifmenu;

var area, box;

var colorPicker;

var tools;

var cHistory;

// undo and redo
var actionreplay;

// frames
var frameWrapper;

// ------
// z-index info
// ------

// z-index 100:
// - paint/erase size chooser
// - "cursor" for painting/erasing
// - select box, selectWrapper in select tool
// - button for addNewFrame()
//
// z-index 200:
// - tooltip as it could overlap with the paint/erase size chooser with z-index 100
//
// z-index 300:
// - start menu opacity cover (#startmenu_wrapper)
// - gif menu opacity cover (#gifmenu_wrapper)
// - dropdown menus from top menu

window.onload = function() {
	// ------
	// start menu
	// ------
	startmenu = new StartMenu("startmenu");
	startmenu.showMenu();

	// ------
	// drawing area
	// ------
	area = new DrawArea(32, 32);
	area.generateHTML();
	box = new Box("cursorBox", 1);

	// ------
	// color history
	// ------
	cHistory = new ColorHistory(2, 7);
	cHistory.generateHTML();

	// ------
	// color picker
	// ------
	colorPicker = new ColorPicker("color_slider", "color_body", "RGB");
	colorPicker.addEventListeners();
	colorPicker.createDisplayArea();

	// initialize pencil color to black, so that if the user tries to draw before selecting a color, it works
	get("color").style.backgroundColor = "rgb(0, 0, 0)";
	colorPicker.updateColorValue("rgb(0, 0, 0)", "color_history");

	// set default value because certain browsers like firefox has autocomplete
	// autocomplete causes the value to stay the same as previously selected before a F5
	get(colorPicker.colorTypeID).value = "RGB";

	get(colorPicker.colorTypeID).addEventListener("change", colorPicker.toggleColorType.bind(colorPicker));
	get(colorPicker.buttonID).addEventListener("click", cHistory.addColor.bind(cHistory));

	// ------
	// history
	// ------

	actionreplay = new History();

	// ------
	// frames
	// ------

	frameWrapper = new FrameWrapper("frameArea");

	frameWrapper.addNewFrame(area.grid, actionreplay);
	frameWrapper.initHTML();
	frameWrapper.loadFrame(0, "init");

	// ------
	// menu bar
	// ------
	get("downloadRaw").addEventListener("click", function(e) {
		saveRaw("download");
	});
	get("uploadRaw").addEventListener("click", function(e) {
		loadRaw("upload");
	});
	get("downloadFrames").addEventListener("click", function(e) {
		saveFrames("download");
	});
	get("uploadFrames").addEventListener("click", function(e) {
		loadFrames("upload");
	});

	get("frame_empty").addEventListener("click", function(e) {
		frameWrapper.addNewFrame();
	});
	get("frame_duplicate").addEventListener("click", function(e) {
		frameWrapper.addNewFrame(undefined, undefined, true);
	});
	get("frame_delete").addEventListener("click", function(e) {
		frameWrapper.deleteFrame();
	});

	get("savePNG").addEventListener("click", function(e) {
		pngmenu.showMenu();
	});
	get("saveGIF").addEventListener("click", function(e) {
		gifmenu.showMenu();
	});

	// ------
	// dragula (dragging frames)
	// ------

	// init function
	var drake = dragula([get(frameWrapper.id)]);

	// update the location in frames array
	drake.on("drop", function(el, target, source, sibling) {
		// dragged goes from 0 to length-1
		// insertBefore goes from 1 to length

		var dragged = parseInt(el.children[1].innerHTML) - 1;
		var insertBefore = sibling == undefined ? frameWrapper.frames.length : parseInt(sibling.children[1].innerHTML) - 1;

		// step 1: rearrange array
		frameWrapper.frames = relocate(frameWrapper.frames, dragged, insertBefore);

		// step 2: update <span> in .frame
		// step 3: update whichFrame (if selected frame is the moved one)
		var wrapper = get(frameWrapper.id);
		for (var i=0; i<wrapper.children.length; i++) {
			wrapper.children[i].children[1].innerHTML = i+1;
			if (wrapper.children[i].className.split(" ").includes("frameSelected")) {
				frameWrapper.loadFrame(i);
			}
		}

	});

	// ------
	// tools
	// ------
	tools = new ToolWrapper(2, 6);

	// pencil tool
	var boxEnable = box.enable.bind(box);
	var boxDisable = box.disable.bind(box);
	var pencil = new Tool("pencil", "pencil.png", "Pencil", boxEnable, boxDisable);

	// eyedropper tool
	var eyedropper = new Tool("eyedropper", "eyedropper.png", "Eyedropper tool");

	// select tool
	selectCanvas = new SelectCanvas("selectCanvas");
	var on = selectCanvas.enable.bind(selectCanvas);
	var off = selectCanvas.disable.bind(selectCanvas);
	var select = new Tool("select", "select.png", "Select tool", on, off);

	// move tool
	var moveOn = selectCanvas.moveOn.bind(selectCanvas);
	var moveOff = selectCanvas.moveOff.bind(selectCanvas);
	var move = new Tool("move", "move.png", "Move tool", moveOn, moveOff);

	// undo and redo tools
	var undoBIND = actionreplay.undo.bind(actionreplay);
	var redoBIND = actionreplay.redo.bind(actionreplay);

	var undo = new Tool("undo", "undo.png", "Undo tool", undoBIND);
	var redo = new Tool("redo", "redo.png", "Redo tool", redoBIND);

	// bucket tool
	var bucket = new Tool("bucket", "bucket.png", "Bucket tool");

	// line tool
	var line = new Tool("line", "line.png", "Line tool<br><strong>Click</strong> two points to draw a line");

	// flip about y-axis, x-axis
	var flip_y = new Tool("flip", "flip-y.png", "Flip-Y<br>Flip entire grid about <strong>y</strong>-axis", flipY);
	var flip_x = new Tool("flip", "flip-x.png", "Flip-X<br>Flip entire grid about <strong>x</strong>-axis", flipX);

	// rotate clockwise, counterclockwise
	var rotate_clockwise = new Tool("rotate_clockwise", "rotate-clockwise.png", "Rotate <strong>clockwise</strong> by 90 degrees", rotateClockwise);
	var rotate_counterclockwise = new Tool("rotate_counterclockwise", "rotate-counterclockwise.png", "Rotate <strong>counterclockwise</strong> by 90 degrees", rotateCounterClockwise);

	tools.addTool(pencil);					// DrawArea
	tools.addTool(eyedropper);				// eyeDropper()
	tools.addTool(select);					// SelectCanvas
	tools.addTool(move);					// SelectCanvas + DrawArea
	tools.addTool(undo);					// History
	tools.addTool(redo);					// History
	tools.addTool(bucket);					// DrawArea
	tools.addTool(line);					// DrawArea
	tools.addTool(flip_y);					// flipY()
	tools.addTool(flip_x);					// flipX()
	tools.addTool(rotate_clockwise);		// rotateClockwise()
	tools.addTool(rotate_counterclockwise);	// rotateCounterClockwise()

	tools.updateTools.call(tools);

	// ------
	// export menu
	// ------
	gifmenu = new ExportMenu("gif");
	pngmenu = new ExportMenu("png");
};

// due to a change in the size of the grid,
// either through choosing a different dimension from start menu
// or through loading a differently sized .pix
// area will need to be redefined.
//
// there are some items that depend directly on area (e.g. on generation)
// thus there will be a need for a reload to ensure that everything gets the updated values

// used in save.js to restart the grid
// frames reloading will be done outside of this function, due to custom requirements for
// startMenu.closeMenu
// handleFrames

function reload(height, width) {
	// dependency
	// pencil -> box -> area
	// size chooser -> box -> area
	// history (undo/redo) -> area
	// select canvas -> area

	// delete box
	tools.items[0].off();	// this is the binded function

	// delete area
	get(area.id).remove();

	// the following re-definitions have been copied from main.js
	// can work on this area in future for efficiency

	// re-create area
	area = new DrawArea(height, width);
	area.generateHTML();

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
	actionreplay = new History();

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