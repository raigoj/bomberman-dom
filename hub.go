package main

import (
	"log"
)

type Message struct {
	data []byte
	room string
}

type Subscription struct {
	conn  *Connection
	room  string
	uname string
	id    string
	color string
}

type Hub struct {
	rooms      map[string]Room
	broadcast  chan Message
	register   chan Subscription
	unregister chan Subscription
}

type Room struct {
	name    string
	started bool
	users   map[*Connection]string
	conns   map[*Connection]bool
	colors  map[*Connection]string
}

var h = Hub{
	broadcast:  make(chan Message),
	register:   make(chan Subscription),
	unregister: make(chan Subscription),
	rooms:      make(map[string]Room),
}

func (h *Hub) run() {
	for {
		select {
		case s := <-h.register:
			connections := h.rooms[s.room].conns
			if connections == nil {
				x := h.rooms[s.room]
				x.conns = make(map[*Connection]bool)
				x.users = make(map[*Connection]string)
				x.name = s.room
				x.colors = make(map[*Connection]string)
				h.rooms[s.room] = x
				connections = h.rooms[s.room].conns
			}
			log.Println("conns here", connections[s.conn])
			connections[s.conn] = true
			h.rooms[s.room].users[s.conn] = s.uname + "_" + s.id
			h.rooms[s.room].colors[s.conn] = s.color
		case s := <-h.unregister:
			connections := h.rooms[s.room].conns
			if connections != nil {
				if _, ok := connections[s.conn]; ok {
					delete(connections, s.conn)
					delete(h.rooms[s.room].users, s.conn)
					//close(s.conn.send)
					if len(connections) == 0 {
						delete(h.rooms, s.room)
					}
				}
			}
		case m := <-h.broadcast:
			connections := h.rooms[m.room].conns
			for c := range connections {
				select {
				case c.send <- m.data:
				default:
					close(c.send)
					delete(connections, c)
					if len(connections) == 0 {
						delete(h.rooms, m.room)
					}
				}
			}
		}
	}
}
