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

    // Random palette member
    function randomColor(PALETTE) {
      return (PALETTE[Math.floor(PALETTE.length * Math.random())]);
    }

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

    function drawCoords(ctx, coords, fillColor, strokeColor, fillOpacity, strokeOpacity){
        fillColor = fillColor || "#FF0099";
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        var origin = coords.shift();
        ctx.moveTo(origin[0], origin[1]);
        coords.forEach(function(p, i){
            ctx.lineTo(p[0], p[1]);
        })
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = strokeOpacity;
            ctx.stroke();
        }
        ctx.closePath();
        return ctx;
    }

    function drawHex(ctx, x, y, size, fillColor, strokeColor, fillOpacity, strokeOpacity) {
        if (!ctx) return;
        size = size || 256;

        var coords = getShapeCoords(x, y, size);

        drawCoords(ctx, coords, fillColor, strokeColor, fillOpacity, strokeOpacity);

        return ctx;
    }

    function getAlignedGrid(w, h, scale) {
        var points = [];

        var hexW = scale * 0.8660;
        var hexH = scale;

        var xSteps = Math.ceil(w/hexW);
        var ySteps = Math.ceil(h/hexH);

        for (var i = 0 ; i <= ySteps ; i++) {
            for (var j = 0 ; j <= xSteps ; j++) {
                points.push([j * hexW, i * hexH]);
            }
        }

        return points;
    }

    function getSpacedGrid(w, h, scale) {
        var points = [];

        var hexW = 2 * scale * 0.8660;
        var hexH = scale * 1.5;

        var xSteps = Math.ceil(w/hexW);
        var ySteps = Math.ceil(h/hexH);

        var offset;

        for (var i = 0 ; i <= ySteps ; i++) {
            for (var j = 0 ; j <= xSteps ; j++) {
                offset = (i % 2)? (- scale * 0.8660 ) : 0;
                points.push([j * hexW + offset, i * hexH]);
            }
        }

        return points;
    }

    var gridFunctions = {
        'aligned': getAlignedGrid,
        'spaced': getSpacedGrid
    };

    function constToFunc(x) {
        if (typeof x !== "function") {
            return function(){return x;}
        } else {
            return x;
        }
    }

    function hexBg(container, options) {
        var defaults = {
            scale: 256,
            grid: 'aligned', // [aligned, spaced]
            pointR: 0.1,
            fillOpacity: 1,
            strokeOpacity: 1,
            pointOpacity: 1,
            pointColor: function(palette, i, x, y, w, h) {return "#ffffff"},
            strokeColor: function(palette, i, x, y, w, h) {return null},
            fillColor: function(palette, i, x, y, w, h) {return randomColor(palette)},
            palette: ['#3399cc', '#774aa4', '#ff0099', '#ffcc00'],
            clear: true
        };
        var opts = {};
        opts = extend(extend(opts, defaults), options);

        // convert color constants to functions
        opts.pointColor = constToFunc(opts.pointColor);
        opts.strokeColor = constToFunc(opts.strokeColor);
        opts.fillColor = constToFunc(opts.fillColor);

        var w = container.offsetWidth;
        var h = container.offsetHeight;

        var gridFunc = gridFunctions[opts.grid] || getAlignedGrid;

        var points = gridFunc(w, h, opts.scale);

        var el = container.querySelector('canvas');
        if (!el) {
            el = document.createElement('canvas');
        }
        el.width = container.offsetWidth;
        el.height = container.offsetHeight;
        ctx = el.getContext('2d');

        if (opts.clear) {
            ctx.clearRect(0, 0, w, h);
        }

        // center point radius
        var r = opts.scale * opts.pointR;

        points.forEach(function(p, i) {
            drawHex(ctx, p[0], p[1], opts.scale,
                opts.fillColor(opts.palette, i, p[0], p[1], w, h),
                opts.strokeColor(opts.palette, i, p[0], p[1], w, h),
                opts.fillOpacity, opts.strokeOpacity);

            ctx.strokeStyle = opts.pointColor(opts.palette, i, p[0], p[1], w, h);
            ctx.globalAlpha = opts.pointOpacity;
            ctx.beginPath();
            ctx.moveTo(p[0] + r, p[1]);
            ctx.arc(p[0], p[1], r, 0, 2*Math.PI, false);
            ctx.stroke();
            ctx.closePath();
        });

        container.appendChild(el);
    }

    // export
    window.hexBg = hexBg;
}());
