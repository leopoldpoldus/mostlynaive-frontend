import React, {useState, useRef} from 'react';
import VoiceRecorder from "./RecordVoice.jsx";

function CreateNewEntry({addEntry}) {
    const [transcript, setTranscript] = useState('');
    const [reset, setReset] = useState(false);

    const getTranscript = (transcript_new) => {
        setTranscript(transcript+' '+transcript_new);
    }

    const handleSubmit = event => {
        event.preventDefault();
        addEntry(transcript);
        setReset(!reset);
    }


    return (
        <div>
            <h2>Create New Entry</h2>
            <VoiceRecorder props={{getTranscript, reset}}/>
            <div>{transcript}</div>
            <form onSubmit={handleSubmit}>
                <button type="submit">Submit</button>
            </form>
        </div>

    );

}

export default CreateNewEntry;