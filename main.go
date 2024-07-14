package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/skip2/go-qrcode"
)

type Chatter struct {
	Chatter string `json:"chatter"`
	Color   string `json:"color"`
	Message string `json:"message"`
}

func generateQrcode(c *gin.Context) {
	code := c.Param("code")
	png, err := qrcode.Encode(code, qrcode.Medium, 256)
	if err != nil {
		// Handle error, maybe return an HTTP 500 or similar
		c.String(http.StatusInternalServerError, "Failed to generate QR code")
		return
	}
	c.Data(http.StatusOK, "image/png", png)
}
func blockingTask(chanel chan Chatter) {
	var i Chatter
	i.Chatter = "Chatter"
	i.Color = "Red"
	i.Message = "Hello World"
	for {
		time.Sleep(100 * time.Millisecond)

		i.Message = time.Now().String()
		chanel <- i

	}

}
func printChanel(chanel chan Chatter) {
	for {
		select {
		case msg := <-chanel:
			fmt.Printf("\r%s", msg)
		}
	}
}

func spam_user(chanel chan<- Chatter) {
	for {
		time.Sleep(100 * time.Millisecond)
		colors := []string{"red", "blue", "green", "orange", "white", "purple"}
		name := []string{"John", "Doe", "Jane", "Smith", "Alice", "Bob"}
		selectedColor := colors[rand.Intn(len(colors))]
		selectedName := name[rand.Intn(len(name))]
		chanel <- Chatter{
			Chatter: selectedName,
			Color:   selectedColor,
			Message: time.Now().String(),
		}
	}
}

func main() {
	router := gin.Default()
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	var chatterChannels []chan Chatter // Step 1: Change to a slice of channels

	router.GET("/generateQrcode/:code", generateQrcode)
	router.GET("/ws", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Print("upgrade:", err)
			return
		}
		defer ws.Close()

		chatterChannel := make(chan Chatter)
		done := make(chan struct{})
		chatterChannels = append(chatterChannels, chatterChannel)

		go func() {
			defer close(done)
			for {
				messageType, message, err := ws.ReadMessage()
				if err != nil {
					log.Println("read:", err)
					return
				}
				// Print the received message
				log.Printf("Received message - Type: %d, Content: %s", messageType, string(message))

				// If you want to handle different message types
				switch messageType {
				case websocket.TextMessage:
					log.Printf("Received text message: %s", string(message))

					// Unmarshal the JSON directly into a Chatter type
					var chatMessageObj Chatter
					err = json.Unmarshal(message, &chatMessageObj)
					if err != nil {
						log.Printf("error unmarshalling chatmessage: %v", err)
						continue
					}

					log.Printf("Parsed Chatter: %+v", chatMessageObj)
					for _, channel := range chatterChannels {
						channel <- chatMessageObj
					}
				case websocket.BinaryMessage:
					log.Printf("Received binary message of length: %d", len(message))
				default:
					log.Printf("Received message of type: %d", messageType)
				}
			}
		}()

		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()

			for {
				select {
				case chatter := <-chatterChannel:
					jsonChatter, err := json.Marshal(chatter)
					if err != nil {
						log.Printf("error marshalling Chatter: %v", err)
						continue
					}
					if err := ws.WriteMessage(websocket.TextMessage, jsonChatter); err != nil {
						log.Printf("error writing message: %v", err)
						return
					}
				case <-ticker.C:
					if err := ws.WriteMessage(websocket.PingMessage, nil); err != nil {
						log.Println("ping:", err)
						return
					}
				case <-done:
					return
				}
			}
		}()

		<-done
	})

	log.Fatal(router.Run(":8080"))
}
