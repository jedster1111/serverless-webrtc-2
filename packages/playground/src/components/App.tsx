import React, { useEffect, useState } from "react";
import { useServerlessWebRTC, BaseMessage } from "serverless-webrtc";
import ReactPlayer from "react-player";

type Messages = TextMessage | PingMessage;

type TextMessage = BaseMessage<"text-message", string>;
type PingMessage = BaseMessage<"ping">;

// const iceServers = ["stun:stun.l.google.com:19302"];
const iceServers: string[] = [];

const App = () => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (newMessage: string) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  const {
    localDescription,
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    connectionState,
    isLoading,
  } = useServerlessWebRTC<Messages["type"], Messages>({
    iceServers,
  });

  useEffect(() => {
    registerEventHandler("text-message", (message) => {
      console.log("Received text-message:", message.data);
      addMessage(message.data);
    });
    registerEventHandler("ping", () => {
      console.log("Received ping-message.");
    });
  }, []);
  return (
    <div className="app">
      <div>
        {isLoading && <div>Loading...</div>}
        <div>{connectionState}</div>
      </div>
      <div>
        <button
          disabled={isLoading}
          onClick={() => {
            !isLoading && localDescription && navigator.clipboard.writeText(localDescription);
          }}
        >
          Copy local description
        </button>
      </div>
      <div>
        <input
          value={remoteDescriptionString}
          onChange={(e) => {
            setRemoteDescriptionString(e.target.value);
          }}
        />
        <button
          onClick={() => {
            if (!remoteDescriptionString) return;

            setRemoteDescription(remoteDescriptionString);
          }}
        >
          Connect
        </button>
      </div>

      <div>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button
          onClick={() => {
            sendMessage({ type: "text-message", data: message });
            addMessage(message);
            setMessage("");
          }}
        >
          Send Text Message
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            sendMessage({ type: "ping" });
          }}
        >
          Send Ping Message
        </button>
      </div>
      <div>
        <p>Messages</p>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
