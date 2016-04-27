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

    function drawCoords(ctx, coords, color){
        color = color || "#FF0099";
        ctx.fillStyle = color;
        ctx.beginPath();
        var origin = coords.shift();
        ctx.moveTo(origin[0], origin[1]);
        coords.forEach(function(p, i){
            ctx.lineTo(p[0], p[1]);
        })
        ctx.fill();
        ctx.closePath();
        return ctx;
    }

    function drawHex(ctx, x, y, size, color, angle) {
        if (!ctx) return;
        size = size || 256;

        var coords = getShapeCoords(x, y, size, angle);

        drawCoords(ctx, coords, color);

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
        return [];
    }

    var gridFunctions = {
        'aligned': getAlignedGrid,
        'spaced': getSpacedGrid
    };

    function hexBg(container, options) {
        var defaults = {
            scale: 256,
            grid: 'aligned', // [aligned, spaced]
            palette: ['#3399cc', '#774aa4', '#ff0099', '#ffcc00']
        };
        var opts = {};
        opts = extend(extend(opts, defaults), options);

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

        ctx.strokeStyle = "#000000";

        var r = opts.scale/10;

        points.forEach(function(p, i) {
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(p[0] + r, p[1]);
            ctx.arc(p[0], p[1], r, 0, 2*Math.PI, false);
            ctx.stroke();
            ctx.closePath();

            ctx.moveTo(p[0], p[1]);
            ctx.globalAlpha = 0.5;
            drawHex(ctx, p[0], p[1], opts.scale, randomColor(opts.palette), 0);
        });

        container.appendChild(el);
    }

    // export
    window.hexBg = hexBg;
}());
