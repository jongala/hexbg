(function(){
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
    function drawHexCanvas(ctx, x, y, size, fillColor, strokeColor, fillOpacity, strokeOpacity) {
        if (!ctx) return;
        size = size || 256;

        var coords = getShapeCoords(x, y, size);
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

    function drawHexSVG(container, x, y, size, fillColor, strokeColor, fillOpacity, strokeOpacity) {
        if (!container) return;
        size = size || 256;
        fillColor = fillColor || 'transparent';
        strokeColor = strokeColor || 'transparent';

        var coords = getShapeCoords(x, y, size);
        var d = ("M " + coords.join(" L ") + " Z").replace(/,/g, ' ');
        var path = document.createElementNS('http://www.w3.org/2000/svg','path');
        setAttrs(path, {
            'd': d,
            'fill': fillColor,
            'fill-opacity': fillOpacity,
            'stroke': strokeColor,
            'stroke-opacity': strokeOpacity
        });
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
            'fill': 'transparent',
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
        opts.fillColor = constToFunc(opts.fillColor);

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
            setAttrs(el, {
                'width': container.offsetWidth,
                'height': container.offsetHeight
            });
            newEl = true;
        }

        var renderCtx; // canvas ctx or svg tag
        var drawHex;
        var drawCircle;

        if (opts.renderer === 'canvas') {
            renderCtx = el.getContext('2d');
            drawHex = drawHexCanvas;
            drawCircle = drawCircleCanvas;

            // optional clear
            if (opts.clear) {
                el.width = container.offsetWidth;
                el.height = container.offsetHeight;
                renderCtx.clearRect(0, 0, w, h);
            }
        } else if (opts.renderer === 'svg') {
            renderCtx = el;
            drawHex = drawHexSVG;
            drawCircle = drawCircleSVG;

            el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            if (opts.clear) {
                el.innerHTML = '';
            }
        }

        // center point radius
        var pr = opts.scale * opts.pointR;

        // draw hex fills
        points.forEach(function(r, row) {
            r.forEach(function(p, col) {
                drawHex(renderCtx, p[0], p[1], opts.scale,
                    opts.fillColor(opts.palette, row, col, p[0], p[1], w, h),
                    null,
                    opts.fillOpacity, 0);
            });
        });

        // draw hex strokes
        points.forEach(function(r, row) {
            r.forEach(function(p, col) {
                drawHex(renderCtx, p[0], p[1], opts.scale,
                    null,
                    opts.strokeColor(opts.palette, row, col, p[0], p[1], w, h),
                    0, opts.strokeOpacity);

                drawCircle(renderCtx,
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

    // export
    window.hexBg = hexBg;
}());
