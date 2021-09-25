import { useState, useEffect } from "react";

const defaultRTCConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function getLocalStream() {
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
}

export const useServerlessWebRTC = () => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [isIceGatheringComplete, setIsIceGatheringComplete] = useState(false);
  const [localDescription, setLocalDescription] =
    useState<RTCSessionDescription>();

  useEffect(() => {
    const setup = async () => {
      const peerConnection = new RTCPeerConnection(defaultRTCConfig);
      const localMediaStream = await getLocalStream();

      setPeerConnection(peerConnection);
      setLocalStream(localMediaStream);
    };

    setup();
  }, []);

  useEffect(() => {
    if (!peerConnection || !localStream) return;

    for (const track of localStream.getTracks()) {
      console.log("Adding local tracks", track)
      peerConnection.addTrack(track, localStream);
    }

    peerConnection.ontrack = ({ track, streams }) => {
      console.log("Received remote track!", track.id)
      track.onunmute = () => {
        console.log("Track unmuted!", track.id)
        if (remoteStream) return;
        
        console.log("Use this stream in state!", track.id)
        setRemoteStream(streams[0]);
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("On negotiation needed! Setting local description.");
      await peerConnection.setLocalDescription();
    };

    peerConnection.onicecandidate = ({ candidate }) => {
      console.log("Received Ice Candidate");

      if (candidate === null) {
        // At this point ICE candidate collection has completed
        console.log("Received null candidate");
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      const iceGatheringState = peerConnection.iceGatheringState;
      if (iceGatheringState === "new" || iceGatheringState === "gathering") {
        console.log("Ice gathering in progress.", iceGatheringState);
        setIsIceGatheringComplete(false);
      } else if (iceGatheringState === "complete") {
        console.log("Ice gathering complete");
        setIsIceGatheringComplete(true);
        setLocalDescription(peerConnection.localDescription || undefined);
      }
    };
  }, [peerConnection, localStream]);

  const setRemoteDescription = async (remoteDescriptionString: string) => {
    if (!peerConnection)
      throw new Error(
        "Tried to set remote description before Peer Connection was created."
      );

    const remoteDescription = JSON.parse(
      remoteDescriptionString
    ) as RTCSessionDescription;
    

    await peerConnection.setRemoteDescription(remoteDescription);

    if (remoteDescription.type === "offer") {
      setLocalDescription(undefined)
      await peerConnection.setLocalDescription();
      setLocalDescription(peerConnection.localDescription || undefined);
    }
  };

  return {
    localDescription:
      isIceGatheringComplete && localDescription
        ? JSON.stringify(localDescription)
        : undefined,
    setRemoteDescription,
    localStream,
    remoteStream
  };
};
