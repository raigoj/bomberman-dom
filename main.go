package main

import (
	"log"
	"net/http"
)

func main() {
	go h.run()
	// static := http.FileServer(http.Dir("./static"))
	// http.Handle("/", )

	http.HandleFunc("/ws/", func(w http.ResponseWriter, r *http.Request) {
		upgrader.CheckOrigin = func(r *http.Request) bool { return true }
		roomId := r.URL.Path[len("/ws/"):]
		log.Println("roomid: ", roomId)
		serveWs(w, r, roomId)
	})
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
