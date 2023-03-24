import React, {useState, useRef, useEffect} from 'react';
import WhisperTranscription from "./Whisper_API.jsx";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from 'axios';
import './RecordVoice.css';
import 'eventsource-polyfill'


const VoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [responses, setResponses] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sentences, setSentences] = useState([]);
    const [currentSentence, setCurrentSentence] = useState('');
    const [language, setLanguage] = useState('de');

    const [answer, setAnswer] = useState('');
    const mediaRecorder = useRef(null);
    const recordedChunks = useRef([]);


    // // speak when new response is added
    useEffect(() => {
            // if an entire sentence is received, speak it (each response is a sentence fragment)

            if (responses.length > 0 && !isSpeaking) {
                let long_text = sentences.join(' ');
                console.log(long_text)
                setResponses([]);

                setIsSpeaking(true);
                speak(long_text);

                setIsSpeaking(false);

            }
        }
        , [responses]);


    const connectToChat = (new_transcript) => {

        const url = '/api/chatbot';
        const params = new URLSearchParams({text: new_transcript});
        const eventSourceUrl = `${url}?${params.toString()}`;
        const eventSource = new EventSource(eventSourceUrl);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.content);
            setResponses((prevResponses) => [...prevResponses, data.content]);


        };

        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            eventSource.close();
            // speak(sentences_.join(' '));
        };

        return () => {
            eventSource.close();
        };
    };

    const speak = (text) => {
        // speak
        const speechConfig = sdk.SpeechConfig.fromSubscription('82af840d5ab04281a4c13e6dc721cc28', 'germanywestcentral');
        // no audio output
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        if (language === 'de') {
            speechConfig.speechSynthesisVoiceName = 'de-DE-KlarissaNeural'
        }
        else if (language === 'ch') {
            speechConfig.speechSynthesisVoiceName = 'de-CH-LeniNeural'
        }
        else {
            speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural'
        }
        // speechConfig.speechSynthesisVoiceName = 'de-DE-KlarissaNeural'
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizer.speakTextAsync(text, (result) => {
            // const audioBlob = new Blob(result.audioData, {type: 'audio/wav'});
            // const audio_url = URL.createObjectURL(audioBlob);
            // axios.post('https://api.d-id.com/talks', {
            //     "source_url": "./head.png",
            //     "script": {
            //         "type": "audio",
            //         "audio_url": audio_url
            //     }})


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
    }

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
        const transcript_new = await WhisperTranscription(new File([audioBuffer], 'audio.webm', {type: 'audio/webm'}), language);
        // add to transcript
        setTranscript(transcript_new);
        setAnswer('');



        // send transcript to backend
        const url = '/api/chatbot';
        //
        //
        const response = await axios.get(url, {params: {text: transcript_new, language: language}})
        // console.log(response.data);
        const answer = response.data.response;



        speak(answer)
        console.log(answer)

        // // set answer
        setAnswer(answer);
    };


    return (
        <div>
            <button className={"record-button"} onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <select className={'language-selector'} onChange={(e) => setLanguage(e.target.value)}>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="ch">Schweizerdeutsch</option>
            </select>
            <div className={'transcript'}>
                {/*<p>{transcript ? Du: {transcript} : 'Start Recording'}</p>*/}
                <p>{transcript ? 'Du: ' + transcript : ''}</p>
                <p>{answer ? 'Mia: ' + answer : ''}</p>

            </div>
        </div>
    );
};

export default VoiceRecorder;
