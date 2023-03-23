import RecordRTC, {StereoAudioRecorder} from "recordrtc";
import React, {useState, useEffect, useRef} from 'react';

function TranscriptionModule() {
    const [isRecording, setIsRecording] = useState(false);
    const [socket, setSocket] = useState(null);
    const recorder = useRef(null);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('Click start to begin recording!');
    const [texts, setTexts] = useState({});

    useEffect(() => {
        if (!isRecording) {
            setSocket(null);
            return;
        }

        const url = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`;

        setSocket(new WebSocket(url,));
    }, [isRecording]);

    useEffect(() => {
        if (!texts) return;
        let msg = '';
        const keys = Object.keys(texts);
        keys.sort((a, b) => a - b);
        for (const key of keys) {
            if (texts[key]) {
                msg += ` ${texts[key]}`;
            }
        }
        setMessage(msg);
    }, [texts])

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.onmessage = (message) => {
            console.log(message);
            let msg = '';
            const res = JSON.parse(message.data);
            setTexts(prevTexts => {
                const newTexts = {...prevTexts};
                newTexts[res.audio_start] = res.text;
                return newTexts;
            });
        };

        socket.onerror = (event) => {
            console.error(event);
            socket.close();
        }

        socket.onclose = event => {
            console.log(event);
            setSocket(null);
        }

        socket.onopen = () => {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    recorder.current = (new RecordRTC(stream, {
                        type: 'audio',
                        mimeType: 'audio/webm;codecs=pcm',
                        recorderType: StereoAudioRecorder,
                        timeSlice: 250,
                        desiredSampRate: 16000,
                        numberOfAudioChannels: 1,
                        bufferSize: 4096,
                        audioBitsPerSecond: 128000,
                        ondataavailable: (blob) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64data = reader.result;

                                if (socket) {
                                    socket.send(JSON.stringify({audio_data: base64data.split('base64,')[1]}));
                                }
                            };
                            reader.readAsDataURL(blob);
                        },
                    }));
                    recorder.current.startRecording();
                })
                .catch((err) => console.error(err));
        };
    }, [socket]);

    const handleClick = () => {
        setIsRecording(!isRecording); // toggle

        // update title (isRecording is inverted)
        if (!isRecording) {
            setTitle('Click stop to end recording!');
        } else {
            setTitle('Click start to begin recording!');
            if (recorder.current) {
                recorder.current.stopRecording(() => {
                    socket.close();
                    setSocket(null);
                });
            }
        }
    }


    return (
        <div className={"container py-5"}>
            <button className={`btn btn-${isRecording ? 'danger' : 'success'}`} onClick={handleClick}>
                {isRecording ? 'Stop' : 'Start'}
            </button>

            <h1 id='real-time-title'>{title}</h1>
            <p id='message'>Recording: {isRecording ? 'Recording...' : ''}</p>
            <p id='message'>{message}</p>
        </div>
    );
}

export default TranscriptionModule;