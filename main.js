
import * as uuid from 'uuid'
import { sendEvent } from "./mixPanel";
var client;

var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var remoteUsers = {};

/*
 * On initiation. `client` is not attached to any project or channel for any specific user.
 */


let options = {
  // Pass your App ID here.
  appId: import.meta.env.VITE_APP_APPID || "526b5d98970e4093b953bd95e54a737a",
  // Set the channel name.
  channel: import.meta.env.VITE_APP_CHANNEL || "nishant",
  // Pass your temp token here.
  token:
  import.meta.env.VITE_APP_TOKEN || "007eJxTYLDw0FNZac398nOSSvQL09RQBZtrX7iD5giefSldNeP3hecKDKZGZkmmKZYWluYGqSYGlsZJlqbGSSmWpqmmJonmxuaJTwJ2pTQEMjKw7uNlYIRCEJ+JIS+PgQEAo5kdSQ==",
  // Set the user ID.
  uid: ''
};

// you can find all the agora preset video profiles here https://docs.agora.io/en/Voice/API%20Reference/web_ng/globals.html#videoencoderconfigurationpreset
var videoProfiles = [{
  label: "360p_7",
  detail: "480×360, 15fps, 320Kbps",
  value: "360p_7"
}, {
  label: "360p_8",
  detail: "480×360, 30fps, 490Kbps",
  value: "360p_8"
}, {
  label: "480p_1",
  detail: "640×480, 15fps, 500Kbps",
  value: "480p_1"
}, {
  label: "480p_2",
  detail: "640×480, 30fps, 1000Kbps",
  value: "480p_2"
}, {
  label: "720p_1",
  detail: "1280×720, 15fps, 1130Kbps",
  value: "720p_1"
}, {
  label: "720p_2",
  detail: "1280×720, 30fps, 2000Kbps",
  value: "720p_2"
}, {
  label: "1080p_1",
  detail: "1920×1080, 15fps, 2080Kbps",
  value: "1080p_1"
}, {
  label: "1080p_2",
  detail: "1920×1080, 30fps, 3000Kbps",
  value: "1080p_2"
}];
var curVideoProfile;
AgoraRTC.onAutoplayFailed = () => {
  alert("click to start autoplay!");
};
AgoraRTC.onMicrophoneChanged = async changedDevice => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.audioTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.audioTrack.getTrackLabel()) {
    const oldMicrophones = await AgoraRTC.getMicrophones();
    oldMicrophones[0] && localTracks.audioTrack.setDevice(oldMicrophones[0].deviceId);
  }
};
AgoraRTC.onCameraChanged = async changedDevice => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.videoTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.videoTrack.getTrackLabel()) {
    const oldCameras = await AgoraRTC.getCameras();
    oldCameras[0] && localTracks.videoTrack.setDevice(oldCameras[0].deviceId);
  }
};
async function initDevices() {
  if (!localTracks.audioTrack) {
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard"
    });
  }
  if (!localTracks.videoTrack) {
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: curVideoProfile.value
    });
  }
  // get mics
  mics = await AgoraRTC.getMicrophones();
  const audioTrackLabel = localTracks.audioTrack.getTrackLabel();
  currentMic = mics.find(item => item.label === audioTrackLabel);
  $(".mic-input").val(currentMic.label);
  $(".mic-list").empty();
  mics.forEach(mic => {
    $(".mic-list").append(`<a class="dropdown-item" href="#">${mic.label}</a>`);
  });

  // get cameras
  cams = await AgoraRTC.getCameras();
  const videoTrackLabel = localTracks.videoTrack.getTrackLabel();
  currentCam = cams.find(item => item.label === videoTrackLabel);
  $(".cam-input").val(currentCam.label);
  $(".cam-list").empty();
  cams.forEach(cam => {
    $(".cam-list").append(`<a class="dropdown-item" href="#">${cam.label}</a>`);
  });
}
async function switchCamera(label) {
  currentCam = cams.find(cam => cam.label === label);
  $(".cam-input").val(currentCam.label);
  // switch device of local video track.
  await localTracks.videoTrack.setDevice(currentCam.deviceId);
}
async function switchMicrophone(label) {
  currentMic = mics.find(mic => mic.label === label);
  $(".mic-input").val(currentMic.label);
  // switch device of local audio track.
  await localTracks.audioTrack.setDevice(currentMic.deviceId);
}
function initVideoProfiles() {
  videoProfiles.forEach(profile => {
    $(".profile-list").append(`<a class="dropdown-item" label="${profile.label}" href="#">${profile.label}: ${profile.detail}</a>`);
  });
  curVideoProfile = videoProfiles.find(item => item.label == '480p_1');
  $(".profile-input").val(`${curVideoProfile.detail}`);
}
async function changeVideoProfile(label) {
  curVideoProfile = videoProfiles.find(profile => profile.label === label);
  $(".profile-input").val(`${curVideoProfile.detail}`);
  // change the local video track`s encoder configuration
  localTracks.videoTrack && (await localTracks.videoTrack.setEncoderConfiguration(curVideoProfile.value));
}

/*
 * When this page is called with parameters in the URL, this procedure
 * attempts to join a Video Call channel using those parameters.
 */
$(() => {
  initVideoProfiles();
  $(".profile-list").delegate("a", "click", function (e) {
    changeVideoProfile(this.getAttribute("label"));
  });
});

/*
 * When a user clicks Join or Leave in the HTML form, this procedure gathers the information
 * entered in the form and calls join asynchronously. The UI is updated to match the options entered
 * by the user.
 */
$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  try {
    if (!client) {
      client = AgoraRTC.createClient({
        mode: "rtc",
        codec: 'vp9'
      });
    }
 
    await join();
    if (options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appId}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
});

/*
 * Called when a user clicks Leave in order to exit a channel.
 */
$("#leave").click(function (e) {
  leave();
});
$('#agora-collapse').on('show.bs.collapse	', function () {
  initDevices();
});
$(".cam-list").delegate("a", "click", function (e) {
  switchCamera(this.text);
});
$(".mic-list").delegate("a", "click", function (e) {
  switchMicrophone(this.text);
});

/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {
  // Add an event listener to play remote tracks when remote user publishes.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  // Join the channel.
  options.uid = await client.join(options.appId, options.channel, options.token || null, options.uid || null);
  if (!localTracks.audioTrack) {
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard"
    });
  }
  if (!localTracks.videoTrack) {
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: curVideoProfile.value
    });
  }

  // Play the local video track to the local browser and update the UI with the user ID.
  localTracks.videoTrack.play("local-player");
  $("#local-player-name").text(`localVideo(${options.uid})`);
  $("#joined-setup").css("display", "flex");

  // Publish the local video and audio tracks to the channel.
  await client.publish(Object.values(localTracks));
  console.log("publish success");
  sendDataToMixPanel()
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // Remove remote users and player views.
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();
  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#joined-setup").css("display", "none");
  console.log("client leaves channel success");
}

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === "video") {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
function handleUserUnpublished(user, mediaType) {
  if (mediaType === "video") {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
  }
}

function sendDataToMixPanel (){
  setInterval(() => {

    let localAudioStats = client.getLocalAudioStats();
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
    let localVideoStats = client.getLocalVideoStats();
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
    let remoteAudioStats = client.getLocalVideoStats();
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
    let remoteVideoStats = client.getRemoteVideoStats();
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
    sendEvent('HOST_AV_STATS', {...client.getRTCStats(), user: options.uid, netowrk: client.getRemoteNetworkQuality()});
    // sendEvent('remote video stats', remoteVideoStats);
    // sendEvent('remote audio stats', remoteAudioStats);
    client.on("exception", function(evt) {
      sendEvent('EXCEPTION', {code: evt.code, msg: evt.msg, uid: evt.uid})
      // console.log(evt.code, evt.msg, evt.uid);
    })
  }, 5000);
}

function getCodec (){
  var radios = document.getElementsByName("radios");
  var value;
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      value = radios[i].value;
    }
  }
  return value;
}