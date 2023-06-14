let text = 'Hello World';
const imageEditorCanvas = document.getElementById('imageEditor');

const videoInput = document.getElementById('videoInput');
const imageInput = document.getElementById('imageInput');
const textInput = document.getElementById('textInput');

let imageProcess = null;

const processor = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        let self = this;
        setTimeout(function () {
            self.timerCallback();
        }, 0);
    },
    doLoad: function() {
        this.video = document.getElementById("video");

        // Get canvas 1
        this.c1 = document.getElementById("c1");
        this.ctx1 = this.c1.getContext("2d");

        // Get canvas 2
        this.c2 = document.getElementById("c2");
        this.ctx2 = this.c2.getContext("2d");

        let self = this;
        this.video.addEventListener("play", function() {
            self.width = self.video.videoWidth / 4;
            self.height = self.video.videoHeight / 4;
            self.timerCallback();
        }, false);
    },
    computeFrame: function() {
        const image = new Image();
        const self = this;

        self.width = 250;
        self.height = 250;

        if(imageProcess) {
            image.src = imageProcess.canvas.toDataURL();
        } else {
            image.src = './image.jpg';
        }

        image.onload=function(){
            // clear previous frame (important for transparency)
            self.ctx1.clearRect(0, 0, self.width,self.height);
            
            // Draw image frame
            self.ctx1.drawImage(self.video, 0, 0, self.width, self.height);
            // let frame = self.ctx1.getImageData(0, 0, self.width, self.height);
            
            // clear previous frame (important for transparency)
            self.ctx2.clearRect(0, 0, self.width,self.height);
            
            // Draw image frame
            if(image) {
                self.ctx2.drawImage(image,0,0,self.width,self.height);
            }
            self.ctx2.drawImage(self.video, 0, 0, self.width, self.height);

            // Draw Text
            // self.ctx2.fillRect(0, 0, self.width,self.height);
            // self.ctx2.fillStyle = 'Black';;
            // self.ctx2.font = '48px serif';
            // self.ctx2.fillText(text, 0, self.width)
        };
        return;
    }
};

class ImageProcess {
    constructor(canvas, image) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = image;
        this.image = image;
        this.canvasMaxZoom = 1;
        this.canvasMinZoom = 0.1;
        this.canvasZoom = 1;
        this.canvasZoomStep = 0.1;
        this.canvasPinchZoomStep = 0.1;
        this.canvasMouseDown = false;
        this.canvasPanStart = {
            x: 0,
            y: 0
        }      
        this.sx = 0
        this.sy = 0
        this.draw = false;

        this.init()
    }

    init() {
        const image = new Image();
        const self = this;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.originalImage) {
            image.src = URL.createObjectURL(this.originalImage);
        } else {
            image.src = './image.jpg';
        }

        image.onload = () => {
            // clear previous frame (important for transparency)
            self.ctx.clearRect(0, 0, self.canvas.width,self.canvas.height);
            self.ctx.drawImage(image, 0, 0, 250, 250);
            self.canvasZoom = 1;

            const sW = image.width * self.canvasZoom;
            const sH = image.height * self.canvasZoom;

            console.log(self.sx, self.sy, sW, sH, 0, 0, self.canvas.width, self.canvas.height)

            self.ctx.drawImage(image, self.sx, self.sy, sW, sH, 0, 0, self.canvas.width, self.canvas.height);
        }
        this.image = image;
    }

    redrawImage() {
        const sW = this.image.width * this.canvasZoom;
        const sH = this.image.height * this.canvasZoom;
        this.realignImage(sW, sH);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, this.sx, this.sy, sW, sH, 0, 0, this.canvas.width, this.canvas.height);
    }

    resetImage() {
        this.canvasZoom = 1;
        this.redrawImage();
    }

    zoomImage(direction) {
        const zoom = this.canvasZoom - direction * this.canvasZoomStep;
        if(zoom > this.canvasMaxZoom || zoom < this.canvasMinZoom) {
            return;
        }

        this.canvasZoom = zoom;
        this.redrawImage();
    }

    onPinchOut(event) {
        if(this.draw) return;
        this.canvasZoom = Math.max(this.canvasMinZoom, this.canvasZoom - this.canvasPinchZoomStep);

        this.redrawImage();
    }

    onPinchIn(event) {
        if(this.draw) return;
        this.canvasZoom = Math.min(this.canvasMaxZoom, this.canvasZoom + this.canvasPinchZoomStep);

        this.redrawImage();
    }

    onPanStart(event) {
        this.canvasMouseDown = true;
        const sWidth = this.image.width * this.canvasZoom;
        const sHeight = this.image.height * this.canvasZoom;

        this.canvasPanStart.x = event.center.x / (this.canvas.width / sWidth) + this.sx;
        this.canvasPanStart.y = event.center.y / (this.canvas.height / sHeight) + this.sy;

        // if(this.draw) {
        //     const rect = this.canvas.getBoundingClientRect();
        //     const x = event.center.x - rect.left;
        //     const y = event.center.y - rect.top;

        //     this.ctx.beginPath();
        //     this.ctx.moveTo(x, y);

        //     const x2 = (event.center.x - rect.left) / (this.canvas.width / sWidth) + this.sx;
        //     const y2 = (event.center.y - rect.top) / (this.canvas.height / sHeight) + this.sy;
        // }
    }

    onPanMove(event) {
        if(!this.canvasMouseDown) return;
        const sWidth = this.image.width * this.canvasZoom;
        const sHeight = this.image.height * this.canvasZoom;

        if(this.canvasZoom >= 1) return;
        const x = event.center.x / (this.canvas.width / sWidth) + this.sx;
        const y = event.center.y / (this.canvas.height / sHeight) + this.sy;
        this.sx += (this.canvasPanStart.x - x);
        this.sy += (this.canvasPanStart.y - y) ;
        console.log(event.center, this.canvasPanStart, this.sx, this.sy);
        this.redrawImage();
    }

    onPanEnd(event) {
        if (this.draw) {
            this.ctx.closePath();
            // this._mirrorContext.closePath();
        }
    
        this.canvasMouseDown = false;
    }

    realignImage(sWidth, sHeight) {
        if(
            (this.sx + sWidth > this.image.width)
            || (this.sy + sHeight > this.image.height)
            || (this.sx < 0)
            || (this.sy < 0)
        ) {
            if(this.sx + sWidth > this.image.width) {
                this.sx = this.image.width - sWidth;
            }
            if(this.sy + sHeight > this.image.height) {
                this.sy = this.image.height - sHeight;
            }
            if(this.sx < 0) {
                this.sx = 0;
            }
            if(this.sy < 0) {
                this.sy = 0;
            }
        }
    }

    
}

/**
 * By Ken Fyrstenberg Nilsen
 *
 * drawImageProp(context, image [, x, y, width, height [,offsetX, offsetY]])
 *
 * If image and context are only arguments rectangle will equal canvas
*/
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {

    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // decide which gap to fill    
    if (nw < w) ar = w / nw;                             
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
}

videoInput.addEventListener("change", () => {
    console.log('input')
    const vid = videoInput.files[0];
    document.getElementById("video").setAttribute("src", URL.createObjectURL(vid));

    processor.doLoad();
});

textInput.addEventListener("change", () => {
    console.log('text')
    text = textInput.value
    console.log(textInput.value)
})

imageInput.addEventListener("change", () => {
    const image = imageInput.files[0];

    imageProcess = new ImageProcess(imageEditorCanvas, image);
});

const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");

zoomIn.addEventListener("click", () => {
    imageProcess.zoomImage(1);
});

zoomOut.addEventListener("click", () => {
    imageProcess.zoomImage(-1);
});

document.addEventListener("DOMContentLoaded", () => {
    console.log('loaded')

    // Check if video is already loaded
    if (document.getElementById("video").getAttribute("src") != null) {
        processor.doLoad();
    }

    const hammertime = new Hammer(imageEditorCanvas);

    // Register event handler
    hammertime.on('panstart', function(ev) {
        imageProcess.onPanStart(ev);
    });

    hammertime.on('panmove', function(ev) {
        imageProcess.onPanMove(ev);
    })

    hammertime.on('panend', function(ev) {
        imageProcess.onPanEnd(ev);
    })

    hammertime.on('pinchin', function(ev) {
        console.log(ev);
        imageProcess.zoomImage(1);
    })

    hammertime.on('pinchout', function(ev) {
        console.log(ev);
        imageProcess.zoomImage(-1);
    })
});

function play() {
    processor.doLoad();
}