import React, { useEffect, useState } from "react";
import { useServerlessWebRTC, BaseMessage } from "serverless-webrtc-react";
import { ConnectionWidget } from "./ConnectionWidget";

type Messages = TextMessage | PingMessage;

type TextMessage = BaseMessage<"text-message", { value: string; from: string }>;
type PingMessage = BaseMessage<"ping">;

const App = () => {
  const [isPeerOnSameNetwork, setIsPeerOnSameNetwork] = useState(true);
  const [messageValue, setMessageValue] = useState("");

  const [name, setName] = useState("John Doe");

  const [messages, setMessages] = useState<{ from: string; value: string }[]>(
    []
  );

  const addMessage = (newMessage: TextMessage["data"]) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  const {
    localDescription,
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    connectionState,
    isLocalDescriptionReady,
  } = useServerlessWebRTC<Messages["type"], Messages>({
    useIceServer: !isPeerOnSameNetwork,
  });

  useEffect(() => {
    const unregisterTextMessage = registerEventHandler(
      "text-message",
      (message) => {
        console.log("Received text-message:", message.data);
        addMessage(message.data);
      }
    );
    const unregisterPingMessage = registerEventHandler("ping", () => {
      console.log("Received ping-message.");
    });

    return () => {
      unregisterTextMessage();
      unregisterPingMessage();
    };
  }, [registerEventHandler]);

  return (
    <div className="app">
      <div>
        <div>
          {isPeerOnSameNetwork
            ? "Peer is on the same network"
            : "Peer is not on the same network"}
        </div>
        <button
          onClick={() => {
            setIsPeerOnSameNetwork((prev) => !prev);
          }}
        >
          Toggle is peer on same network
        </button>
      </div>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </div>

      <ConnectionWidget
        connectionState={connectionState}
        isLoading={isLocalDescriptionReady}
        localDescription={localDescription}
        setRemoteDescription={setRemoteDescription}
      />

      <div>
        <input
          value={messageValue}
          onChange={(e) => {
            setMessageValue(e.target.value);
          }}
        />
        <button
          onClick={() => {
            const message = { value: messageValue, from: name };
            sendMessage("text-message", message);
            addMessage(message);
            setMessageValue("");
          }}
        >
          Send Text Message
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            sendMessage("ping", undefined);
          }}
        >
          Send Ping Message
        </button>
      </div>
      <div>
        <p>Messages</p>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              {message.from}: {message.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
