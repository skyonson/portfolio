let args = new URL(document.URL);


const renderScale = args.searchParams.has("renderScale")
? parseFloat(args.searchParams.get("renderScale"))
: .1;
let x = args.searchParams.has("cX")
? parseFloat(args.searchParams.get("cX"))
: -0.765;
let y = args.searchParams.has("cY")
? parseFloat(args.searchParams.get("cY"))
: 0.0;
let w = args.searchParams.has("w")
? parseFloat(args.searchParams.get("w"))
: 2.5;
let m = args.searchParams.has("m")
? parseFloat(args.searchParams.get("m"))
: 512;
let seed = args.searchParams.has("seed")
? parseFloat(args.searchParams.get("seed"))
: Math.random()
noise.seed(seed);


const importObject = {
    module: {},
    env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
    },
};

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        (s = h.s), (v = h.v), (h = h.h);
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

class MandelBrot {
    constructor(center, width, resolutionDimensions) {
        this.mandel = document.createElement("canvas");
        this.mandelCTX = this.mandel.getContext("2d");
        this.dimensions = resolutionDimensions;
        this.mandel.width = resolutionDimensions.x;
        this.mandel.height = resolutionDimensions.y;
        this.mandel.classList.add("fractalView");
        this.center = center;
        this.width = width;
        this.iters = new Array(this.mandel.width * this.mandel.height);
        this.rendered = new Array(this.mandel.width * this.mandel.height);
        this.maxIters = m;

        this.tempImg = this.mandelCTX.createImageData(
            this.mandel.width,
            this.mandel.height
        );
        this.zoomWidth = this.width;
        this.zoomPrev = 0.0;

        this.refinementLevel = Math.max(Math.pow(
            2,
            Math.floor(Math.log2(this.dimensions.y) - 2)
        ), 2);
        this.offset = 0;
        this.jump = this.refinementLevel;
        this.coords = this.genCoords();
        this.colors = this.genColors();
    }
    genColors() {
        let cols = [{ r: 0, g: 0, b: 0 }];
        for (let i = 1; i < this.maxIters + 1; i++) {
            cols.push({
                r: Math.abs(Math.floor(noise.perlin2(Math.log2(i + 10), .5)* 255)),
                g: Math.abs(Math.floor(noise.perlin2(Math.log2(i + 10), .2)* 255)),
                b: Math.abs(Math.floor(noise.perlin2(Math.log2(i + 10), .7)* 255)),
            });
        }
        return cols;
    }
    draw() {
        let j, x, y;
        for (let i = 0; i < this.iters.length; i++) {
            // tempImg.data[i * 4 + 0] = Math.floor(
            //     Math.sqrt(remap(this.iters[i], 0, this.maxIters, 0, 1)) *
            //         255
            // );
            // tempImg.data[i * 4 + 1] = Math.floor(
            //     Math.sqrt(remap(this.iters[i], 0, this.maxIters, 0, 1)) *
            //         255
            // );
            // tempImg.data[i * 4 + 2] = Math.floor(
            //     Math.sqrt(remap(this.iters[i], 0, this.maxIters, 0, 1)) *
            //         255
            // );
            if (this.rendered[i]) {
                if (this.iters[i] && this.iters[i] < this.colors.length) {
                    this.tempImg.data[i * 4 + 0] = this.colors[this.iters[i]].r;
                    this.tempImg.data[i * 4 + 1] = this.colors[this.iters[i]].g;
                    this.tempImg.data[i * 4 + 2] = this.colors[this.iters[i]].b;
                } else {
                    this.tempImg.data[i * 4 + 0] = 0;
                    this.tempImg.data[i * 4 + 1] = 0;
                    this.tempImg.data[i * 4 + 2] = 0;
                }
            } else {
                x = Math.floor((i % this.dimensions.x) / this.jump) * this.jump;
                y = Math.floor(i / this.dimensions.x / this.jump) * this.jump;
                j = x + y * this.dimensions.x;
                if (this.iters[j] && this.iters[j] < this.colors.length) {
                    this.tempImg.data[i * 4 + 0] = this.colors[this.iters[j]].r;
                    this.tempImg.data[i * 4 + 1] = this.colors[this.iters[j]].g;
                    this.tempImg.data[i * 4 + 2] = this.colors[this.iters[j]].b;
                } else {
                    this.tempImg.data[i * 4 + 0] = 0;
                    this.tempImg.data[i * 4 + 1] = 0;
                    this.tempImg.data[i * 4 + 2] = 0;
                }
            }
            this.tempImg.data[i * 4 + 3] = 255;
        }
        this.mandelCTX.putImageData(this.tempImg, 0, 0);
    }
    calcIters() {
        for (let x = this.offset % 2; x < this.dimensions.x; x += this.jump) {
            for (
                let y = this.offset > 1 ? 1 : 0;
                y < this.dimensions.y;
                y += this.jump
            ) {
                if (
                    this.coords.x[x] &&
                    this.coords.y[y] &&
                    !this.rendered[x + y * this.dimensions.x]
                )
                    this.iters[x + y * this.dimensions.x] = calcPointIters(
                        this.coords.x[x],
                        this.coords.y[y],
                        this.maxIters
                    );
                this.rendered[x + y * this.dimensions.x] = true;
            }
        }
    }
    genCoords() {
        let coords = {
            x: new Array(this.dimensions.x),
            y: new Array(this.dimensions.y),
        };
        let width = this.dimensions.x;
        let height = this.dimensions.y;
        let newMinX = this.center.x - this.width / 2;
        let newMaxX = this.center.x + this.width / 2;
        let newMinY = this.center.y - (this.width * (height / width)) / 2;
        let newMaxY = this.center.y + (this.width * (height / width)) / 2;

        for (let i = 0; i < coords.x.length; i++) {
            coords.x[i] = remap(i, 0, width, newMinX, newMaxX);
        }
        for (let i = 0; i < coords.y.length; i++) {
            coords.y[i] = remap(i, 0, height, newMinY, newMaxY);
        }
        return coords;
    }
}

let fractal = new MandelBrot({ x: x, y }, w, {
    x: Math.floor(window.innerWidth * renderScale),
    y: Math.floor(window.innerHeight * renderScale),
});

// let fractal = new MandelBrot({ x: -0.765, y: 0.0 }, 2.5, {
//     x: 640,
//     y: 480,
// });
fractal.mandel.style.width = `${fractal.dimensions.x / renderScale}px`;
fractal.mandel.style.height = `${fractal.dimensions.y / renderScale}px`;
document.body.appendChild(fractal.mandel);

WebAssembly.instantiateStreaming(fetch("code.wasm"), importObject).then(
    (prog) => {
        calcPointIters = prog.instance.exports.calcPointIters;
        remap = prog.instance.exports.remap;
    }
);

requestAnimationFrame(drawLoop);

function remap(i, oldMin, oldMax, newMin, newMax) {
    return (i / (oldMax - oldMin)) * (newMax - newMin) + newMin;
}

function calcPointIters(x0, y0, maxIters) {
    let x = 0;
    let y = 0;

    let iteration = 0;
    let xTemp;
    while (x * x + y * y <= 4 && iteration < maxIters) {
        xTemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xTemp;
        iteration++;
    }
    return iteration % maxIters;
}

fractal.mandel.onclick = function (e) {
    const rect = fractal.mandel.getBoundingClientRect();
    fractal.center = {
        x: remap(
            e.clientX - rect.left,
            0,
            fractal.mandel.width / renderScale,
            fractal.center.x - fractal.width / 2,
            fractal.center.x + fractal.width / 2
        ),
        y: remap(
            e.clientY - rect.top,
            0,
            fractal.mandel.height / renderScale,
            fractal.center.y -
                (fractal.width *
                    (fractal.dimensions.y / fractal.dimensions.x)) /
                    2,
            fractal.center.y +
                (fractal.width *
                    (fractal.dimensions.y / fractal.dimensions.x)) /
                    2
        ),
    };
    fractal.jump = fractal.refinementLevel / 2;
    fractal.offset = 0;

    fractal.rendered = new Array(fractal.mandel.width * fractal.mandel.height);
    fractal.coords = fractal.genCoords();
};
fractal.mandel.onwheel = function (e) {
    fractal.width *= e.deltaY > 0 ? 10 / 9 : 9 / 10;
    fractal.offset = 0;
    fractal.jump = fractal.refinementLevel;
    fractal.rendered = new Array(fractal.mandel.width * fractal.mandel.height);
    fractal.coords = fractal.genCoords();
};

document.body.onkeydown = function (e) {
    // console.log(e.code)
    if (e.code == "Digit0") {
        // full res - P
        if (renderScale != 0.1)
            window.location.href = `${args.origin}${args.pathname}?cX=${fractal.center.x}&cY=${fractal.center.y}&w=${fractal.width}&m=${fractal.maxIters}&seed=${seed}&renderScale=0.1`;
    }
    if (e.code == "Digit1") {
        // 1x render - 1
        if (renderScale != 1)
            window.location.href = `${args.origin}${args.pathname}?cX=${fractal.center.x}&cY=${fractal.center.y}&w=${fractal.width}&m=${fractal.maxIters}&seed=${seed}&renderScale=1 `;
    }
    if (e.code == "Digit2") {
        // 2x render - 2
        if (renderScale != 2)
            window.location.href = `${args.origin}${args.pathname}?cX=${fractal.center.x}&cY=${fractal.center.y}&w=${fractal.width}&m=${fractal.maxIters}&seed=${seed}&renderScale=2 `;
    }
    if (e.code == "Digit3") {
        // 3x render - 3
        if (renderScale != 3)
            window.location.href = `${args.origin}${args.pathname}?cX=${fractal.center.x}&cY=${fractal.center.y}&w=${fractal.width}&m=${fractal.maxIters}&seed=${seed}&renderScale=3 `;
    }
    if (e.code == "KeyR") {
        // reset - R
        fractal.center = { x: x, y: y };
        fractal.width = w;
        fractal.maxIters = m;
        fractal.colors = fractal.genColors();
        fractal.coords = ge;
        fractal.coords = fractal.genCoords();
        fractal.jump = fractal.refinementLevel / 2;
        fractal.offset = 0;
    }
    if (e.code == "Space") {
        // zoom - space
        requestAnimationFrame(zoomReady);
    }
    if (e.code == "NumpadAdd") {
        for (let i = 0; i < fractal.rendered.length; i++) {
            fractal.rendered[i] = fractal.iters[i] != 0 && fractal.rendered[i];
        }
        fractal.maxIters *= 2;
        fractal.colors = fractal.genColors();
        fractal.jump = fractal.refinementLevel / 2;
        fractal.offset = 0;
    }
    if (e.code == "NumpadSubtract") {
        fractal.maxIters /= 2;
        fractal.jump = fractal.refinementLevel / 2;
        fractal.offset = 0;
        fractal.rendered = new Array(
            fractal.mandel.width * fractal.mandel.height
        );
    }
};

function zoomReady() {
    fractal.zoomWidth = fractal.width;
    // this.zoomPrev = t;
    fractal.width = 4.0;
    fractal.rendered = new Array(fractal.mandel.width * fractal.mandel.height);
    requestAnimationFrame(zoom);
}
function zoom() {
    // let delta = t - this.prev;
    // this.width -= this.width * (1 - 0.5 * delta);
    if (fractal.jump > 2) {
        fractal.jump /= 2;
        fractal.calcIters();
    } else if (fractal.jump == 2 && fractal.offset < 3) {
        fractal.offset++;
        fractal.calcIters();
    } else if (fractal.jump == 2 && fractal.offset == 3) {
        fractal.draw();
        fractal.offset = 0;
        fractal.jump = fractal.refinementLevel;

        fractal.width *= 0.95;
        fractal.rendered = new Array(
            fractal.mandel.width * fractal.mandel.height
        );
        fractal.coords = fractal.genCoords();
    }
    if (fractal.width > fractal.zoomWidth) {
        requestAnimationFrame(zoom);
    } else {
        // fractal.jump = fractal.refinementLevel / 2;
    }
}

function drawLoop() {
    if (fractal.jump > 2) {
        fractal.jump /= 2;
        fractal.calcIters();
        fractal.draw();
    } else if (fractal.jump == 2 && fractal.offset < 3) {
        fractal.jump = 2;
        fractal.offset++;
        fractal.calcIters();
        fractal.draw();
    }
    requestAnimationFrame(drawLoop);
}
