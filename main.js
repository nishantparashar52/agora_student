import AgoraRTC from "agora-rtc-sdk-ng";
import { sendEvent } from "./mixPanel";
import * as uuid from 'uuid'
let host = false;
console.log('APPID', import.meta.env.VITE_APP_APPID);
let options = {
  // Pass your App ID here.
  appId: import.meta.env.VITE_APP_APPID || "526b5d98970e4093b953bd95e54a737a",
  // Set the channel name.
  channel: import.meta.env.VITE_APP_CHANNEL || "nn",
  // Pass your temp token here.
  token:
  import.meta.env.VITE_APP_TOKEN || "007eJxTYLDw0FNZac398nOSSvQL09RQBZtrX7iD5giefSldNeP3hecKDKZGZkmmKZYWluYGqSYGlsZJlqbGSSmWpqmmJonmxuaJTwJ2pTQEMjKw7uNlYIRCEJ+JIS+PgQEAo5kdSQ==",
  // Set the user ID.
  uid: uuid.v4(),
};
let channelParameters = {
  // A variable to hold a local audio track.
  localAudioTrack: null,
  // A variable to hold a local video track.
  localVideoTrack: null,
  // A variable to hold a remote audio track.
  remoteAudioTrack: null,
  // A variable to hold a remote video track.
  remoteVideoTrack: null,
  // A variable to hold the remote user id.s
  remoteUid: null,
};
async function startBasicCall() {
  // Create an instance of the Agora Engine

  const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" , role: "audience"});
  // Dynamically create a container in the form of a DIV element to play the remote video track.
  const remotePlayerContainer = document.createElement("div");
  // Dynamically create a container in the form of a DIV element to play the local video track.
  const localPlayerContainer = document.createElement("div");
  // Specify the ID of the DIV container. You can use the uid of the local user.
  localPlayerContainer.id = options.uid;
  // Set the textContent property of the local video container to the local user id.
  localPlayerContainer.textContent = "Local user " + (host ? 'Host': 'Audience');
  // Set the local video container size.
  localPlayerContainer.style.width = "640px";
  localPlayerContainer.style.height = "480px";
  localPlayerContainer.style.padding = "15px 5px 5px 5px";
  // Set the remote video container size.
  remotePlayerContainer.style.width = "640px";
  remotePlayerContainer.style.height = "480px";
  remotePlayerContainer.style.padding = "15px 5px 5px 5px";
  // Listen for the "user-published" event to retrieve a AgoraRTCRemoteUser object.
  agoraEngine.on("user-published", async (user, mediaType) => {
    // Subscribe to the remote user when the SDK triggers the "user-published" event.
    await agoraEngine.subscribe(user, mediaType);
    console.log("subscribe success");
    // Subscribe and play the remote video in the container If the remote user publishes a video track.
    if (mediaType == "video") {
      // Retrieve the remote video track.
      channelParameters.remoteVideoTrack = user.videoTrack;
      // Retrieve the remote audio track.
      channelParameters.remoteAudioTrack = user.audioTrack;
      // Save the remote user id for reuse.
      channelParameters.remoteUid = user.uid.toString();
      // Specify the ID of the DIV container. You can use the uid of the remote user.
      remotePlayerContainer.id = user.uid.toString();
      channelParameters.remoteUid = user.uid.toString();
      remotePlayerContainer.textContent = "Remote user " + user.uid.toString();
      // Append the remote container to the page body.
      document.body.append(remotePlayerContainer);
      // Play the remote video track.
      channelParameters.remoteVideoTrack.play(remotePlayerContainer);
    }
    // Subscribe and play the remote audio track If the remote user publishes the audio track only.
    if (mediaType == "audio") {
      // Get the RemoteAudioTrack object in the AgoraRTCRemoteUser object.
      channelParameters.remoteAudioTrack = user.audioTrack;
      // Play the remote audio track. No need to pass any DOM element.
      channelParameters.remoteAudioTrack.play();
    }
    // Listen for the "user-unpublished" event.
    agoraEngine.on("user-unpublished", (user) => {
      console.log(user.uid + "has left the channel");
    });
  });
  window.onload = function () {
    // Listen to the Join button click event.
    document.getElementById("join").onclick = async function () {
      // Join a channel.
      await agoraEngine.join(
        options.appId,
        options.channel,
        options.token,
        options.uid
      );
      // Create a local audio track from the audio sampled by a microphone.
      channelParameters.localAudioTrack =
        await AgoraRTC.createMicrophoneAudioTrack();
      // Create a local video track from the video captured by a camera.
      channelParameters.localVideoTrack =
        await AgoraRTC.createCameraVideoTrack();
      // Append the local video container to the page body.
      document.body.append(localPlayerContainer);
      // Publish the local audio and video tracks in the channel.
      await agoraEngine.publish([
        channelParameters.localAudioTrack,
        channelParameters.localVideoTrack,
      ]);
      // Play the local video track.
      channelParameters.localVideoTrack.play(localPlayerContainer);
      console.log("publish success!");

  setInterval(() => {

    let localAudioStats = agoraEngine.getLocalAudioStats();
    // (localAudioStats) => {
    //   for(var uid in localAudioStats){
    //     console.log(`Audio CodecType from ${uid}: ${localAudioStats[uid].CodecType}`);
    //     console.log(`Audio MuteState from ${uid}: ${localAudioStats[uid].MuteState}`);
    //     console.log(`Audio RecordingLevel from ${uid}: ${localAudioStats[uid].RecordingLevel}`);
    //     console.log(`Audio SamplingRate from ${uid}: ${localAudioStats[uid].SamplingRate}`);
    //     console.log(`Audio SendBitrate from ${uid}: ${localAudioStats[uid].SendBitrate}`);
    //     console.log(`Audio SendLevel from ${uid}: ${localAudioStats[uid].SendLevel}`);
    //   }
    // });
    let localVideoStats = agoraEngine.getLocalVideoStats();
    // (localVideoStats) => {
    //   for(var uid in localVideoStats){
    //     console.log(`Video CaptureFrameRate from ${uid}: ${localVideoStats[uid].CaptureFrameRate}`);
    //     console.log(`Video CaptureResolutionHeight from ${uid}: ${localVideoStats[uid].CaptureResolutionHeight}`);
    //     console.log(`Video CaptureResolutionWidth from ${uid}: ${localVideoStats[uid].CaptureResolutionWidth}`);
    //     console.log(`Video EncodeDelay from ${uid}: ${localVideoStats[uid].EncodeDelay}`);
    //     console.log(`Video MuteState from ${uid}: ${localVideoStats[uid].MuteState}`);
    //     console.log(`Video SendBitrate from ${uid}: ${localVideoStats[uid].SendBitrate}`);
    //     console.log(`Video SendFrameRate from ${uid}: ${localVideoStats[uid].SendFrameRate}`);
    //     console.log(`Video SendResolutionHeight from ${uid}: ${localVideoStats[uid].SendResolutionHeight}`);
    //     console.log(`Video SendResolutionWidth from ${uid}: ${localVideoStats[uid].SendResolutionWidth}`);
    //     console.log(`Video TargetSendBitrate from ${uid}: ${localVideoStats[uid].TargetSendBitrate}`);
    //     console.log(`Video TotalDuration from ${uid}: ${localVideoStats[uid].TotalDuration}`);
    //     console.log(`Video TotalFreezeTime from ${uid}: ${localVideoStats[uid].TotalFreezeTime}`);
    //   }
    // });
    let remoteAudioStats = agoraEngine.getLocalVideoStats();
    // agoraEngine.getRemoteAudioStats((remoteAudioStatsMap) => {
    //   for(var uid in remoteAudioStatsMap){
    //     console.log(`Audio CodecType from ${uid}: ${remoteAudioStatsMap[uid].CodecType}`);
    //     console.log(`Audio End2EndDelay from ${uid}: ${remoteAudioStatsMap[uid].End2EndDelay}`);
    //     console.log(`Audio MuteState from ${uid}: ${remoteAudioStatsMap[uid].MuteState}`);
    //     console.log(`Audio PacketLossRate from ${uid}: ${remoteAudioStatsMap[uid].PacketLossRate}`);
    //     console.log(`Audio RecvBitrate from ${uid}: ${remoteAudioStatsMap[uid].RecvBitrate}`);
    //     console.log(`Audio RecvLevel from ${uid}: ${remoteAudioStatsMap[uid].RecvLevel}`);
    //     console.log(`Audio TotalFreezeTime from ${uid}: ${remoteAudioStatsMap[uid].TotalFreezeTime}`);
    //     console.log(`Audio TotalPlayDuration from ${uid}: ${remoteAudioStatsMap[uid].TotalPlayDuration}`);
    //     console.log(`Audio TransportDelay from ${uid}: ${remoteAudioStatsMap[uid].TransportDelay}`);
    //   }
    // });
    let remoteVideoStats = agoraEngine.getRemoteVideoStats();
    // agoraEngine.getRemoteVideoStats((remoteVideoStatsMap) => {
    //   for(var uid in remoteVideoStatsMap){
    //     console.log(`Video End2EndDelay from ${uid}: ${remoteVideoStatsMap[uid].End2EndDelay}`);
    //     console.log(`Video MuteState from ${uid}: ${remoteVideoStatsMap[uid].MuteState}`);
    //     console.log(`Video PacketLossRate from ${uid}: ${remoteVideoStatsMap[uid].PacketLossRate}`);
    //     console.log(`Video RecvBitrate from ${uid}: ${remoteVideoStatsMap[uid].RecvBitrate}`);
    //     console.log(`Video RecvResolutionHeight from ${uid}: ${remoteVideoStatsMap[uid].RecvResolutionHeight}`);
    //     console.log(`Video RecvResolutionWidth from ${uid}: ${remoteVideoStatsMap[uid].RecvResolutionWidth}`);
    //     console.log(`Video RenderFrameRate from ${uid}: ${remoteVideoStatsMap[uid].RenderFrameRate}`);
    //     console.log(`Video RenderResolutionHeight from ${uid}: ${remoteVideoStatsMap[uid].RenderResolutionHeight}`);
    //     console.log(`Video RenderResolutionWidth from ${uid}: ${remoteVideoStatsMap[uid].RenderResolutionWidth}`);
    //     console.log(`Video TotalFreezeTime from ${uid}: ${remoteVideoStatsMap[uid].TotalFreezeTime}`);
    //     console.log(`Video TotalPlayDuration from ${uid}: ${remoteVideoStatsMap[uid].TotalPlayDuration}`);
    //     console.log(`Video TransportDelay from ${uid}: ${remoteVideoStatsMap[uid].TransportDelay}`);
    //   }
    // });
    sendEvent('HOST_AUDIO_STATS', {...localAudioStats, user: options.uid});
    sendEvent('HOST_VIDEO_STATS', {...localVideoStats, user: options.uid});
    sendEvent('HOST_AV_STATS', {...agoraEngine.getRTCStats(), user: options.uid, netowrk: agoraEngine.getRemoteNetworkQuality()});
    // sendEvent('remote video stats', remoteVideoStats);
    // sendEvent('remote audio stats', remoteAudioStats);
    agoraEngine.on("exception", function(evt) {
      sendEvent('EXCEPTION', {code: evt.code, msg: evt.msg, uid: evt.uid})
      // console.log(evt.code, evt.msg, evt.uid);
    })
  }, 5000);
    };
    // Listen to the Leave button click event.
    document.getElementById("leave").onclick = async function () {
      // Destroy the local audio and video tracks.
      channelParameters.localAudioTrack.close();
      channelParameters.localVideoTrack.close();
      // Remove the containers you created for the local video and remote video.
      removeVideoDiv(remotePlayerContainer.id);
      removeVideoDiv(localPlayerContainer.id);
      // Leave the channel
      await agoraEngine.leave();
      console.log("You left the channel");
      // Refresh the page for reuse
      window.location.reload();
    };
  };
}
startBasicCall();
// Remove the video stream from the container.
function removeVideoDiv(elementId) {
  console.log("Removing " + elementId + "Div");
  let Div = document.getElementById(elementId);
  if (Div) {
    Div.remove();
  }
}
