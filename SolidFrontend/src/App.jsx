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
    if (message === "" || chatterr === "") return;
    document.getElementById("message").value = "";

    const chatter = { chatter: chatterr, message: message, color: color };

    if (ws.readyState === WebSocket.OPEN) {
      console.log("Sending message to server");
      ws.send(JSON.stringify(chatter));
    }
  };
  onMount(() => {
    if (ws.readyState === WebSocket.OPEN) {
    }
    if (ws.readyState === WebSocket.CLOSED) {
      console.log("WebSocket connection closed");
    }
    ws.onmessage = function (event) {
      const temp = [...chat(), JSON.parse(event.data)];
      if (temp.length > 8) {
        setChat(temp.slice(1));
      } else setChat(temp);
    };
    return () => {
      ws.close();
    };
  });
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      messageSender();
    }
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.chatBox}>
        <div className={styles.messageList}>
          {chat().map((message, index) => (
            <div
              className={index === chat().length - 1 ? styles.messageItemLast : styles.messageItem}
              style={{ borderColor: message.color }}>
              <span className={styles.chatter} style={{ color: message.color }}>
                {message.chatter}:{console.log(index)}
              </span>
              <span className={styles.message}>{message.message}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.inputArea}>
        <input type="text" id="message" className={styles.input} placeholder="Your message" onkeydown={handleKeyDown} />
        <input type="text" id="chatter" className={styles.input} placeholder="Your name" onkeydown={handleKeyDown} />
        <input
          type="color"
          id="color"
          className={styles.colorPicker}
          defaultValue="#ff0000"
          onkeydown={handleKeyDown}
        />
        <button onClick={messageSender} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
