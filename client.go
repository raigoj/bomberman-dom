package main

import (
	"bomberman/game"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Connection struct {
	ws   *websocket.Conn
	send chan []byte
}

type supdate struct {
	Kind string        `json:"Mtype"`
	Data game.GameData `json:"data"`
}

type WsMessage struct {
	Msgtype string `json:"Mtype"`
	Data    Data   `json:"data"`
}

type Temp struct {
	Type     string `json:"Mtype"`
	Username string `json:"username"`
	Users    []string
	Userids  []string
	Colors   []string
}

type Data struct {
	Username string
	Move     game.Move
	Color    string
}

type TOut struct {
	Tleft int `json:"time"`
}

func (s *Subscription) readPump() {
	c := s.conn
	defer func() {
		h.unregister <- *s
		c.ws.Close()
	}()
	c.ws.SetReadLimit(maxMessageSize)
	c.ws.SetReadDeadline(time.Now().Add(pongWait))
	c.ws.SetPongHandler(func(string) error { c.ws.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, msg, err := c.ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("error: %v", err)
			}
			break
		}
		log.Println(msg)
		m := Message{msg, s.room}
		log.Println(string(msg))
		var message WsMessage
		err = json.Unmarshal(msg, &message)
		if err != nil {
			log.Println("Error:", err)
		}
		switch message.Msgtype {
		case "enteruname":
			//log.Println("m: ", string(m))
			s.uname = string(message.Data.Username)
			s.color = string(message.Data.Color)
			log.Println("s.uname: ", s.uname)
			h.rooms[s.room].users[s.conn] = s.uname + "_" + s.id
			h.rooms[s.room].colors[s.conn] = s.color
		case "quickPlayLobby":
			h.unregister <- *s
			rms := []Room{}
			for _, r := range h.rooms {
				log.Println("rooms", r.name)
				rms = append(rms, r)
			}
			s.room = room(rms)
			log.Println(s.room, "assignment")
			h.register <- *s
			time.Sleep(time.Microsecond * 500)
			log.Println("room", s.room)
			log.Println(h.rooms[s.room])
			var usersInRoom []string
			var unames []string
			var colors []string
			for key, value := range h.rooms[s.room].users {
				log.Println("key: ", key)
				log.Println("value: ", value)
				unames = append(unames, value[0:strings.LastIndex(value, "_")])
				usersInRoom = append(usersInRoom, value)
				colors = append(colors, h.rooms[s.room].colors[key])
			}
			log.Println("usersinroom; ", usersInRoom)
			x, _ := json.Marshal(Temp{Type: "lobby", Users: unames, Username: message.Data.Username, Userids: usersInRoom, Colors: colors})
			h.broadcast <- Message{data: x, room: s.room}
			log.Println("quick lobby room", s.room)
			if len(h.rooms[s.room].users) == 2 {
				go GameTimer(*s)
			} else if len(h.rooms[s.room].users) == 4 {
				timerFinal <- struct{}{}
			} //need to reset when < 2
			break
		case "joinLobby":
			break
		case "chat":
			h.broadcast <- m
			break
		case "move":
			if !strings.Contains(s.room, "lobby_") {
				//continue
			}
			game.Games[s.room].Moves <- game.PlayerMove{
				Move: message.Data.Move,
				Name: s.uname + "_" + s.id,
			}
		default:
			log.Println("message: ", message)
			break
		}

		//c.send <- m.data
		//h.broadcast <- m
	}
}

func room(rooms []Room) string {
	names := []string{}
	log.Println(rooms)
	for _, r := range rooms {
		if r.name == "main" {
			continue
		}
		if !r.started && len(r.users) < 4 {
			return r.name
		}
		names = append(names, r.name)
	}
	for {
		x := "lobby_" + strconv.Itoa(rand.Int())
		exists := false
		for _, y := range names {
			if x == y {
				exists = true
				break
			}
		}
		if !exists {
			return x
		}
	}
}

func (c *Connection) write(mt int, payload []byte) error {
	c.ws.SetWriteDeadline(time.Now().Add(writeWait))
	return c.ws.WriteMessage(mt, payload)
}

func (s *Subscription) writePump() {
	c := s.conn
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.ws.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.write(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.write(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.write(websocket.PingMessage, []byte{}); err != nil {
				return
			}
		}
	}
}

func serveWs(w http.ResponseWriter, r *http.Request, roomId string) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err.Error())
		return
	}
	c := &Connection{send: make(chan []byte, 256), ws: ws}
	s := Subscription{c, roomId, "", strconv.Itoa(rand.Int()), ""}
	h.register <- s
	go s.writePump()
	go s.readPump()
}

func (s Subscription) BroadcastUpdate(data game.Game, over bool) {
	var x []byte
	var err error
	if !over {
		x, err = json.Marshal(&supdate{
			Kind: "update",
			Data: data.GameData,
		})
	} else {
		x, err = json.Marshal(&supdate{
			Kind: "over",
			Data: data.GameData,
		})
	}
	if err != nil {
		//shouldn't be fatal, might mess up the clientside tho
		log.Println(err)
	}
	msg := Message{
		data: x,
		room: s.room,
	}
	log.Println(msg)
	h.broadcast <- msg
}

var gameTimer *time.Timer
var timerReset = make(chan struct{})
var timerStop = make(chan struct{})

// var gameOngoing = make(chan struct{})
var timerFinal = make(chan struct{})

func GameTimer(s Subscription) {
	gameTimer = time.NewTimer(20 * time.Second)
	ticker := time.NewTicker(1 * time.Second)
	left := 20
	users := len(h.rooms[s.room].users)
loop:
	for {
		select {
		case <-ticker.C:
			left--
			t, _ := json.Marshal(TOut{Tleft: left})
			log.Println(users)
			log.Println(h.rooms[s.room].users)
			if len(h.rooms[s.room].users) < 2 {
				var unames []string
				var usersInRoom []string
				var colors []string
				for key, value := range h.rooms[s.room].users {
					log.Println("key: ", key)
					log.Println("value: ", value)
					unames = append(unames, value[0:strings.LastIndex(value, "_")])
					usersInRoom = append(usersInRoom, value)
					colors = append(colors, h.rooms[s.room].colors[key])
				}
				x, _ := json.Marshal(Temp{Type: "few", Users: unames, Username: "", Userids: usersInRoom, Colors: colors})
				h.broadcast <- Message{data: x, room: s.room}
				break loop
			}
			if users != len(h.rooms[s.room].users) {
				log.Println("saerdarsa")
				log.Println(users)
				log.Println(h.rooms[s.room].users)
				if users > len(h.rooms[s.room].users) {
					var unames []string
					var usersInRoom []string
					var colors []string
					for key, value := range h.rooms[s.room].users {
						log.Println("key: ", key)
						log.Println("value: ", value)
						unames = append(unames, value[0:strings.LastIndex(value, "_")])
						usersInRoom = append(usersInRoom, value)
						colors = append(colors, h.rooms[s.room].colors[key])
					}
					x, _ := json.Marshal(Temp{Type: "change", Users: unames, Username: "", Userids: usersInRoom, Colors: colors})
					h.broadcast <- Message{data: x, room: s.room}
				}
				ticker.Reset(1 * time.Second)
				users = len(h.rooms[s.room].users)
				left = 20
				gameTimer.Reset(20 * time.Second)
			} else {
				h.broadcast <- Message{data: t, room: s.room}
			}
		case <-timerStop:
			{
				gameTimer.Reset(20 * time.Second)
				left = 20
				break loop
			}
		case <-gameTimer.C:
			rm := h.rooms[s.room]
			rm.started = true
			h.rooms[s.room] = rm
			game.InitGame(s.BroadcastUpdate, CreatePlayers(h.rooms[s.room].users, h.rooms[s.room].colors), s.room)
			break loop
		case <-timerReset:
			if !gameTimer.Stop() {
				<-gameTimer.C
			} else {
				ticker.Reset(1 * time.Second)
				left = 20
				gameTimer.Reset(20 * time.Second)
			}
		case <-timerFinal:
			users = len(h.rooms[s.room].users)
			if !gameTimer.Stop() {
				<-gameTimer.C
			}
			left = 10
			gameTimer.Reset(10 * time.Second)
		}
	}
	ticker.Stop()
}

func CreatePlayers(x map[*Connection]string, y map[*Connection]string) map[string]*game.Player {
	m := make(map[string]*game.Player)
	i := 0
	for z, v := range x {
		var loc game.Location
		i++
		switch i {
		case 1:
			loc = game.Location{X: 1, Y: 1}
		case 2:
			loc = game.Location{X: 13, Y: 1}
		case 3:
			loc = game.Location{X: 1, Y: 11}
		case 4:
			loc = game.Location{X: 13, Y: 11}
		default:
			panic("more than 4 players")
		}
		m[v] = &game.Player{
			Name:     v[0:strings.LastIndex(v, "_")],
			Id:       v,
			Lives:    3,
			Location: loc,
			PBomb:    game.PBomb{Placed: 0, Range: 1, Max: 1},
			Speed:    game.PSpeed,
			Color:    y[z],
		}
	}
	return m
}

func GetId() {

}
