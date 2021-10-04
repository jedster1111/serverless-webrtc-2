import { useState, useEffect, useCallback } from "react";

type FindByType<Union, Type> = Union extends { type: Type } ? Union : never;

export type BaseMessage<T extends string = string, D = undefined> = {
  type: T;
  data: D;
};

type UseServerlessWebRTCConfig = {
  /**
   * When connecting to someone on the same network, not using an ICE server will significantly reduce the time required to set up a connection.
   * When trying to connect with people on a separate network, a real ice server may be required.
   *
   * Defaults to false.
   */
  useIceServer: boolean;
};

export type ConnectionState =
  | "initial"
  | "waitingForRemoteDescription"
  | "needToSendLocalDescription"
  | "connected"
  | "disconnected";

export type ServerlessWebRTC = ReturnType<typeof useServerlessWebRTC>;

const defaultConfig: UseServerlessWebRTCConfig = {
  useIceServer: false,
};

function calculateConnectionState(
  rtcConnectionState: RTCPeerConnectionState,
  hasRemoteDescription: boolean
): ConnectionState {
  if (rtcConnectionState === "new") {
    return "initial";
  }

  if (rtcConnectionState === "connecting") {
    if (!hasRemoteDescription) {
      return "waitingForRemoteDescription";
    } else {
      return "needToSendLocalDescription";
    }
  }

  if (rtcConnectionState === "connected") {
    return "connected";
  }

  if (
    rtcConnectionState === "closed" ||
    rtcConnectionState === "disconnected" ||
    rtcConnectionState === "failed"
  ) {
    return "disconnected";
  }

  return "disconnected";
}

export const useServerlessWebRTC = <
  MessageTypes extends string,
  Message extends BaseMessage<MessageTypes, any>
>(
  config?: Partial<UseServerlessWebRTCConfig>
) => {
  const { useIceServer } = { ...defaultConfig, ...config };

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
  const [rtcConnectionState, setRTCConnectionState] =
    useState<RTCPeerConnectionState>("new");

  const [isIceGatheringComplete, setIsIceGatheringComplete] = useState(false);
  const [localDescription, setLocalDescription] =
    useState<RTCSessionDescription>();
  const [hasRemoteDescription, setHasRemoteDescription] =
    useState<boolean>(false);

  const [messageHandlers, setMessageHandlers] = useState<{
    [T in Message["type"]]?: (message: FindByType<Message, T>) => void;
  }>({});

  useEffect(() => {
    let shouldContinue = true;
    let peerConnection: RTCPeerConnection;
    const senders: RTCRtpSender[] = [];

    const setup = async () => {
      peerConnection = new RTCPeerConnection({
        iceServers: useIceServer
          ? [{ urls: "stun:stun.l.google.com:19302" }]
          : [],
      });

      const dataChannel = peerConnection.createDataChannel("text", {
        negotiated: true,
        id: 0,
      });

      setDataChannel(dataChannel);

      peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription();
      };

      peerConnection.onicegatheringstatechange = () => {
        const iceGatheringState = peerConnection.iceGatheringState;
        if (iceGatheringState === "new" || iceGatheringState === "gathering") {
          setIsIceGatheringComplete(false);
        } else if (iceGatheringState === "complete") {
          setIsIceGatheringComplete(true);
          setLocalDescription(peerConnection.localDescription || undefined);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const connectionState = peerConnection.connectionState;
        setRTCConnectionState(connectionState);
      };

      shouldContinue && setPeerConnection(peerConnection);
    };

    setup();

    return () => {
      shouldContinue = false;

      for (const sender of senders) {
        peerConnection?.removeTrack(sender);
      }

      setPeerConnection(undefined);
      setDataChannel(undefined);
      setRTCConnectionState("new");
      setLocalDescription(undefined);
      setIsIceGatheringComplete(false);
      setHasRemoteDescription(false);
    };
  }, [useIceServer]);

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      let message: FindByType<Message, MessageTypes> | undefined;
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error("Could not parse message as JSON:", event.data);
      }

      if (!message) {
        console.error("A message was not provided.");
        return;
      }

      if (!message.type) {
        console.error("The message did not contain a type");
        return;
      }

      const messageHandler = messageHandlers[message.type];

      if (!messageHandler) {
        console.warn(
          "No handler registered for message with type:",
          message.type
        );
        return;
      }

      messageHandler(message);
    };
  }, [dataChannel, messageHandlers]);

  const setRemoteDescription = async (remoteDescriptionString: string) => {
    if (!peerConnection)
      throw new Error(
        "Tried to set remote description before Peer Connection was created."
      );

    const remoteDescription = JSON.parse(
      remoteDescriptionString
    ) as RTCSessionDescription;

    await peerConnection.setRemoteDescription(remoteDescription);
    setHasRemoteDescription(true);

    if (remoteDescription.type === "offer") {
      setLocalDescription(undefined);
      await peerConnection.setLocalDescription();
      setLocalDescription(peerConnection.localDescription || undefined);
    }
  };

  const sendMessage = <T extends Message["type"]>(
    messageType: T,
    data: FindByType<Message, T>["data"]
  ) => {
    if (!dataChannel) return;

    const message: BaseMessage<T, typeof data> = {
      type: messageType,
      data,
    };

    dataChannel.send(JSON.stringify(message));
  };

  const registerEventHandler = useCallback(
    <T extends Message["type"]>(
      messageType: T,
      handler: (message: FindByType<Message, T>) => void
    ) => {
      setMessageHandlers((prev) => ({
        ...prev,
        [messageType]: handler,
      }));

      return () => {
        setMessageHandlers((prev) => {
          const newHandlers = { ...prev };
          delete newHandlers[messageType];

          return newHandlers;
        });
      };
    },
    []
  );

  return {
    localDescription: JSON.stringify(localDescription),
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    isLoading: !isIceGatheringComplete,
    connectionState: calculateConnectionState(
      rtcConnectionState,
      hasRemoteDescription
    ),
  };
};
