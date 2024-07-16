package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Chatter struct {
	Chatter string `json:"chatter"`
	Color   string `json:"color"`
	Message string `json:"message"`
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	clients    = make(map[*websocket.Conn]bool)
	broadcast  = make(chan Chatter)
	clientsMux sync.Mutex
)

func handleWebSocket(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}
	defer ws.Close()

	clientsMux.Lock()
	clients[ws] = true
	clientsMux.Unlock()

	for {
		messageType, message, err := ws.ReadMessage()
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		switch messageType {
		case websocket.TextMessage:
			var chatMessageObj Chatter
			err = json.Unmarshal(message, &chatMessageObj)
			if err != nil {
				log.Printf("Error unmarshalling chatmessage: %v", err)
				continue
			}

			broadcast <- chatMessageObj

		case websocket.BinaryMessage:
			log.Printf("Received binary message of length: %d", len(message))
		default:
			log.Printf("Received message of type: %d", messageType)
		}
	}

	clientsMux.Lock()
	delete(clients, ws)
	clientsMux.Unlock()
}
func broadcastMessages() {
	for {
		msg := <-broadcast
		clientsMux.Lock()
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("Error broadcasting message: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
		clientsMux.Unlock()
	}
}

func main() {
	router := gin.Default()
	go broadcastMessages()
	router.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c)
	})

	log.Fatal(router.Run(":8080"))
}
