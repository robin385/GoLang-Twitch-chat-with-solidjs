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
      const read = JSON.parse(event.data);
      const temp = [...chat(), JSON.parse(event.data)];
      if (temp.length > 10) {
        setChat(temp.slice(1));
      } else setChat(temp);
    };
    return () => {
      ws.close();
    };
  });

  return (
    <div className={styles.appContainer}>
      <div className={styles.chatBox}>
        <div className={styles.messageList}>
          {chat().map((message) => (
            <div className={styles.messageItem} style={{ borderColor: message.color }}>
              <span className={styles.chatter} style={{ color: message.color }}>
                {message.chatter}
              </span>
              <span className={styles.message}>{message.message}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.inputArea}>
        <input type="text" id="message" className={styles.input} placeholder="Your message" />
        <input type="text" id="chatter" className={styles.input} placeholder="Your name" />
        <input type="color" id="color" className={styles.colorPicker} defaultValue="#ff0000" />
        <button onClick={messageSender} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
