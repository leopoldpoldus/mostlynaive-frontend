import React, {useState, useRef, useEffect} from 'react';
import WhisperTranscription from "./Whisper_API.jsx";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from 'axios';
// import './RecordVoice.css';
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
    const [isLoading, setIsLoading] = useState(false);

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
        } else if (language === 'ch') {
            speechConfig.speechSynthesisVoiceName = 'de-CH-LeniNeural'
        } else {
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
        setIsLoading(true);
        axios.get(url, {params: {text: transcript_new, language: language}}).then(
            (response) => {
                setIsLoading(false);
                speak(response.data.response);
                setAnswer(response.data.response);
            }).catch((error) => {
            setIsLoading(false);
            console.log(error);
        })
    };


    return (
        <div>
            <div className="absolute top-0 left-0 mt-4 ml-4">
                <button className={`bg-red-600 text-white py-2 px-4 rounded-full focus:outline-none ${
                    isRecording ? 'transition duration-200 ease-in-out animate-pulse' : ''
                }`}
                        onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
            </div>


            <div className="absolute top-0 right-0 mt-4 mr-4">
                <select
                    class="block bg-gray-800 border border-gray-600 hover:border-gray-400 text-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:border-gray-400"
                    onChange={(e) => setLanguage(e.target.value)}>
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="ch">Schweizerdeutsch</option>
                </select>
            </div>
            <div className="h-2/3 w-2/3 mx-auto bg-gray-800 rounded overflow-hidden">
                <div className="border-b border-gray-700 py-2 px-4 bg-gray-600">
                    <p className="text-xl font-semibold text-white">Conversation</p>
                </div>
                <div className="h-[200vh] overflow-auto px-4 py-2">
                    <div className="flex flex-col">

                        <p class="mb-2 text-gray-300 text-lg">{transcript ? 'Du: ' + transcript : ''}</p>
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"/>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <p className="text-white">Loading...</p>
                            </div>
                        ) : (
                            <div className="h-80% w-60% mx-auto bg-gray-800 rounded-lg overflow-hidden">
                                {/* Display fetched data here */}
                            </div>
                        )}
                        <p class="mb-2 text-gray-300 text-lg">{answer ? 'Mia: ' + answer : ''}</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default VoiceRecorder;
