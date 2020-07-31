// ------
// main
// ------

var area, box;

var colorPicker;

var tools;

var cHistory;

// undo and redo
var actionreplay;

window.onload = function() {
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
	// menu bar / saving functions
	// ------
	get("savePNG").addEventListener("click", function(e) {
		savePNG();
	});
	get("saveRaw").addEventListener("click", function(e) {
		saveRaw("localStorage");
	});
	get("loadRaw").addEventListener("click", function(e) {
		loadRaw("localStorage");
	});
	get("downloadRaw").addEventListener("click", function(e) {
		saveRaw("download");
	});
	get("uploadRaw").addEventListener("click", function(e) {
		loadRaw("upload");
	});

	// ------
	// history
	// ------

	actionreplay = new History();

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

	// rotate clockwise
	var rotate_clockwise = new Tool("rotate_clockwise", "rotate-clockwise.png", "Rotate <strong>Clockwise</strong> by 90 degrees", rotateClockwise);

	tools.addTool(pencil);				// DrawArea
	tools.addTool(eyedropper);			// eyeDropper()
	tools.addTool(select);				// SelectCanvas
	tools.addTool(move);				// SelectCanvas + DrawArea
	tools.addTool(undo);				// History
	tools.addTool(redo);				// History
	tools.addTool(bucket);				// DrawArea
	tools.addTool(line);				// DrawArea
	tools.addTool(flip_y);				// flipY()
	tools.addTool(flip_x);				// flipX()
	tools.addTool(rotate_clockwise);	// rotateClockwise()

	tools.generateHTML();

	get(tools.id).addEventListener("dragstart", function(e) {
		e.preventDefault();
	});
	get(tools.id).addEventListener("contextmenu", function(e) {
		e.preventDefault();
	});

	// turn on pencil tool
	toggleTool(0);

};