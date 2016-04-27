(function(){

    // Default palette
    var PALETTE = ['#3399cc', '#774aa4', '#ff0099', '#ffcc00'];

    // Random palette member
    function randomColor() {
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

    function hexBg(container, scale, palette) {
        scale = scale || 256;

        if (palette !== undefined) {
            PALETTE = palette;
        }

        var w = container.offsetWidth;
        var h = container.offsetHeight;

        var hexW = scale * 0.8660;
        var hexH = scale;

        //
        var xSteps = Math.ceil(w/hexW);
        var ySteps = Math.ceil(h/hexH);

        var points = [];
        for (var i = 0 ; i <= ySteps ; i++) {
            for (var j = 0 ; j <= xSteps ; j++) {
                points.push([j * hexW, i * hexH]);
            }
        }

        var el = container.querySelector('canvas');
        if (!el) {
            el = document.createElement('canvas');
        }
        el.width = container.offsetWidth;
        el.height = container.offsetHeight;
        ctx = el.getContext('2d');

        //drawHex(ctx, scale/2, scale/2, scale, randomColor(), 0);
        //

        ctx.strokeStyle = "#000000";
        points.forEach(function(p, i) {
            ctx.globalAlpha = 1;
            ctx.arc(p[0], p[1], 3, 0, 2*Math.PI, false);
            ctx.globalAlpha = 0.5;
            drawHex(ctx, p[0], p[1], scale, randomColor(), 0);
        });

        container.appendChild(el);
    }

    // export
    window.hexBg = hexBg;
}());
