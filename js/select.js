// ------
// select tool + move tool
// ------

function SelectCanvas(id) {
	this.id = id;

	this.enabled = false;

	// constant to be used to ensure that this "extra" width and height will extend out of the drawing area
	this.borderSize = 4;

	// top left and bottom right of the selected rectangle
	// in the move tool, this only changes on mouseup event
	this.topLeft = null;
	this.bottomRight = null;

	// cell top left and bottom right, will correspond to this.grid
	this.cellTopLeft = null;
	this.cellBottomRight = null;
	this.selection = null;

	// variable to store the mousedown point for move tool
	// if it is null that means no move is in process
	this.moveStart = null;
	this.newTopLeft = null;
	this.newBottomRight = null;

	// selection top left and bottom right
	// used to delete the original selection upon moving
	this.selectionTopLeft = null;
	this.selectionBottomRight = null;

	// element always has to be ready for append and remove
	// this has to be below this.borderSize so that this.borderSize is defined and can be used in this method
	this.ele = this.generateHTML();
}

SelectCanvas.prototype.generateHTML = function() {
	var div = document.createElement("div");
	div.id = "selectCanvas_wrapper";
	div.style.width = "75%";
	div.style.height = "92vh";
	div.style.zIndex = "100";

	div.style.padding = "0";
	div.style.margin = "0";

	div.style.position = "absolute";
	div.style.top = "8%";
	div.style.left = "25%";

	var ele = document.createElement("canvas");
	ele.id = "selectCanvas";

	var boundingRect = get(area.id).getBoundingClientRect();

	ele.style.position = "fixed";
	ele.style.top = boundingRect.top - this.borderSize + "px";
	ele.style.left = boundingRect.left - this.borderSize + "px";

	// to ensure that it floats up
	ele.style.zIndex = "100";

	// for more precise numbers
	ele.height = removePX(get(area.id).style.height) + this.borderSize*2;
	ele.width = removePX(get(area.id).style.width) + this.borderSize*2;

	div.appendChild(ele);

	return div;
}

SelectCanvas.prototype.enable = function() {
	document.body.appendChild(this.ele);

	this.mousedownBIND = this.mousedown.bind(this);
	this.mousemoveBIND = this.mousemove.bind(this);
	this.mouseupBIND = this.mouseup.bind(this);

	// add event listeners once the element is added to DOM
	get(this.ele.id).addEventListener("mousedown", this.mousedownBIND);
	get(this.ele.id).addEventListener("mousemove", this.mousemoveBIND);
	get(this.ele.id).addEventListener("mouseup", this.mouseupBIND);
}

SelectCanvas.prototype.disable = function() {
	// remove event listeners before the element is removed from DOM
	get(this.ele.id).removeEventListener("mousedown", this.mousedownBIND);
	get(this.ele.id).removeEventListener("mousemove", this.mousemoveBIND);
	get(this.ele.id).removeEventListener("mouseup", this.mouseupBIND);

	this.clearCanvas();

	// reset selection
	this.selection = null;

	get(this.ele.id).remove();
}

SelectCanvas.prototype.moveOn = function() {
	get(this.ele.id).children[0].style.cursor = "grab";
}

SelectCanvas.prototype.moveOff = function() {
	get(this.ele.id).children[0].style.cursor = "crosshair";

	// reset selection
	this.selection = null;

	this.disable();
}

// draws the select area
// assumes p1.x < p2.x and p1.y < p2.y, i.e. p1 is the top left and p2 is the bottom right of the rectangle.
SelectCanvas.prototype.drawSelectArea = function(x1, x2) {

	var p1 = _.cloneDeep(x1);
	var p2 = _.cloneDeep(x2);
	// checks to convert p1, p2 into the top left, bottom right of the rectangle

	// case 1: p2 top right
	if (p2.x > p1.x && p2.y < p1.y) {
		// swap p2.y and p1.y
		var tmp = p2.y;
		p2.y = p1.y;
		p1.y = tmp;
	}
	// case 2: p2 top left
	else if (p2.x < p1.x && p2.y < p1.y) {
		// swap both points completely
		var tmp = p2;
		p2 = p1;
		p1 = tmp;
	}
	// case 3: p2 bottom left
	else if (p2.x < p1.x && p2.y > p1.y) {
		// swap p2.x and p1.x
		var tmp = p2.x;
		p2.x = p1.x;
		p1.x = tmp;
	}

	var width = p2.x - p1.x, height = p2.y - p1.y;
	var borderColor = "rgba(128, 220, 255, 0.8)", backgroundColor = "rgba(160, 160, 255, 0.2)";

	var c = get(this.id);
	var ctx = c.getContext("2d");

	// borderSize
	ctx.lineWidth = this.borderSize;
	ctx.strokeStyle = borderColor;
	ctx.beginPath();
	ctx.rect(p1.x + this.borderSize/2, p1.y + this.borderSize/2, width + this.borderSize/2, height + this.borderSize/2);
	ctx.stroke();

	// fill
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(p1.x + this.borderSize, p1.y + this.borderSize, width, height);

}

// finds the nearest intersection on the drawing area so that the select function can appear to snap to the grid
// takes in a point (x, y) and returns a point (x, y)
SelectCanvas.prototype.findNearestIntersection = function(p) {
	var boundingRect = get(area.id).getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;
	var xFactor = (p.x - this.borderSize/2) / xMult, yFactor = (p.y - this.borderSize/2) / yMult;

	// round the xFactor to the closest integer, then multiply by xMult to get the intended point
	var roundedX = Math.round(xFactor) * xMult, roundedY = Math.round(yFactor) * yMult;

	return {x:roundedX, y:roundedY};
}

// find nearest intersection with out of bounds allowed, but the out of bounds will be adjusted back in accordingly
// note that this adjustment will require 2 points (topleft and bottom right) as arguments to ensure that 
// the selection does not go out of bounds
SelectCanvas.prototype.forceNearestIntersection = function(p1, p2) {
	// p1 is topleft, p2 is bottomright

	var boundingRect = get(area.id).getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;

	p1.xFactor = (p1.x - this.borderSize/2) / xMult, p1.yFactor = (p1.y - this.borderSize/2) / yMult;
	p2.xFactor = (p2.x - this.borderSize/2) / xMult, p2.yFactor = (p2.y - this.borderSize/2) / yMult;

	// round the xFactor to the closest integer, then multiply by xMult to get the intended point
	p1.x = Math.round(p1.xFactor) * xMult, p1.y = Math.round(p1.yFactor) * yMult;
	p2.x = Math.round(p2.xFactor) * xMult, p2.y = Math.round(p2.yFactor) * yMult;
	
	// above is copied from findNearestIntersection
	// below will be the adjustments

	while (p1.x < 0) {p1.x += xMult; p2.x += xMult;}
	while (p1.y < 0) {p1.y += yMult; p2.y += yMult;}

	while (p2.x > area.width*xMult) {p1.x -= xMult; p2.x -= xMult;}
	while (p2.y > area.height*yMult) {p1.y -= yMult; p2.y -= yMult;}

	var point1 = {x:p1.x, y:p1.y}, point2 = {x:p2.x, y:p2.y};
	return {topLeft:point1, bottomRight:point2};
}

SelectCanvas.prototype.convertIntersectionToCell = function(p) {
	var boundingRect = get(area.id).getBoundingClientRect();

	// get the width and height of a cell on the drawing area
	var xMult = boundingRect.width / area.width, yMult = boundingRect.height / area.height;
	var x = p.x / xMult, y = p.y / yMult;

	return {x:x, y:y};
}

// out of bounds checker
SelectCanvas.prototype.isOutOfBounds = function(p) {
	var boundingRect = get(area.id).getBoundingClientRect();
	return (p.x < 0 || p.x > boundingRect.width || p.y < 0 || p.y > boundingRect.height);
}

SelectCanvas.prototype.clearCanvas = function() {
	var c = get(this.id);
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
}

SelectCanvas.prototype.mousedown = function(e) {
	if (area.tool == 2) {
		this.selection = null;

		// check for out of bounds
		var boundingRect = get(area.id).getBoundingClientRect();
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		if (this.isOutOfBounds(p)) return;

		this.enabled = true;

		var boundingRect = get(area.id).getBoundingClientRect();
		var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

		this.topLeft = {x:x, y:y};
		this.bottomRight = {x:x, y:y};
	}
	else if (area.tool == 3) {
		// set cursor to grabbing
		get(this.ele.id).children[0].style.cursor = "move";

		// set the move start point (relative to the draw area)
		var boundingRect = get(area.id).getBoundingClientRect();
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		// out of bounds check
		if (this.isOutOfBounds(p)) return;
		// passes out of bounds check so it can be the start point
		this.moveStart = p;

		// update new corner points
		// this is to ensure that newTopLeft and newBottomRight are not null
		this.newTopLeft = this.topLeft;
		this.newBottomRight = this.bottomRight;

		// cut out the selection from area.grid
		// this area of the code allows movements to be made successive times for the same selection
		for (var y=this.cellTopLeft.y; y<=this.cellBottomRight.y; y++)
			for (var x=this.cellTopLeft.x; x<=this.cellBottomRight.x; x++)
				if (this.selection[y - this.cellTopLeft.y][x - this.cellTopLeft.x] != null)
					area.grid[y][x] = null;

		actionreplay.addState();
	}
}

SelectCanvas.prototype.mousemove = function(e) {
	if (area.tool == 2) {
		var boundingRect = get(area.id).getBoundingClientRect();

		// check for out of bounds
		var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
		if (this.isOutOfBounds(p)) {
			get(this.id).style.cursor = 'default';
			return;
		}
		else {
			get(this.id).style.cursor = 'crosshair';
		}
		if (this.enabled == false) return;

		this.clearCanvas();

		var x = e.clientX - boundingRect.left, y = e.clientY - boundingRect.top;

		this.bottomRight = {x:x, y:y};
		this.drawSelectArea(this.topLeft, this.bottomRight);
	}
	else if (area.tool == 3) {
		if (this.moveStart != null) {
			// step 1: find current point
			var boundingRect = get(area.id).getBoundingClientRect();
			var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};
			// out of bounds check
			if (this.isOutOfBounds(p)) return;

			// step 2: find delta
			var delta = {x: p.x - this.moveStart.x, y: p.y - this.moveStart.y};

			// step 3: calculate the new topleft and bottom right

			// exact values
			var newTopLeft = {x: this.topLeft.x + delta.x, y: this.topLeft.y + delta.y};
			var newBottomRight = {x: this.bottomRight.x + delta.x, y: this.bottomRight.y + delta.y};
			if (this.isOutOfBounds(newTopLeft) || this.isOutOfBounds(newBottomRight)) {
				// consider a drag where the element is at the bottom edge but NOT the cursor.
				// this allows the element to be moved right and left from the current cursor
				this.moveStart = p;
				var points = this.forceNearestIntersection(newTopLeft, newBottomRight);
				this.topLeft = points.topLeft;
				this.bottomRight = points.bottomRight;
				return;
			}
			else {
				// find nearest intersections
				this.newTopLeft = this.findNearestIntersection(newTopLeft);
				this.newBottomRight = this.findNearestIntersection(newBottomRight);

				// find corresponding cells
				var newCellTopLeft = this.convertIntersectionToCell(this.newTopLeft);
				var newCellBottomRight = this.convertIntersectionToCell(this.newBottomRight);
				newCellBottomRight = {x:newCellBottomRight.x-1, y:newCellBottomRight.y-1};

				// only move selection if it is necessary
				if (this.cellTopLeft == newCellTopLeft && this.cellBottomRight == newCellBottomRight) {}
				else {
					// only redraw the selected area if it is necessary
					this.clearCanvas();
					this.drawSelectArea(this.newTopLeft, this.newBottomRight);

					// load current grid and write cells directly to html
					// this is not a permanent action, so area.grid isn't changed and the "changes" are only written to html
					area.updateGrid();
					area.writeSelection(this.selection,	newCellTopLeft, newCellBottomRight);
					
					// update the new cells indicating that a move has been made
					// i think the this.topLeft and this.bottomRight aren't changed
					// but the cells need to be changed?
					this.cellTopLeft = newCellTopLeft;
					this.cellBottomRight = newCellBottomRight;
				}	
			}
		}
	}
}

SelectCanvas.prototype.mouseup = function(e) {
	if (area.tool == 2) {
		if (this.enabled == false) return;

		this.enabled = false;

		this.clearCanvas();

		// update the selection area

		this.topLeft = this.findNearestIntersection(this.topLeft);
		this.bottomRight = this.findNearestIntersection(this.bottomRight);
		this.drawSelectArea(this.topLeft, this.bottomRight);

		// update the cells
		this.cellTopLeft = this.convertIntersectionToCell(this.topLeft);
		this.cellBottomRight = this.convertIntersectionToCell(this.bottomRight);
		this.cellBottomRight = {x:this.cellBottomRight.x-1, y:this.cellBottomRight.y-1};

		// copy cells to selectionTopLeft and selectionBottomRight so that it can access last location
		this.selectionTopLeft = _.cloneDeep(this.cellTopLeft);
		this.selectionBottomRight = _.cloneDeep(this.cellBottomRight);

		// update selection
		this.selection = init2D(height, width, null);
		for (var y=this.cellTopLeft.y; y<=this.cellBottomRight.y; y++)
			for (var x=this.cellTopLeft.x; x<=this.cellBottomRight.x; x++) {
				this.selection[y - this.cellTopLeft.y][x - this.cellTopLeft.x] = area.grid[y][x];
			}
	}

	else if (area.tool == 3) {
		if (this.moveStart != null) {
			// step 1: find current point
			var boundingRect = get(area.id).getBoundingClientRect();
			var p = {x:e.clientX - boundingRect.left - this.borderSize/2, y:e.clientY - boundingRect.top - this.borderSize/2};

			// step 2: find delta
			var delta = {x: p.x - this.moveStart.x, y: p.y - this.moveStart.y};

			// step 3: calculate the new topleft and bottom right

			// exact values
			var newTopLeft = {x: this.topLeft.x + delta.x, y: this.topLeft.y + delta.y};
			var newBottomRight = {x: this.bottomRight.x + delta.x, y: this.bottomRight.y + delta.y};

			var points = this.forceNearestIntersection(newTopLeft, newBottomRight);
			this.newTopLeft = points.topLeft;
			this.newBottomRight = points.bottomRight;

			// step 4: find corresponding cells
			var newCellTopLeft = this.convertIntersectionToCell(this.newTopLeft);
			var newCellBottomRight = this.convertIntersectionToCell(this.newBottomRight);
			newCellBottomRight = {x:newCellBottomRight.x-1, y:newCellBottomRight.y-1};

			// only move selection if it is necessary
			if (this.cellTopLeft == newCellTopLeft && this.cellBottomRight == newCellBottomRight) {}
			else {
				// only redraw the selected area if it is necessary
				this.clearCanvas();
				this.drawSelectArea(this.newTopLeft, this.newBottomRight);

				this.cellTopLeft = newCellTopLeft;
				this.cellBottomRight = newCellBottomRight;
			}

			get(this.ele.id).children[0].style.cursor = "grab";
			this.moveStart = null;

			// step 1: undo the removal of the selection
			// step 2: perform removal but do not record as an action
			// step 3: place the selection at the intended move area
			// step 4: record step 2 and 3 as a single action, which is what it is supposed to be.

			actionreplay.undo();
			actionreplay.timeline.pop();

			for (let i=this.selectionTopLeft.y; i<=this.selectionBottomRight.y; i++)
				for (let j=this.selectionTopLeft.x; j<=this.selectionBottomRight.x; j++)
					// only erase if it was part of the original selection
					if (this.selection[i - this.selectionTopLeft.y][j - this.selectionTopLeft.x] != null) {
						area.grid[i][j] = null;
					}

			for (let i=this.cellTopLeft.y; i<=this.cellBottomRight.y; i++)
				for (let j=this.cellTopLeft.x; j<=this.cellBottomRight.x; j++)
					if (this.selection[i - this.cellTopLeft.y][j - this.cellTopLeft.x] != null)
						area.grid[i][j] = this.selection[i - this.cellTopLeft.y][j - this.cellTopLeft.x];

			area.updateGrid();

			// tentatively add state on every mouseup during move tool
			// there will need to be a check if the move tool actually changed anything
			// otherwise spam clicking will flood the history unnecessarily
			actionreplay.addState();

			// update "prev"
			// copy locations
			this.topLeft = _.cloneDeep(this.newTopLeft);
			this.bottomRight = _.cloneDeep(this.newBottomRight);

			// copy cells to selectionTopLeft and selectionBottomRight so that it can access last location
			this.selectionTopLeft = _.cloneDeep(this.cellTopLeft);
			this.selectionBottomRight = _.cloneDeep(this.cellBottomRight);
		}
	}
}