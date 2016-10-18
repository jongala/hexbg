(function(){
    var SVG_NS = 'http://www.w3.org/2000/svg';

    // simple object extender
    function extend(dest, src) {
        for (k in src) {
            if (src.hasOwnProperty(k)) {
                dest[k] = src[k];
            }
        }
        return dest;
    }

    // Turn constants into functions which return the constant,
    // used to allow passing colors as strings or functions
    function constToFunc(x) {
        if (typeof x !== "function") {
            return function(){return x;}
        } else {
            return x;
        }
    }

    // Random palette member
    function randomColor(PALETTE) {
      return (PALETTE[Math.floor(PALETTE.length * Math.random())]);
    }

    function randomInRange(min, max) {
        return (min + (max - min) * Math.random());
    }

    function setAttrs(el, attrs) {
        if (el && el.setAttribute) {
            for (a in attrs) {
                if (attrs.hasOwnProperty(a)) {
                    el.setAttribute(a, attrs[a]);
                }
            }
        }
    }

    // Returns an array of [x, y] points describing a hexagon
    function getShapeCoords(x, y, size, angle) {
        var c = [];
        var points = 6;
        angle = angle || 0;
        while (points--) {
            c.push(angle + points * Math.PI * 2/6);
        }
        c = c.map(function(theta){
            return [x + size * Math.sin(theta),
                y + size * Math.cos(theta)];
        });
        return c;
    }

    // Draw a hexagon into ctx with the passed characteristics
    function drawHexCanvas(ctx, x, y, size, fillColor, strokeColor, fillOpacity, strokeOpacity, angle) {
        if (!ctx) return;
        size = size || 256;

        var coords = getShapeCoords(x, y, size, angle);
        var origin = coords.shift();

        ctx.beginPath();
        ctx.moveTo(origin[0], origin[1]);
        coords.forEach(function (p, i) {
            ctx.lineTo(p[0], p[1]);
        });
        ctx.lineTo(origin[0], origin[1]);

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.globalAlpha = fillOpacity;
            ctx.fill();
        }

        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = strokeOpacity;
            ctx.stroke();
        }

        ctx.closePath();

        return ctx;
    }

    function drawHexSVG(container, x, y, size, fillColor, strokeColor, fillOpacity, strokeOpacity, angle, attrs) {
        if (!container) return;
        size = size || 256;
        fillColor = fillColor || 'none';
        strokeColor = strokeColor || 'none';
        attrs = attrs || {};

        var coords = getShapeCoords(x, y, size, angle);
        var d = ("M " + coords.join(" L ") + " Z").replace(/,/g, ' ');
        var path = document.createElementNS('http://www.w3.org/2000/svg','path');
        setAttrs(path, extend({
            'd': d,
            'fill': fillColor,
            'fill-opacity': fillOpacity,
            'stroke': strokeColor,
            'stroke-opacity': strokeOpacity
        }, attrs));
        container.appendChild(path);
    }

    function drawCircleCanvas(ctx, x, y, r, strokeColor, strokeOpacity) {
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = strokeOpacity;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, 2*Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    }

    function drawCircleSVG(container, x, y, r, strokeColor, strokeOpacity) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        setAttrs(c, {
            'cx': x,
            'cy': y,
            'r': r,
            'fill': 'none',
            'stroke': strokeColor,
            'stroke-opacity': strokeOpacity,
            'stroke-width': 1
        });
        container.appendChild(c);
    }

    // Generates hexagon center-points for overlapping tiles
    function getGridLayout(w, h, scale) {
        var points = [];
        var hexW = scale * 0.8660;
        var hexH = scale;
        var rows = Math.ceil(h/hexH);
        var cols = Math.ceil(w/hexW);

        for (var row = 0 ; row <= rows ; row++) {
            var r = [];
            for (var col = 0 ; col <= cols ; col++) {
                r.push([col * hexW, row * hexH]);
            }
            points.push(r);
        }

        return points;
    }

    // Generates hexagon center-points for overlapping tiles
    function getOverlapLayout(w, h, scale) {
        var points = [];
        var hexW = 2 * scale * 0.8660;
        var hexH = scale * 0.5;
        var rows = Math.ceil(h/hexH);
        var cols = Math.ceil(w/hexW);
        var offset;

        for (var row = 0 ; row <= rows ; row++) {
            var r = [];
            for (var col = 0 ; col <= cols ; col++) {
                offset = (row % 2)? (- scale * 0.8660 ) : 0;
                r.push([col * hexW + offset, row * hexH]);
            }
            points.push(r);
        }

        return points;
    }

    // Generates hexagon center-points for non-overlapping tiling
    function getTiledLayout(w, h, scale) {
        var points = [];
        var hexW = 2 * scale * 0.8660;
        var hexH = scale * 1.5;
        var rows = Math.ceil(h/hexH);
        var cols = Math.ceil(w/hexW);
        var offset;

        for (var row = 0 ; row <= rows ; row++) {
            var r = [];
            for (var col = 0 ; col <= cols ; col++) {
                offset = (row % 2)? (- scale * 0.8660 ) : 0;
                r.push([col * hexW + offset, row * hexH]);
            }
            points.push(r);
        }

        return points;
    }

    // Map grid functions to option names
    var layoutFunctions = {
        'grid': getGridLayout,
        'overlap': getOverlapLayout,
        'tile': getTiledLayout
    };

    // Tile the container
    function hexBg(container, options) {
        var defaults = {
            scale: 256,
            layout: 'tile', // [tile, overlap]
            pointR: 0.1,
            fillOpacity: 1,
            strokeOpacity: 1,
            pointOpacity: 1,
            pointColor: function(palette, row, col, x, y, w, h) {return null},
            strokeColor: function(palette, row, col, x, y, w, h) {return null},
            fillColor: function(palette, row, col, x, y, w, h) {return randomColor(palette)},
            palette: ['#3399cc', '#774aa4', '#ff0099', '#ffcc00'],
            clear: true,
            renderer: 'canvas' // or 'svg'
        };
        var opts = {};
        opts = extend(extend(opts, defaults), options);

        // convert color constants to functions
        opts.pointColor = constToFunc(opts.pointColor);
        opts.strokeColor = constToFunc(opts.strokeColor);
        opts.fillColor = (opts.fillColor === 'palette') ? randomColor : constToFunc(opts.fillColor);

        var w = container.offsetWidth;
        var h = container.offsetHeight;

        // get hex layout function, generate hex points
        var layoutFunc = layoutFunctions[opts.layout] || getTiledLayout;
        var points = layoutFunc(w, h, opts.scale);

        // Find or create canvas child
        var el = container.querySelector(opts.renderer);
        var newEl = false;
        if (!el) {
            container.innerHTML = '';
            if (opts.renderer === 'svg') {
                el = document.createElementNS(SVG_NS, 'svg');
            } else {
                el = document.createElement('canvas');
            }
            newEl = true;
        }
        if (newEl || opts.clear) {
            setAttrs(el, {
                'width': container.offsetWidth,
                'height': container.offsetHeight
            });
        }

        var fillCtx; // canvas ctx or svg tag
        var strokeCtx;
        var circleCtx;
        var drawHex;
        var drawCircle;

        if (opts.renderer === 'canvas') {
            fillCtx = el.getContext('2d');
            strokeCtx = fillCtx;
            circleCtx = fillCtx;
            drawHex = drawHexCanvas;
            drawCircle = drawCircleCanvas;

            // optional clear
            if (opts.clear) {
                el.width = container.offsetWidth;
                el.height = container.offsetHeight;
                fillCtx.clearRect(0, 0, w, h);
            }
        } else if (opts.renderer === 'svg') {
            el.setAttribute('xmlns', SVG_NS);

            if (opts.clear || newEl) {
                el.innerHTML = '';
                fillCtx = document.createElementNS(SVG_NS, 'g');
                fillCtx.setAttribute('id', 'fills');
                strokeCtx = document.createElementNS(SVG_NS, 'g');
                strokeCtx.setAttribute('id', 'strokes');
                circleCtx = document.createElementNS(SVG_NS, 'g');
                circleCtx.setAttribute('id', 'circles');
                el.appendChild(fillCtx);
                el.appendChild(strokeCtx);
                el.appendChild(circleCtx);
            } else {
                fillCtx = el.getElementById('fills');
                strokeCtx = el.getElementById('strokes');
                circleCtx = el.getElementById('circles');
            }

            drawHex = drawHexSVG;
            drawCircle = drawCircleSVG;
        }

        // center point radius
        var pr = opts.scale * opts.pointR;

        // draw hex fills
        points.forEach(function(r, row) {
            r.forEach(function(p, col) {
                drawHex(fillCtx, p[0], p[1], opts.scale,
                    opts.fillColor(opts.palette, row, col, p[0], p[1], w, h),
                    null,
                    opts.fillOpacity, 0);
            });
        });

        // draw hex strokes
        points.forEach(function(r, row) {
            r.forEach(function(p, col) {
                drawHex(strokeCtx, p[0], p[1], opts.scale,
                    null,
                    opts.strokeColor(opts.palette, row, col, p[0], p[1], w, h),
                    0, opts.strokeOpacity);

                drawCircle(circleCtx,
                    p[0], p[1], pr,
                    opts.pointColor(opts.palette, row, col, p[0], p[1], w, h),
                    opts.pointOpacity);
            });
        });

        // if new canvas child was created, append it
        if (newEl) {
            container.appendChild(el);
        }

    }



    // Tile the container
    function halftone(container, options) {
        var defaults = {
            scale: 256,
            layout: 'tile', // [tile, overlap]
            minFill: 0,
            maxFill: 1,
            bgOpacity: 1,
            fgOpacity: 0.5,
            bgColor: function(palette, row, col, x, y, w, h) {return palette[0]},
            fgColor: function(palette, row, col, x, y, w, h) {return palette[1]},
            palette: ['#3399cc', '#ff0099'],
            clear: true,
            renderer: 'svg' // or 'svg'
        };
        var opts = {};
        opts = extend(extend(opts, defaults), options);

        // convert color constants to functions
        opts.bgColor = constToFunc(opts.bgColor);
        opts.fgColor = constToFunc(opts.fgColor);

        var w = container.offsetWidth;
        var h = container.offsetHeight;

        // get hex layout function, generate hex points
        var layoutFunc = layoutFunctions[opts.layout] || getTiledLayout;
        var points = layoutFunc(w, h, opts.scale);

        // Find or create canvas child
        var el = container.querySelector(opts.renderer);
        var newEl = false;
        if (!el) {
            container.innerHTML = '';
            if (opts.renderer === 'svg') {
                el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            } else {
                el = document.createElement('canvas');
            }
            newEl = true;
        }
        if (newEl || opts.clear) {
            setAttrs(el, {
                'width': container.offsetWidth,
                'height': container.offsetHeight
            });
        }

        var bgCtx;
        var fgCtx;
        var drawHex;

        if (opts.renderer === 'canvas') {
            bgCtx = el.getContext('2d');
            fgCtx = bgCtx;
            drawHex = drawHexCanvas;

            // optional clear
            if (opts.clear) {
                el.width = container.offsetWidth;
                el.height = container.offsetHeight;
                bgCtx.clearRect(0, 0, w, h);
            }
        } else if (opts.renderer === 'svg') {
            el.setAttribute('xmlns', SVG_NS);

            if (opts.clear || newEl) {
                el.innerHTML = '';
                bgCtx = document.createElementNS(SVG_NS, 'g');
                bgCtx.setAttribute('id', 'background');
                fgCtx = document.createElementNS(SVG_NS, 'g');
                fgCtx.setAttribute('id', 'foreground');
                el.appendChild(bgCtx);
                el.appendChild(fgCtx);
            } else {
                bgCtx = el.getElementById('background');
                fgCtx = el.getElementById('foreground');
            }

            drawHex = drawHexSVG;
            drawCircle = drawCircleSVG;
        }

        // center point radius
        var pr = opts.scale * opts.pointR;
        var fillSize;

        // draw fills
        points.forEach(function(r, row) {
            r.forEach(function(p, col) {
                fillSize = opts.scale * randomInRange(opts.minFill, opts.maxFill);
                drawHex(bgCtx, p[0], p[1], fillSize,
                    opts.bgColor(opts.palette, row, col, p[0], p[1], w, h),
                    null,
                    opts.bgOpacity, 0, 0, {'style': 'mix-blend-mode: multiply'});

                fillSize = opts.scale * randomInRange(opts.minFill, opts.maxFill);
                drawHex(fgCtx, p[0], p[1], fillSize,
                    opts.fgColor(opts.palette, row, col, p[0], p[1], w, h),
                    null,
                    opts.fgOpacity, 0, Math.PI/6, {'style': 'mix-blend-mode: multiply'});
            });
        });


        // if new canvas child was created, append it
        if (newEl) {
            container.appendChild(el);
        }

    }


    // Just big hexagons
    function bighex(container, options) {
        var defaults = {
            scale: 256,
            minScale: 0,
            maxScale: 1,
            bgOpacity: 1,
            fgOpacity: 0.5,
            minCount: 5,
            maxCount: 10,
            bgColor: function(palette, row, col, x, y, w, h) {return randomColor(palette)},
            fgColor: function(palette, row, col, x, y, w, h) {return randomColor(palette)},
            palette: ['#3399cc', '#ff0099'],
            clear: true,
            renderer: 'svg' // or 'svg'
        };
        var opts = {};
        opts = extend(extend(opts, defaults), options);

        // enforce svg
        opts.renderer = 'svg';

        // convert color constants to functions
        opts.bgColor = constToFunc(opts.bgColor);
        opts.fgColor = constToFunc(opts.fgColor);

        var w = container.offsetWidth;
        var h = container.offsetHeight;


        // Find or create canvas child
        var el = container.querySelector(opts.renderer);
        var newEl = false;
        if (!el) {
            container.innerHTML = '';
            el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newEl = true;
        }
        if (newEl || opts.clear) {
            setAttrs(el, {
                'width': container.offsetWidth,
                'height': container.offsetHeight
            });
        }

        var bigCtx;
        var fgCtx;
        var drawHex;

        if (opts.renderer === 'canvas') {
            return;
        }

        el.setAttribute('xmlns', SVG_NS);
        el.innerHTML = '';

        bigCtx = document.createElementNS(SVG_NS, 'g');
        bigCtx.setAttribute('id', 'big-multiply');
        el.appendChild(bigCtx);

        fgCtx = document.createElementNS(SVG_NS, 'g');
        fgCtx.setAttribute('id', 'fg-color-dodge');
        el.appendChild(fgCtx);

        drawHex = drawHexSVG;
        drawCircle = drawCircleSVG;


        // set vars
        var big = Math.floor(randomInRange(opts.minCount, opts.maxCount));
        var bigx;
        var bigy;
        var bigSize;
        var bigAngle;


        // Draw 2 base hexagons
        function randomBase(right) {
            bigSize = Math.min(w,h) * randomInRange(0.7, 1.2);
            bigAngle = randomInRange(0, 60);
            bigx = w * randomInRange(0.2, 0.3);
            bigy = h * randomInRange(0.2, 0.3);
            if (right) {
                bigx = w - bigx;
            }
            if (Math.random() > 0.5) {
                bigy = h - bigy;
            }
            drawHex(bigCtx, bigx, bigy, bigSize,
                randomColor(opts.palette.slice(0,2)),
                null, // strokeColor
                opts.bgOpacity,
                0, // strokeOpacity
                bigAngle,
                {
                    'style': 'mix-blend-mode: multiply'
                }
                );
        }
        randomBase(0); // leftside
        randomBase(1); // rightside


        // Draw randomized overlays
        while (big) {
            big--;

            bigSize = Math.min(w,h) * randomInRange(opts.minScale, opts.maxScale);
            bigAngle = randomInRange(0, 60);

            bigx = randomInRange(0, w);
            // place small hex near centerline, bigger near top/bottom
            bigy = h/2 * randomInRange(0, 1 - (bigSize/h));
            if (Math.random() < 0.5) {
                bigy = h - bigy;
            }

            drawHex(fgCtx, bigx, bigy, bigSize,
                opts.fgColor(opts.palette, 0, 0, bigx, bigy, w, h),
                null, // strokeColor
                opts.fgOpacity,
                0, // strokeOpacity
                bigAngle,
                {
                    'style': 'mix-blend-mode: color-dodge'
                }
                );
        }

        // if new canvas child was created, append it
        if (newEl) {
            container.appendChild(el);
        }
    }

    // export
    window.hexBg = hexBg;
    window.halftone = halftone;
    window.bighex = bighex;
}());
