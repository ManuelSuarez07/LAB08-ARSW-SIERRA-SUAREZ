var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var canvas; // Variable global para el canvas
    var ctx;    // Variable global para el contexto

    var addPointToCanvas = function (point) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#000000'; // Color negro para los puntos
        ctx.fill();
    };

    var getMousePosition = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            // Suscripción al tópico donde se publicarán los puntos
            stompClient.subscribe('/topic/newpoint', function (message) {
                var point = JSON.parse(message.body);
                addPointToCanvas(point);
            });
        });
    };

    return {
        init: function () {
            // Obtener el canvas y su contexto
            canvas = document.getElementById("canvas");
            ctx = canvas.getContext("2d");

            // Configurar el canvas para dibujo
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';

            // Evento para dibujar al hacer clic
            canvas.addEventListener("click", function(event) {
                var point = getMousePosition(event);
                app.publishPoint(point.x, point.y);
            });

            // Conectar al WebSocket
            connectAndSubscribe();
        },

        publishPoint: function(px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at " + JSON.stringify(pt));

            // Dibujar el punto localmente
            addPointToCanvas(pt);

            // Publicar el punto al servidor
            stompClient.send("/app/newpoint", {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };
})();