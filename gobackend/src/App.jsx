import { onMount, createSignal } from "solid-js";
import logo from "./logo.svg";
import styles from "./App.module.css";

function App() {
  const chatter = { chatter: "robin", message: "Hello from the client!", color: "red" };
  let ws = new WebSocket("ws://localhost:8080/ws");
  const [chat, setChat] = createSignal([chatter]);
  const messageSender = () => {
    const message = document.getElementById("message").value;
    const chatterr = document.getElementById("chatter").value;
    const color = document.getElementById("color").value;

    const chatter = { chatter: chatterr, message: message, color: color };

    if (ws.readyState === WebSocket.OPEN) {
      console.log("Sending message to server");
      ws.send(JSON.stringify(chatter));
    }
  };
  onMount(() => {
    // Replace 'http://localhost:8080' with your WebSocket server address

    // Send random data every second
    ws.onopen = (e) => {
      // Send a message to the server
    };
    if (ws.readyState === WebSocket.OPEN) {
    }
    if (ws.readyState === WebSocket.CLOSED) {
      console.log("WebSocket connection closed");
    }
    ws.onmessage = function (event) {
      console.log(event);
      setChat([...chat(), JSON.parse(event.data)]);
      if (chat().length > 10) {
        setChat(chat().slice(1));
      }
    };
    const intervalId = setInterval(() => {}, 1000);
    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
      ws.close();
    };
  });

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <label htmlFor="message">Message:</label>
        <input type="text" id="message" defaultValue="Your default message" />
        <label htmlFor="chatter">Chatter:</label>
        <input type="text" id="chatter" defaultValue="Default Chatter" />
        <label htmlFor="color">Color:</label>
        <input type="text" id="color" defaultValue="red" />
        <button
          onClick={() => {
            messageSender();
          }}>
          Send
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <div style={{ "min-width": "400px", width: "400px", height: "300px" }}>
          {chat().map((message) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "row",
                position: "relative",
                left: "10px",
                "font-size": "20px",
                background: "Black",
              }}>
              <div style={{ color: message.color }}>{message.chatter}:</div>
              <div>{message.message}</div>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
