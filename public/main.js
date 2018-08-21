const cameraInputSelect1 = document.getElementById('cameraInput')
const localVideo = document.getElementById('local');
const remoteVideo = document.getElementById('remote');
const startButton = document.getElementById('start')
const callButton = document.getElementById('call')
const sendButton = document.getElementById('send')

const localConnection = new RTCPeerConnection({
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302'
            ]
        }
    ]
});

const socket = io();

(async function start() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
        .filter((device) => device.kind === 'videoinput');
    for (const device of videoDevices) {
        const opt = document.createElement('option');
        opt.value = device.deviceId;
        opt.innerHTML = device.label;
        cameraInputSelect.appendChild(opt);
    }           
    
})()

function sendTo(socket, type, payload) {
    socket.emit('data', {
        type,
        payload
    })
}

callButton.onclick = () => {
    localConnection.createOffer().then((offer) => {
        localConnection.setLocalDescription(offer);
        sendTo(socket, 'offer', offer);
    })
}

socket.on('data', (data) => {
    const type = data.type;
    const payload = data.payload;

    switch (type) {
        case 'candidate':
            localConnection.addIceCandidate(new RTCIceCandidate(payload))
            break;
        case 'offer':
            localConnection.setRemoteDescription(payload);
            localConnection.createAnswer().then((offer) => {
                localConnection.setLocalDescription(offer)
                sendTo(socket, 'answer', offer);
            });
            break;
        case 'answer':
            localConnection.setRemoteDescription(payload);
            break;
    }
});

startButton.onclick = async () => {
    const cameraInputDeviceId = cameraInputSelect.options[cameraInputSelect.selectedIndex].value

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: {
                exact: cameraInputDeviceId
            }
        }
    });

    localVideo.srcObject = stream;
    
    localConnection.addStream(stream);
    
    localConnection.onaddstream = (e) => {
        remoteVideo.srcObject = e.stream; 
    }
    
    localConnection.onicecandidate = (e) => {
        if (e.candidate) {
            sendTo(socket, 'candidate', e.candidate)
        }
    }
}