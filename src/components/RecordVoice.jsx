import React, {useState, useRef, useEffect} from 'react';
import WhisperTranscription from "./Whisper_API.jsx";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from 'axios';
import './RecordVoice.css';

const VoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [answer, setAnswer] = useState('');
    const mediaRecorder = useRef(null);
    const recordedChunks = useRef([]);


    const startRecording = async () => {
        if (!navigator.mediaDevices) {
            alert('Your browser does not support audio recording.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder.current = new MediaRecorder(stream, {mimeType: 'audio/webm'});
            recordedChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                saveRecording();
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            alert('Error while starting the recording. Please check your microphone permissions.');
        }
    };

    const resetRecording = () => {
        recordedChunks.current = [];
        setIsRecording(false);
    }


    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    const saveRecording = async () => {
        const audioBuffer = new Blob(recordedChunks.current, {type: 'audio/webm'});
        const transcript_new = await WhisperTranscription(new File([audioBuffer], 'audio.webm', {type: 'audio/webm'}));
        // add to transcript
        setTranscript(transcript_new);
        // // send to parent
        // props.getTranscript(transcript_new);

        // send transcript to backend
        const url = '/api/chatbot';
        const response = await axios.get(url, {params: {text: transcript_new}})
        console.log(response.data);
        const answer = response.data.response;

        // set answer
        setAnswer(answer);

        // speak
        const speechConfig = sdk.SpeechConfig.fromSubscription(import.meta.env.VITE_SPEECH_KEY, import.meta.env.VITE_SPEECH_REGION);
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        speechConfig.speechSynthesisVoiceName = 'de-DE-KlarissaNeural'
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizer.speakTextAsync(answer, (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("synthesis finished.");
                } else {
                    console.error(
                        "Speech synthesis canceled, " +
                        result.errorDetails +
                        "\nDid you set the speech resource key and region values?"
                    );
                }
                synthesizer.close();
            },
            (err) => {
                console.trace("err - " + err);
                synthesizer.close();
            }
        );
    };


    return (
        <div>
            <button className={"record-button"} onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div className={"transcript"}>
                {/*<p>{transcript ? Du: {transcript} : 'Start Recording'}</p>*/}
                <p>{transcript ? 'Du: ' + transcript : ''}</p>
                <p>{answer ? 'Mia: ' + answer : ''}</p>

            </div>
        </div>
    );
};

export default VoiceRecorder;
