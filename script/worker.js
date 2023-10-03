import { GIFEncoder, applyPalette } from '/gifenc/dist/gifenc.esm.js';

let options;

self.addEventListener('message', event => {
    const detail = event.data;

    if (detail.event === 'init') {
        // Upon init, save our options
        options = { ...detail };

        // And send back a ready event
        self.postMessage('ready');

        return;
    }

    
    // Get the data + index for this frame
    const [data, frame] = detail;

    // Now get an indexed bitmap image
    const index = applyPalette(data, options.palette, options.format);

    // Encode into a single GIF frame chunk
    const gif = GIFEncoder({ auto: false });
    gif.writeFrame(index, options.width, options.height, {
        first: frame === 0,
        delay: options.delay,
        palette: frame === 0 ? options.palette : null,
        transparent: true,
        transparentIndex: 0
    });

    // Send the result back ot main thread
    const output = gif.bytesView();
    self.postMessage([output, frame], [output.buffer]);

});