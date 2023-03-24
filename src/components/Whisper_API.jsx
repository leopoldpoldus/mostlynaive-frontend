import axios from 'axios';

const key_1 = 'sk-hFGCiyYdi0lcM6GYBq1dT'
const key_2 = '3BlbkFJKBYU1LUiD0F6uL8ysDpr'

async function WhisperTranscription(file, language) {
    if (language === 'ch' || language === 'de') {
        language = 'de'
    } else
    if (language === 'en') {
        language = 'en'
    }


    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    const config = {
      headers: {
        Authorization: `Bearer ${key_1}${key_2}`,
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await axios.post(url, formData, config);
    console.log(response.data);
    return response.data.text;
}

export default WhisperTranscription