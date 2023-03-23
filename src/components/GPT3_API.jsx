import {Configuration, OpenAIApi} from "openai";


const generateAnswer = async (prompt_input) => {
    const configuration = new Configuration({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    const prompt = "Please summarize the diary entry into a short paragraph. ENTRY:" + prompt_input + "\nSUMMARY:"

    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.5,
        max_tokens: 500,
        top_p: 1,
        n: 1,
        stop: ["\n"],
    });
    console.log(prompt_input);
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
}

export default generateAnswer;