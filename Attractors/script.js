const itersPerLoad = 1e5;

const boundPadding = 0.25;

const previewWidth = 160;
const previewHeight = 120;

let isRender = false;

function CliffordStep(a, b, c, d, x, y) {
    let newX = Math.sin(a * y) + c * Math.cos(a * x);
    let newY = Math.sin(b * x) + d * Math.cos(b * y);
    return [newX, newY];
}

// for (let i = 0; i < 10000000; i++) {

//     // con.fillRect(
//     //     remap(x, -10, 10, width / 2, width),
//     //     remap(y, -10, 10, width / 2, height),
//     //     1,
//     //     1
//     // );

//     minX = x < minX ? x : minX;
//     maxX = x > maxX ? x : maxX;
//     minY = y < minY ? y : minY;
//     maxY = y > maxY ? y : maxY;
// }

// can.width = width;
// can.height =
//     width *
//     ((maxY + boundPadding - (minY - boundPadding)) /
//         (maxX + boundPadding - (minX - boundPadding)));

// let con = can.getContext("2d");

// let accumulator = new Array(Math.floor(can.width * can.height));

// for (let n = 0; n < accumulator.length; n++) {
//     accumulator[n] = 0;
// }

function frame(time) {
    // a = -Math.sin(time * 0.00001) * 3;
    let xIndex = 0;
    let yIndex = 0;

    for (let i = 0; i < itersPerLoad; i++) {
        newX = Math.sin(a * y) + c * Math.cos(a * x);
        newY = Math.sin(b * x) + d * Math.cos(b * y);
        x = newX;
        y = newY;

        xIndex = remap(
            x,
            minX - boundPadding,
            maxX + boundPadding,
            0,
            can.width
        );
        yIndex = remap(
            y,
            minY - boundPadding,
            maxY + boundPadding,
            0,
            can.height
        );

        accumulator[Math.floor(xIndex) + Math.floor(yIndex) * width]++;
        // accumulator[Math.floor(xIndex) + Math.floor(yIndex) * width] +=
        //     (1 - (xIndex % 1)) * (1 - (yIndex % 1));
        // accumulator[Math.floor(xIndex) + 1 + Math.floor(yIndex) * width] +=
        //     (xIndex % 1) * (1 - (yIndex % 1));
        // accumulator[Math.floor(xIndex) + (Math.floor(yIndex) + 1) * width] +=
        //     (1 - (xIndex % 1)) * (yIndex % 1);
        // accumulator[
        //     Math.floor(xIndex) + 1 + (Math.floor(yIndex) + 1) * width
        // ] += (xIndex % 1) * (yIndex % 1);
        // con.fillRect(
        //     remap(x, minX, maxX, 0, can.width),
        //     remap(y, minY, maxY, 0, can.height),
        //     1,
        //     1
        // );
    }
    itersCompleted += itersPerLoad;
    if (autoRefresh && Math.log2(itersCompleted) >= nextRefresh) {
        draw();
        nextRefresh++;
    }
    document.getElementById(
        "loader"
    ).innerText = `${itersCompleted.toExponential()}`;
    requestAnimationFrame(frame);
}

function draw() {
    // con.clearRect(0, 0, can.width, can.height);
    let tempImg = con.createImageData(can.width, can.height);
    let max = -Infinity;
    let min = Infinity;
    for (let n = 0; n < accumulator.length; n++) {
        if (accumulator[n] > max) max = accumulator[n];
        if (accumulator[n] < min && accumulator[n] > 0) min = accumulator[n];
    }
    max -= min;
    let shade = 0;

    for (let i = 0; i < can.width * can.height; i++) {
        if (accumulator[i] != 0) {
            shade = Math.floor(
                Math.pow((accumulator[i] - min) / max, 0.15) * 255
            );

            tempImg.data[i * 4 + 0] = 255 - shade;
            tempImg.data[i * 4 + 1] = shade;
            tempImg.data[i * 4 + 2] = shade;
            tempImg.data[i * 4 + 3] = 255;
            // con.fillStyle = `#00${shade.toString(16).padStart(2, "0")}${shade
            //     .toString(16)
            //     .padStart(2, "0")}`;
            // con.fillRect(
            //     i % can.width,
            //     (i - (i % can.width)) / can.width,
            //     1,
            //     1
            // );
        }
    }
    con.putImageData(tempImg, 0, 0);
    document.title = itersCompleted.toExponential();
}

function remap(i, oldMin, oldMax, newMin, newMax) {
    return newMin + ((i - oldMin) * (newMax - newMin)) / (oldMax - oldMin);
}

class Attractor {
    constructor() {
        this.A = parseFloat(document.getElementById("ANumber").value);
        this.B = parseFloat(document.getElementById("BNumber").value);
        this.C = parseFloat(document.getElementById("CNumber").value);
        this.D = parseFloat(document.getElementById("DNumber").value);

        this.x = 0.1;
        this.y = 0.1;

        this.width = parseInt(document.getElementById("width").value);
        this.height = parseInt(document.getElementById("height").value);

        this.renderCanvas = document.getElementById("output");
        this.renderContext = this.renderCanvas.getContext("2d");

        this.renderCanvas.width = this.width;
        this.renderCanvas.height = this.height;

        this.renderAccumulator = new Array(this.width * this.height);
        for (let n = 0; n < this.renderAccumulator.length; n++) {
            this.renderAccumulator[n] = 0;
        }

        this.previewCanvas = document.getElementById("preview");
        this.previewContext = this.previewCanvas.getContext("2d");

        this.previewCanvas.width = previewWidth;
        this.previewCanvas.height = previewHeight;

        this.previewAccumulator = new Array(previewWidth * previewHeight);
        for (let n = 0; n < this.previewAccumulator.length; n++) {
            this.previewAccumulator[n] = 0;
        }

        [this.xOffset, this.yOffset, this.xScalar, this.yScalar] =
            this.calcMap();
        this.itersCompleted = 0;

        this.nextDraw = Math.log2(itersPerLoad);

        this.contrast = parseFloat(
            document.getElementById("contrastSlider").value
        );

        this.rModifier = parseFloat(document.getElementById("rSlider").value);
        this.gModifier = parseFloat(document.getElementById("gSlider").value);
        this.bModifier = parseFloat(document.getElementById("bSlider").value);

        this.rInvert = document.getElementById("rInvert").checked;
        this.gInvert = document.getElementById("gInvert").checked;
        this.bInvert = document.getElementById("bInvert").checked;

        this.cellsFilled = 0;
    }
    preview() {
        let x = 0.1;
        let y = 0.1;
        let [xOffset, yOffset, xScalar, yScalar] = this.calcPreviewMap();
        let xInd = 0;
        let yInd = 0;
        for (let i = 0; i < 1000000; i++) {
            [x, y] = CliffordStep(this.A, this.B, this.C, this.D, x, y);
            xInd = Math.floor((x - xOffset) * xScalar);
            yInd = Math.floor((y - yOffset) * yScalar);
            // console.log(xInd, yInd)
            this.previewAccumulator[xInd + previewWidth * yInd]++;
        }
        let max = Math.max(...this.previewAccumulator);
        let min = Math.min.apply(null, this.previewAccumulator.filter(Boolean));
        let tempImg = this.previewContext.createImageData(
            previewWidth,
            previewHeight
        );

        let shade = 0;
        for (let i = 0; i < previewWidth * previewHeight; i++) {
            if (this.previewAccumulator[i] != 0) {
                shade = Math.pow(
                    (this.previewAccumulator[i] - min) / max,
                    this.contrast
                );

                tempImg.data[i * 4 + 0] = Math.floor(
                    (this.rInvert
                        ? 1 - Math.pow(shade, this.rModifier)
                        : Math.pow(shade, this.rModifier)) * 255
                );
                tempImg.data[i * 4 + 1] = Math.floor(
                    (this.gInvert
                        ? 1 - Math.pow(shade, this.gModifier)
                        : Math.pow(shade, this.gModifier)) * 255
                );
                tempImg.data[i * 4 + 2] = Math.floor(
                    (this.bInvert
                        ? 1 - Math.pow(shade, this.bModifier)
                        : Math.pow(shade, this.bModifier)) * 255
                );
                tempImg.data[i * 4 + 3] = 255;
            }
            // if (this.previewAccumulator[i] != 0) {
            //     shade = Math.floor(
            //         Math.pow((this.previewAccumulator[i] - min) / max, 0.15) *
            //             255
            //     );

            //     tempImg.data[i * 4 + 0] = shade;
            //     tempImg.data[i * 4 + 1] = shade;
            //     tempImg.data[i * 4 + 2] = shade;
            //     tempImg.data[i * 4 + 3] = 255;
            // }
        }
        this.previewContext.putImageData(tempImg, 0, 0);
    }
    calcPreviewMap() {
        let xCoords = [];
        let yCoords = [];
        let x = 0.1;
        let y = 0.1;
        for (let i = 0; i < 10000; i++) {
            [x, y] = CliffordStep(this.A, this.B, this.C, this.D, x, y);
            xCoords.push(x);
            yCoords.push(y);
        }

        let minX = Math.min(...xCoords) - boundPadding;
        let maxX = Math.max(...xCoords) + boundPadding;
        let minY = Math.min(...yCoords) - boundPadding;
        let maxY = Math.max(...yCoords) + boundPadding;

        let w = maxX - minX;
        let h = maxY - minY;

        let cX = (maxX + minX) / 2;
        let cY = (maxY + minY) / 2;

        let aspectRatio = w / h;

        if (aspectRatio > previewWidth / previewHeight) {
            let newHeight = w / (previewWidth / previewHeight);
            minY = cY - newHeight / 2;
            maxY = cY + newHeight / 2;
        } else {
            let newWidth = h * (previewWidth / previewHeight);
            minX = cX - newWidth / 2;
            maxX = cX + newWidth / 2;
        }
        w = maxX - minX;
        h = maxY - minY;

        let xOffset = minX;
        let xScalar = previewWidth / w;
        let yOffset = minY;
        let yScalar = previewHeight / h;

        return [xOffset, yOffset, xScalar, yScalar];
    }
    iterate() {
        let xInd = 0;
        let yInd = 0;
        for (let i = 0; i < itersPerLoad; i++) {
            [this.x, this.y] = CliffordStep(
                this.A,
                this.B,
                this.C,
                this.D,
                this.x,
                this.y
            );
            xInd = Math.floor((this.x - this.xOffset) * this.xScalar);
            yInd = Math.floor((this.y - this.yOffset) * this.yScalar);
            if (!this.renderAccumulator[xInd + this.width * yInd]++)
                this.cellsFilled++;
        }
        this.itersCompleted += itersPerLoad;
        if (Math.log2(this.itersCompleted) > this.nextDraw) {
            this.render();
            this.nextDraw++;
        }
    }
    render() {
        let max = -Infinity;
        let min = Infinity;
        for (let n = 0; n < this.renderAccumulator.length; n++) {
            if (this.renderAccumulator[n] > max)
                max = this.renderAccumulator[n];
            if (
                this.renderAccumulator[n] < min &&
                this.renderAccumulator[n] > 0
            )
                min = this.renderAccumulator[n];
        }
        max -= min;

        let tempImg = this.renderContext.createImageData(
            this.width,
            this.height
        );

        let shade = 0;
        for (let i = 0; i < this.width * this.height; i++) {
            if (this.renderAccumulator[i] != 0) {
                shade = Math.pow(
                    (this.renderAccumulator[i] - min) / max,
                    this.contrast
                );

                tempImg.data[i * 4 + 0] = Math.floor(
                    (this.rInvert
                        ? 1 - Math.pow(shade, this.rModifier)
                        : Math.pow(shade, this.rModifier)) * 255
                );
                tempImg.data[i * 4 + 1] = Math.floor(
                    (this.gInvert
                        ? 1 - Math.pow(shade, this.gModifier)
                        : Math.pow(shade, this.gModifier)) * 255
                );
                tempImg.data[i * 4 + 2] = Math.floor(
                    (this.bInvert
                        ? 1 - Math.pow(shade, this.bModifier)
                        : Math.pow(shade, this.bModifier)) * 255
                );
                tempImg.data[i * 4 + 3] = 255;
            }
        }
        this.renderContext.putImageData(tempImg, 0, 0);
    }
    calcMap() {
        let xCoords = [];
        let yCoords = [];
        let x = 0.1;
        let y = 0.1;
        for (let i = 0; i < 10000; i++) {
            [x, y] = CliffordStep(this.A, this.B, this.C, this.D, x, y);
            xCoords.push(x);
            yCoords.push(y);
        }

        let minX = Math.min(...xCoords) - boundPadding;
        let maxX = Math.max(...xCoords) + boundPadding;
        let minY = Math.min(...yCoords) - boundPadding;
        let maxY = Math.max(...yCoords) + boundPadding;

        let w = maxX - minX;
        let h = maxY - minY;

        let cX = (maxX + minX) / 2;
        let cY = (maxY + minY) / 2;

        let aspectRatio = w / h;

        if (aspectRatio > this.width / this.height) {
            let newHeight = w / (this.width / this.height);
            minY = cY - newHeight / 2;
            maxY = cY + newHeight / 2;
        } else {
            let newWidth = h * (this.width / this.height);
            minX = cX - newWidth / 2;
            maxX = cX + newWidth / 2;
        }
        w = maxX - minX;
        h = maxY - minY;

        let xOffset = minX;
        let xScalar = this.width / w;
        let yOffset = minY;
        let yScalar = this.height / h;

        return [xOffset, yOffset, xScalar, yScalar];
    }
}

let a = -1.7;
document.getElementById("ASlider").value = a;
document.getElementById("ANumber").value = a;
let b = 1.8;
document.getElementById("BSlider").value = b;
document.getElementById("BNumber").value = b;
let c = -0.9;
document.getElementById("CSlider").value = c;
document.getElementById("CNumber").value = c;
let d = -0.4;
document.getElementById("DSlider").value = d;
document.getElementById("DNumber").value = d;

document.getElementById("ASlider").oninput = updateNumbers;
document.getElementById("BSlider").oninput = updateNumbers;
document.getElementById("CSlider").oninput = updateNumbers;
document.getElementById("DSlider").oninput = updateNumbers;

document.getElementById("ANumber").oninput = updateSliders;
document.getElementById("BNumber").oninput = updateSliders;
document.getElementById("CNumber").oninput = updateSliders;
document.getElementById("DNumber").oninput = updateSliders;

document.getElementById("width").oninput = updateSliders;
document.getElementById("height").oninput = updateSliders;

document.getElementById("contrastSlider").oninput = updateContrast;

document.getElementById("rSlider").oninput = updateColors;
document.getElementById("gSlider").oninput = updateColors;
document.getElementById("bSlider").oninput = updateColors;

document.getElementById("rInvert").oninput = updateColors;
document.getElementById("gInvert").oninput = updateColors;
document.getElementById("bInvert").oninput = updateColors;

function updateContrast() {
    cliff.contrast = parseFloat(
        document.getElementById("contrastSlider").value
    );
    cliff.render();
}

function updateColors() {
    cliff.rModifier = parseFloat(document.getElementById("rSlider").value);
    cliff.gModifier = parseFloat(document.getElementById("gSlider").value);
    cliff.bModifier = parseFloat(document.getElementById("bSlider").value);

    cliff.rInvert = document.getElementById("rInvert").checked;
    cliff.gInvert = document.getElementById("gInvert").checked;
    cliff.bInvert = document.getElementById("bInvert").checked;

    cliff.preview();
    cliff.render();
}

function updateNumbers() {
    document.getElementById("ANumber").value =
        document.getElementById("ASlider").value;
    document.getElementById("BNumber").value =
        document.getElementById("BSlider").value;
    document.getElementById("CNumber").value =
        document.getElementById("CSlider").value;
    document.getElementById("DNumber").value =
        document.getElementById("DSlider").value;
    cliff = new Attractor();
    cliff.preview();
    document.getElementById("renderToggle").innerText = isRender
        ? `Rendering ${cliff.itersCompleted.toPrecision(5)}`
        : `Start Render ${cliff.itersCompleted.toPrecision(5)}`;
    document.getElementById("toNextRefresh").value =
        (cliff.itersCompleted - Math.pow(2, cliff.nextDraw - 1)) /
        Math.pow(2, cliff.nextDraw - 1);
}
function updateSliders() {
    document.getElementById("ASlider").value =
        document.getElementById("ANumber").value;
    document.getElementById("BSlider").value =
        document.getElementById("BNumber").value;
    document.getElementById("CSlider").value =
        document.getElementById("CNumber").value;
    document.getElementById("DSlider").value =
        document.getElementById("DNumber").value;
    cliff = new Attractor();
    cliff.preview();
    document.getElementById("renderToggle").innerText = isRender
        ? `Rendering ${cliff.itersCompleted.toPrecision(5)}`
        : `Start Render ${cliff.itersCompleted.toPrecision(5)}`;
    document.getElementById("toNextRefresh").value =
        (cliff.itersCompleted - Math.pow(2, cliff.nextDraw - 1)) /
        Math.pow(2, cliff.nextDraw - 1);
}

function toggleRender() {
    if (!isRender) {
        isRender = true;
        render();
    } else {
        isRender = false;
    }
}

function render() {
    cliff.iterate();
    document.getElementById("renderToggle").innerText = isRender
        ? `Rendering ${cliff.itersCompleted.toPrecision(5)}`
        : `Start Render ${cliff.itersCompleted.toPrecision(5)}`;
    document.getElementById("toNextRefresh").value =
        (cliff.itersCompleted - Math.pow(2, cliff.nextDraw - 1)) /
        Math.pow(2, cliff.nextDraw - 1);
    document.getElementById("nonZero").innerText = cliff.cellsFilled;
    if (isRender) {
        requestAnimationFrame(render);
    }
}

let cliff = new Attractor();
cliff.preview();
