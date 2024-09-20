import { GIFEncoder } from '/gifenc/dist/gifenc.esm.js';


///////////////////////////////////////////////////////////////////////////////////////////////////////
// some variables
///////////////////////////////////////////////////////////////////////////////////////////////////////

let input, backgroundColor, images, frames, palette, blob, url, soepkipInterval, previousTouch, touchTimeout,
    soepkipLimit = getSoepkipLimit(),
    loadedChars = '',
    faviconIndex = 0,
    accentColor = randomColor();


const workerUrl = '/script/worker.js',
    totalFrames = 14,
    delay = 250,
    format = 'rgb444',
    rainbowColors = [[255, 109, 0], [255, 219, 0], [182, 255, 0], [73, 255, 0], [0, 255, 36], [0, 255, 146], [0, 255, 255], [0, 146, 255], [0, 36, 255], [73, 0, 255], [182, 0, 255], [255, 0, 219], [255, 0, 109], [255, 0, 0]],
    fonts = ['calibri', 'cascadiamono', 'chiller', 'comicsansms', 'consolas', 'cooperblack', 'copperplateblack', 'couriernew', 'digital7', 'futura', 'harlowsolid', 'helvetica', 'impact', 'itcavantgardegothic', 'jmhtypewriter', 'jokerman', 'kenteken', 'minecrafter', 'papyrus', 'qrfont', 'rijksoverheid', 'univers', 'wingdings'],
    soepkipTimeInterval = 75,
    synth = window.speechSynthesis;





const inputText = document.getElementById('input-text'),
    inputSubmit = document.getElementById('input-submit'),
    inputColor = document.getElementById('input-color'),
    inputRainbow = document.getElementById('input-rainbow'),
    rainbowLabel = document.getElementById('input-rainbow-label'),
    inputWarning = document.getElementById('input-warning'),
    loaderDiv = document.getElementById('loader'),
    outputDiv = document.getElementById('output'),
    progressBar = document.getElementById('progress-bar'),
    outputGif = document.getElementById('output-gif'),
    outputAnchor = document.getElementById('output-anchor'),
    outputSave = document.getElementById('output-save'),
    header = document.getElementById('header'),
    background = document.getElementById('background'),
    main = document.getElementsByTagName('main')[0],
    favicon = document.querySelector("link[rel='icon']");



///////////////////////////////////////////////////////////////////////////////////////////////////////
// set random accent color every 1s
///////////////////////////////////////////////////////////////////////////////////////////////////////

function randomColor() {
    const hue = Math.round(Math.random() * 360)
    const saturation = Math.round((Math.random() * 50) + 50)
    const lightness = 50;

    const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`

    function hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [255 * f(0), 255 * f(8), 255 * f(4)];
    }

    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    const rgb = hslToRgb(hue, saturation, lightness).map(x => Math.round(x));
    const hex = '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);

    return { hsl, rgb, hex }
}

document.documentElement.style.setProperty('--accent-color', accentColor.hsl);
if (inputColor) inputColor.value = accentColor.hex;

setInterval(() => {
    accentColor = randomColor();
    document.documentElement.style.setProperty('--accent-color', accentColor.hsl);
}, 1e3);






///////////////////////////////////////////////////////////////////////////////////////////////////////
// console spam
///////////////////////////////////////////////////////////////////////////////////////////////////////

setInterval(() => {
    console.clear();
    const lines = [
        '      _/_/_/    _/_/    _/_/_/_/  _/_/_/    _/    _/  _/_/_/  _/_/_/                      _/_/    ',
        '   _/        _/    _/  _/        _/    _/  _/  _/      _/    _/    _/      _/      _/  _/    _/   ',
        '    _/_/    _/    _/  _/_/_/    _/_/_/    _/_/        _/    _/_/_/        _/      _/      _/      ',
        '       _/  _/    _/  _/        _/        _/  _/      _/    _/              _/  _/      _/         ',
        '_/_/_/      _/_/    _/_/_/_/  _/        _/    _/  _/_/_/  _/                _/      _/_/_/_/      '
    ];

    lines.forEach((line, index) => {
        setTimeout(() => { console.info(line) }, (index + 1) * 150);
    });
}, 10e3);







///////////////////////////////////////////////////////////////////////////////////////////////////////
// background
///////////////////////////////////////////////////////////////////////////////////////////////////////

function createSoepkip() {
    if (!background) return clearInterval(soepkipInterval);
    if (background.childElementCount >= soepkipLimit) return clearInterval(soepkipInterval);


    const div = document.createElement('div');

    div.classList.add('soepkip');
    div.ondragstart = () => { return false; }
    div.ariaHidden = 'true';

    // randomize
    div.innerText = background.childElementCount % 2 ? 'kip' : 'soep';
    div.classList.add(randomItem(fonts));
    if (randomItem([true, false, false])) div.classList.add('bold');
    if (randomItem([true, false, false])) div.classList.add('italic');
    if (randomItem([true, false, false])) div.classList.add('underlined');
    div.classList.add(randomItem(['lowercase', 'uppercase', 'capitalize']));
    div.style.fontSize = ((Math.random() * 3) + .8).toFixed(2) + 'em';
    randomItem([true, false]) ? div.style.color = randomColor().hsl : div.style.backgroundColor = randomColor().hsl;
    if (!div.style.color) div.classList.add(randomItem(['white', 'black']));
    randomItem([true, false]) ? div.style.left = (Math.random() * 100).toFixed(3) + '%' : div.style.right = (Math.random() * 100).toFixed(3) + '%';
    randomItem([true, false]) ? div.style.top = (Math.random() * 100).toFixed(3) + '%' : div.style.bottom = (Math.random() * 100).toFixed(3) + '%';

    background.append(div);

    const rect = div.getBoundingClientRect();
    const side = rect.left + rect.width / 2 > innerWidth / 2 ? 'right' : 'left';
    div.dataset.side = side;
    div.onclick = clickSoepkip;
}

async function clickSoepkip(event) {
    // play sound
    new Audio(`/media/${event.target.innerText.toLowerCase()}.mp3`).play();

    // remove element
    await removeSoepkip(event.target);

    if (background.childElementCount !== 0) return;

    // if all the soepkips have been clicked away we show very cool video
    const v = document.createElement('video');
    v.src = '/media/je-bent-een-soepkip.mp4';
    v.autoplay = true;
    v.controls = false;
    v.muted = false;
    v.style.position = 'fixed';
    v.style.zIndex = 2;
    v.style.width = '100%';
    v.style.height = '100%';
    v.style.objectFit = 'fill';
    v.style.cursor = 'none';
    document.body.append(v);
}

function removeSoepkip(div) {
    // animate the thing away
    div.classList.add(`slide-to-the-${div.dataset.side}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            div.remove();
            resolve();
        }, 1e3);
    });
}

function getSoepkipLimit() {
    const limit = Math.round((innerWidth * innerHeight) / 1300);
    return limit;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

soepkipInterval = setInterval(createSoepkip, soepkipTimeInterval);








///////////////////////////////////////////////////////////////////////////////////////////////////////
// main gif function
///////////////////////////////////////////////////////////////////////////////////////////////////////

async function createGif() {

    // remove background elements
    clearInterval(soepkipInterval);
    const soepkippen = background.children;
    for (let i = 0; i < background.childElementCount; i++) {
        removeSoepkip(soepkippen[i]);
    }

    // make gif
    input = getInput();

    images = loadImages();

    frames = await createFrames();

    palette = generatePalette();

    blob = await encodeGif();

    displayResult();

    // resume background spam
    soepkipInterval = setInterval(createSoepkip, soepkipTimeInterval);
}

function getInput() {
    if (!/^[A-Za-z!? .$&@\d]*$/.test(inputText.value)) return;

    header.hidden = true;
    outputDiv.hidden = true;

    inputText.disabled = true;
    inputSubmit.disabled = true;
    inputColor.disabled = true;
    inputRainbow.disabled = true;

    // remove previous blob url if it exists
    if (url) URL.revokeObjectURL(url);

    // progress is updated once when all the frames are generated, and when each frame of the gif is rendered 
    progressBar.max = totalFrames + 1;
    progressBar.value = 0;
    loaderDiv.hidden = false;

    // get options
    const text = inputText.value.toLowerCase();
    const int = parseInt(inputColor.value.replace('#', ''), 16);
    const color = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
    const rainbow = inputRainbow.checked;

    // set transparent color dependant on color
    backgroundColor = color[0] < 16 && color[1] > 239 && color[2] < 16 ? [0, 0, 255] : [0, 255, 0];

    return { text, color, rainbow }
}

function loadImages() {
    const images = {};

    for (const char of input.text) {
        if (!images[char]) {
            const img = new Image;
            img.src = `/media/letters/arg-${char.replaceAll('?', '_')}-0.png`;
            images[char] = img;
        }
    }
    return images;
}

async function createFrames() {
    const frames = [];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });


    // determine dimensions for the gif
    let width = 0, height = 0;

    for (const char of input.text) {
        // load the image
        await images[char].decode();

        width = width + images[char].width / 14;
        height = images[char].height > height ? images[char].height : height;
    }

    canvas.width = width;
    canvas.height = height;


    for (let frameIndex = 0; frameIndex < 14; frameIndex++) {
        let frame;

        ctx.fillStyle = `rgb(${backgroundColor[0]}, ${backgroundColor[1]}, ${backgroundColor[2]})`;
        ctx.fillRect(0, 0, width, height);
        let widthOffset = 0;


        for (let charIndex = 0; charIndex < input.text.length; charIndex++) {
            const char = input.text[charIndex];
            const image = images[char];

            // determine what colors this letter should have
            const frontColor = input.rainbow ? rainbowColors[(frameIndex + charIndex) % 14] : input.color;
            const sideColor = frontColor.map(x => Math.round(x * 0.8));


            // draw part of the image onto the canvas
            const sx = image.width / 14 * frameIndex,
                sy = 0,
                sw = image.width / 14,
                sh = image.height,
                dx = widthOffset,
                dy = canvas.height - image.height,
                dw = image.width / 14,
                dh = image.height;

            ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);


            // change color of letters
            const imageData = ctx.getImageData(dx, dy, dw, dh);

            // iterate over pixels
            for (let index = 0; index < imageData.data.length; index += 4) {

                const red = imageData.data[index];
                const green = imageData.data[index + 1];
                const blue = imageData.data[index + 2];
                const alpha = imageData.data[index + 3];

                // change the front of the letters
                if (red === 240 && green === 0 && blue === 0 && alpha === 255) {
                    imageData.data[index] = frontColor[0];
                    imageData.data[index + 1] = frontColor[1];
                    imageData.data[index + 2] = frontColor[2];
                }

                // change the sides of the letters
                if (red === 192 && green === 0 && blue === 0 && alpha === 255) {
                    imageData.data[index] = sideColor[0];
                    imageData.data[index + 1] = sideColor[1];
                    imageData.data[index + 2] = sideColor[2];
                }
            }

            ctx.putImageData(imageData, dx, dy);


            // adjust widthOffset for the next letter
            widthOffset += image.width / 14;
        }

        frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(frame);
    }

    progressBar.value++
    return frames;
}

function generatePalette() {
    // every gif has these colors
    const palette = [[0, 0, 0], [0, 240, 80], [144, 80, 192], [208, 128, 0], [255, 255, 255]];

    // add chosen colors to palette
    if (input.rainbow) {
        rainbowColors.forEach(color => {
            palette.push(color);
            palette.push(color.map(x => Math.round(x * 0.8)));
        });
    } else {
        palette.push(input.color);
        palette.push(input.color.map(x => Math.round(x * 0.8)));
    }

    // add background color at index 0
    palette.unshift(backgroundColor);

    return palette;
}

async function encodeGif() {

    const encoder = await spawnWorkers(4);


    // add every frame to the encoder
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
        const frame = frames[frameIndex];

        // Get RGBA data from canvas
        const data = frame.data;

        // Send data to worker
        encoder.addFrame(data, frameIndex);

        // Wait a tick so that we don't lock up browser
        await new Promise(resolve => setTimeout(resolve, 0));
    }


    // Get the resulting buffer
    const buffer = await encoder.finish();
    const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: 'image/gif' });

    return blob;


    async function spawnWorkers(workerCount) {

        const width = frames[0].width,
            height = frames[0].height,
            maxColors = 256;


        const workers = new Array(workerCount).fill(null).map(() => {
            return new Worker(workerUrl, { type: 'module' });
        });


        let workerIndex = 0;


        // send encoder options to each worker
        workers.forEach(w => {
            w.postMessage({
                event: 'init',
                format,
                delay,
                width,
                height,
                palette
            });
        });


        // wait for all workers to be ready
        await Promise.all(workers.map(w => waitForReady(w)));

        const gif = GIFEncoder({ auto: false });

        return {
            addFrame(data, frame) {
                // We cycle through all workers uniformly
                const worker = workers[(workerIndex++) % workers.length];
                // Send data to worker
                worker.postMessage([data, frame], [data.buffer]);
                frames[frame] = waitForFrame(worker, frame).then(event => {
                    const [data, frame] = event.data;

                    progressBar.value++;

                    return data;
                });
            },

            async finish() {
                // Once all chunks are ready
                const chunks = await Promise.all(frames);

                // Write the header first
                gif.writeHeader();

                // Now we can write each chunk
                for (let i = 0; i < chunks.length; i++) {
                    gif.stream.writeBytesView(chunks[i]);
                }

                // Finish the GIF
                gif.finish();

                // Close workers
                workers.forEach(w => w.terminate())
                workers.length = 0;

                // Return bytes
                return gif.bytesView();
            }
        };

        function waitForReady(worker) {
            return new Promise((resolve) => {
                const handler = (event) => {
                    if (event.data === 'ready') {
                        worker.removeEventListener('message', handler);
                        resolve(event);
                    }
                };
                worker.addEventListener('message', handler, { passive: true });
            });
        }

        function waitForFrame(worker, frame) {
            return new Promise((resolve) => {
                const handler = (event) => {
                    if (event.data[1] === frame) {
                        worker.removeEventListener('message', handler);
                        resolve(event);
                    }
                };
                worker.addEventListener('message', handler, { passive: true });
            });
        }
    }
}

function displayResult() {
    url = URL.createObjectURL(blob);

    outputGif.alt = `dansende letters die '${input.text}' uitspellen`;
    outputGif.src = url;
    outputGif.title = input.text;

    outputAnchor.download = input.text.replaceAll('?', '').replaceAll('.', '').trim().replaceAll(' ', '-');
    outputAnchor.href = url;

    loaderDiv.hidden = true;
    inputText.disabled = false;
    inputSubmit.disabled = false;
    inputColor.disabled = false;
    inputRainbow.disabled = false;
    outputDiv.hidden = false;
    inputText.select();
}








///////////////////////////////////////////////////////////////////////////////////////////////////////
// EVENT listeners
///////////////////////////////////////////////////////////////////////////////////////////////////////

// submit button 
inputSubmit?.addEventListener('click', createGif);

// adjust amount of soepkips based on window size on resize
window.addEventListener('resize', function (event) {
    soepkipLimit = getSoepkipLimit();

    clearInterval(soepkipInterval);
    soepkipInterval = setInterval(createSoepkip, soepkipTimeInterval);
});

// add download button functionality
outputSave?.addEventListener('click', function (event) {
    outputAnchor.click();
});

// copy to clipboard (IF CLIPBOARD SUPPORTED GIFS)
// outputCopy.addEventListener('click', async function (event) {
//     await navigator.clipboard.write([
//         new ClipboardItem({
//             [blob.type]: blob,
//         }),
//     ]);
// });

// click submit if enter is pressed
inputText?.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') inputSubmit.click();
});

// load chars as input is being typed typed
inputText?.addEventListener('input', function (event) {
    if (!event.data) return;

    if (!/^[A-Za-z!? .$&@\d]*$/.test(event.data)) return;

    const char = event.data.toLowerCase().replaceAll('?', '_');

    if (loadedChars.includes(char)) return;

    fetch(`/media/letters/arg-${char}-0.png`);
    loadedChars += char;
});

// enable submit button if input is valid, show warning otherwise
inputText?.addEventListener('input', function (event) {
    if (this.value === '') {
        inputSubmit.disabled = true;
        inputWarning.hidden = true
        return
    }

    if (!/^[A-Za-z!? .$&@\d]*$/.test(this.value)) {
        inputSubmit.disabled = true

        let forbiddenChars = '';
        for (let i of this.value.matchAll(/[^A-Za-z!? .$&@\d]/g)) {
            forbiddenChars += i[0];
        };
        inputWarning.innerText = `'${forbiddenChars}' niet toegestaan`;
        inputWarning.hidden = false;
        return;
    }

    inputSubmit.disabled = false;
    inputWarning.hidden = true
});

// enable rainbow animation on rainbow label
inputRainbow?.addEventListener('input', function (event) {
    const checked = this.checked;
    for (let i = rainbowLabel.children.length - 1; i >= 0; i--) {
        setTimeout(() => {
            checked ? rainbowLabel.children[i].classList.add('rainbow') : rainbowLabel.children[i].classList.remove('rainbow');
        }, (rainbowLabel.children.length - i) * 250);
    }
});

// change color of color label and accent color on color change
inputColor?.addEventListener('input', function (event) {
    colorLabel.style.color = this.value;
    document.documentElement.style.setProperty('--accent-color', this.value);
});

// make main draggable
main.addEventListener('mousedown', function (event) {
    if (event.target.classList.contains('draggable')) {
        event.preventDefault();
        main.addEventListener('mousemove', onDrag);
    }
});
window.addEventListener('mouseup', function (event) {
    main.removeEventListener('mousemove', onDrag);
});
window.addEventListener('touchmove', function (event) {
    if (event.changedTouches[0].target.classList.contains('draggable')) {
        clearTimeout(touchTimeout);

        if (previousTouch) {
            event.movementX = event.changedTouches[0].pageX - previousTouch.pageX;
            event.movementY = event.changedTouches[0].pageY - previousTouch.pageY;
            onDrag(event);
        }

        previousTouch = event.changedTouches[0];

        // reset previous touch after certain timeout to reset grabbing point
        touchTimeout = setTimeout(() => { previousTouch = undefined; }, 300);
    }
});
function onDrag(event) {
    event.preventDefault();

    const newX = parseInt(main.dataset.translateX || 0) + event.movementX;
    const newY = parseInt(main.dataset.translateY || 0) + event.movementY;

    main.dataset.translateX = newX;
    main.dataset.translateY = newY;
    main.style.transform = `translate(${newX}px, ${newY}px)`;
}

// tts input
inputSubmit?.addEventListener('click', function (event) {
    const utterance = new SpeechSynthesisUtterance(input.text);
    synth.speak(utterance);
});






///////////////////////////////////////////////////////////////////////////////////////////////////////
// favicon animation
///////////////////////////////////////////////////////////////////////////////////////////////////////

async function generateFaviconFrames() {
    const faviconURL = '/media/favicon-anim.png';
    const faviconFrames = [];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    const img = new Image();
    img.src = faviconURL;
    await img.decode();

    for (let i = 0; i < 14; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, i * 64, 0, 64, 64, 0, 0, 64, 64);

        faviconFrames.push(canvas.toDataURL('image/png'));
    }

    return faviconFrames;
}
function changeFavicon(frames) {
    favicon.href = frames[faviconIndex];

    faviconIndex = faviconIndex < 13 ? faviconIndex + 1 : 0;
}

generateFaviconFrames()
    .then(frames => setInterval(changeFavicon, 500, frames));







///////////////////////////////////////////////////////////////////////////////////////////////////////
// 404 redirect (is just here to preserve original code)
///////////////////////////////////////////////////////////////////////////////////////////////////////

/*
// if the path already matches /404 or /40404... add another 04
if (/\/(40)+4$/.test(window.location.pathname)) {
    setTimeout(() => { window.location.href = window.location.pathname + '04'; }, 10e3);
} else {
    // otherwise just /404
    window.location.href = '/404';
}
*/
