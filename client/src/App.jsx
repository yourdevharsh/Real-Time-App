import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("General");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");

  const joinRoom = () => {
    if (username !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          String(new Date(Date.now()).getMinutes()).padStart(2, "0"),
      };

      await socket.emit("send_message", messageData);
      setCurrentMessage("");
      socket.emit("typing", { room, author: username, isTyping: false });
    }
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    if (e.target.value.length > 0) {
      socket.emit("typing", { room, author: username, isTyping: true });
    } else {
      socket.emit("typing", { room, author: username, isTyping: false });
    }
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };

    const handleTypingStatus = (data) => {
      if (data.isTyping) {
        setTypingStatus(`${data.author} is typing...`);
      } else {
        setTypingStatus("");
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing_status", handleTypingStatus);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing_status", handleTypingStatus);
    };
  }, []);

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h2>Join Session</h2>
          <input
            type="text"
            placeholder="Identity (e.g., Nakul)"
            onChange={(e) => setUsername(e.target.value)}
          />
          <select onChange={(e) => setRoom(e.target.value)} value={room}>
            <option value="General">General</option>
            <option value="Tech Support">Tech Support</option>
            <option value="Engineering">Engineering</option>
          </select>
          <button onClick={joinRoom}>Initialize Connection</button>
        </div>
      ) : (
        <div className="chat-window">
          <div className="chat-header">
            <p>Live: {room}</p>
          </div>
          <div className="chat-body">
            {messageList.map((messageContent, index) => {
              return (
                <div
                  className="message"
                  id={username === messageContent.author ? "you" : "other"}
                  key={index}
                >
                  <div>
                    <div className="message-content">
                      <p>{messageContent.message}</p>
                    </div>
                    <div className="message-meta">
                      <p id="time">{messageContent.time}</p>
                      <p id="author">{messageContent.author}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {typingStatus && <p className="typing-indicator">{typingStatus}</p>}
          </div>
          <div className="chat-footer">
            <input
              type="text"
              value={currentMessage}
              placeholder="Dispatch payload..."
              onChange={handleTyping}
              onKeyPress={(event) => {
                event.key === "Enter" && sendMessage();
              }}
            />
            <button onClick={sendMessage}>&#9658;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
