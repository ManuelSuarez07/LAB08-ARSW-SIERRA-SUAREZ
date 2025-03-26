var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var canvas;
    var ctx;
    var currentDrawingId = null;

    var addPointToCanvas = function (point) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = getRandomColor();
        ctx.fill();
    };

    // Función para generar colores aleatorios para cada dibujo
    var getRandomColor = function() {
        var colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    var getMousePosition = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function (drawingId) {
        console.info('Connecting to WS for drawing ' + drawingId + '...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            currentDrawingId = drawingId;

            // Suscribirse al tópico específico para este dibujo
            stompClient.subscribe('/topic/newpoint.' + drawingId, function (message) {
                var point = JSON.parse(message.body);
                addPointToCanvas(point);
            });

            alert("Conectado al dibujo: " + drawingId);
        });
    };

    return {
        init: function () {
            canvas = document.getElementById("canvas");
            ctx = canvas.getContext("2d");
            ctx.lineWidth = 2;

            // Configurar evento de clic (pero no conecta automáticamente)
            canvas.addEventListener("click", function(event) {
                if (stompClient && stompClient.connected && currentDrawingId) {
                    var point = getMousePosition(event);
                    app.publishPoint(point.x, point.y);
                } else {
                    alert("Por favor conéctese a un dibujo primero");
                }
            });
        },

        connect: function () {
            var drawingId = document.getElementById("drawingId").value;
            if (!drawingId) {
                alert("Por favor ingrese un ID de dibujo");
                return;
            }

            if (stompClient && stompClient.connected) {
                app.disconnect();
            }

            connectAndSubscribe(drawingId);
        },

        publishPoint: function(px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at " + JSON.stringify(pt) + " to drawing " + currentDrawingId);

            addPointToCanvas(pt);
            stompClient.send("/app/newpoint." + currentDrawingId, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
                currentDrawingId = null;
            }
            console.log("Disconnected");
        }
    };
})();