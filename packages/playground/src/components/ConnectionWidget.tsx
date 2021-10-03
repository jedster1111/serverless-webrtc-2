import React, { useState } from "react";
import { ServerlessWebRTC, ConnectionState } from "serverless-webrtc-react";

const CopyLocalDescription = ({
  isLoading,
  localDescription,
}: {
  isLoading: boolean;
  localDescription: string | undefined;
}) => {
  return (
    <div>
      <button
        disabled={isLoading}
        onClick={() => {
          !isLoading &&
            localDescription &&
            navigator.clipboard.writeText(localDescription);
        }}
      >
        Copy local description
      </button>
    </div>
  );
};

const RemoteDescriptionInput = ({
  setRemoteDescription,
}: {
  setRemoteDescription: ServerlessWebRTC["setRemoteDescription"];
}) => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");
  return (
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
  );
};

const InitialWidget = ({
  isLoading,
  localDescription,
  setRemoteDescription,
}: {
  isLoading: boolean;
  localDescription: string | undefined;
  setRemoteDescription: ServerlessWebRTC["setRemoteDescription"];
}) => (
  <div>
    <p>To start a call, copy the local description and send it to a friend.</p>
    <p>
      To answer a call, take your friend's description, paste it into the
      connect box and press connect.
    </p>
    <CopyLocalDescription
      isLoading={isLoading}
      localDescription={localDescription}
    />
    <RemoteDescriptionInput setRemoteDescription={setRemoteDescription} />
  </div>
);

const SendLocalDescriptionWidget = ({
  isLoading,
  localDescription,
}: {
  isLoading: boolean;
  localDescription: string | undefined;
}) => (
  <div>
    <p>Now copy your local description and send it to your friend.</p>
    <CopyLocalDescription
      isLoading={isLoading}
      localDescription={localDescription}
    />
  </div>
);

const WaitForRemoteDescriptionWidget = ({
  setRemoteDescription,
}: {
  setRemoteDescription: ServerlessWebRTC["setRemoteDescription"];
}) => (
  <div>
    <p>
      Now get your friend to send you their local description. Paste it into the
      connect box and press connect.
    </p>
    <RemoteDescriptionInput setRemoteDescription={setRemoteDescription} />
  </div>
);

const ConnectedWidget = () => (
  <div>
    <p>You are now connected, try sending each other a message!</p>
  </div>
);

const DisconnectedWidget = () => (
  <div>
    <p>
      Something's gone wrong and you are disconnected. Try refreshing the page
      and starting the connection process again.
    </p>
  </div>
);

export const ConnectionWidget = ({
  connectionState,
  isLoading,
  localDescription,
  setRemoteDescription,
}: {
  connectionState: ConnectionState;
  isLoading: boolean;
  localDescription: string | undefined;
  setRemoteDescription: ServerlessWebRTC["setRemoteDescription"];
}) => {
  if (connectionState === "initial")
    return (
      <InitialWidget
        isLoading={isLoading}
        localDescription={localDescription}
        setRemoteDescription={setRemoteDescription}
      />
    );

  if (connectionState === "needToSendLocalDescription") {
    return (
      <SendLocalDescriptionWidget
        isLoading={isLoading}
        localDescription={localDescription}
      />
    );
  }

  if (connectionState === "waitingForRemoteDescription") {
    return (
      <WaitForRemoteDescriptionWidget
        setRemoteDescription={setRemoteDescription}
      />
    );
  }
  if (connectionState === "connected") {
    return <ConnectedWidget />;
  }

  if (connectionState === "disconnected") {
    return <DisconnectedWidget />;
  }

  return <DisconnectedWidget />;
};
