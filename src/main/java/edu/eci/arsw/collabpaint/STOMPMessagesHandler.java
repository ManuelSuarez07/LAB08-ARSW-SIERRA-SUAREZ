package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    private ConcurrentHashMap<String, CopyOnWriteArrayList<Point>> drawingPoints = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido para el dibujo " + numdibujo + ": " + pt);

        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
        drawingPoints.putIfAbsent(numdibujo, new CopyOnWriteArrayList<>());
        CopyOnWriteArrayList<Point> points = drawingPoints.get(numdibujo);
        points.add(pt);

        if (points.size() >= 3) {
            Polygon polygon = new Polygon(points);
            System.out.println("Enviando polígono para dibujo " + numdibujo + " con " + points.size() + " puntos");
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);

            points.clear();
        }
    }
}