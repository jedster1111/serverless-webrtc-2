import { useState, useEffect } from "react";

type FindByType<Union, Type> = Union extends { type: Type } ? Union : never;

export type BaseMessage<
  T extends string = string,
  D = undefined
> = D extends undefined ? MessageWithoutData<T> : MessageWithData<T, D>;

type MessageWithData<T extends string, D> = {
  type: T;
  data: D;
};

type MessageWithoutData<T extends string> = {
  type: T;
};

type UseServerlessWebRTCConfig = {
  /**
   * For instance: `stun:stun.l.google.com:19302`
   *
   * When running locally, just trying to connect to yourself, leaving this empty will significantly reduce the time required to set up a connection.
   * When trying to connect with other people on different networks, a real ice server may be required.
   */
  iceServers: string[];
};

const defaultConfig: UseServerlessWebRTCConfig = {
  iceServers: [],
};

export const useServerlessWebRTC = <
  MessageTypes extends string,
  Message extends BaseMessage<MessageTypes, any>
>(
  config?: Partial<UseServerlessWebRTCConfig>
) => {
  const { iceServers } = { ...defaultConfig, ...config };

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
  const [isIceGatheringComplete, setIsIceGatheringComplete] = useState(false);
  const [localDescription, setLocalDescription] =
    useState<RTCSessionDescription>();

  const [messageHandlers, setMessageHandlers] = useState<{
    [T in Message["type"]]?: (message: FindByType<Message, T>) => void;
  }>({});

  useEffect(() => {
    let shouldContinue = true;
    let peerConnection: RTCPeerConnection;
    const senders: RTCRtpSender[] = [];

    const setup = async () => {
      peerConnection = new RTCPeerConnection({
        iceServers: iceServers.map((iceServer) => ({ urls: iceServer })),
      });

      const dataChannel = peerConnection.createDataChannel("text", {
        negotiated: true,
        id: 0,
      });

      setDataChannel(dataChannel);

      dataChannel.onopen = (event) => {
        console.log("Opened 'text' data channel.", event);
      };

      peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription();
        console.log(
          "On negotiation needed! Setting local description.",
          peerConnection.localDescription
        );
      };

      peerConnection.onicegatheringstatechange = () => {
        const iceGatheringState = peerConnection.iceGatheringState;
        console.log("Ice gathering state change:", iceGatheringState);
        if (iceGatheringState === "new" || iceGatheringState === "gathering") {
          setIsIceGatheringComplete(false);
        } else if (iceGatheringState === "complete") {
          setIsIceGatheringComplete(true);
          console.log(
            "Setting localDescription after ice gathering completed:",
            peerConnection.localDescription
          );
          setLocalDescription(peerConnection.localDescription || undefined);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const connectionState = peerConnection.connectionState;
        if (connectionState === "disconnected") {
          console.log("Disconnected!");
        }
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
    };
  }, [iceServers]);

  useEffect(() => {
    if (!dataChannel) return;

    console.log(
      "Setting up data channel handlers!",
      Object.keys(messageHandlers)
    );

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

    console.log("Setting remote description");
    await peerConnection.setRemoteDescription(remoteDescription);

    if (remoteDescription.type === "offer") {
      console.log("Remote was an offer!");

      setLocalDescription(undefined);
      await peerConnection.setLocalDescription();
      console.log(
        "Setting local description, after remote",
        peerConnection.localDescription
      );
      setLocalDescription(peerConnection.localDescription || undefined);
    }
  };

  const sendMessage = (message: Message) => {
    if (!dataChannel) return;

    console.log("Sending message:", message);
    dataChannel.send(JSON.stringify(message));
  };

  const registerEventHandler = <T extends Message["type"]>(
    messageType: T,
    handler: (message: FindByType<Message, T>) => void
  ) => {
    console.log("Registering handler for message with type:", messageType);
    setMessageHandlers((prev) => ({
      ...prev,
      [messageType]: handler,
    }));
  };

  return {
    localDescription:
      isIceGatheringComplete && localDescription
        ? JSON.stringify(localDescription)
        : undefined,
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    isIceGatheringComplete,
  };
};
