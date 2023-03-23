import axios from 'axios';

async function WhisperTranscription(file) {
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'de');
    const config = {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await axios.post(url, formData, config);
    console.log(response.data);
    return response.data.text;
}

export default WhisperTranscription