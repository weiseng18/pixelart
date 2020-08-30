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