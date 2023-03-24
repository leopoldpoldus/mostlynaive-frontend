import React, { useEffect, useState } from "react";
import "eventsource-polyfill";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    let source;

    const connectToStream = (message) => {
      if (source) {
        source.close();
      }
      source = new EventSource(`http://localhost:5000/api/chatbot?text=${encodeURIComponent(message)}`);

      source.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, newMessage.content]);
      };

      source.onerror = (error) => {
        console.error("Error occurred in the event source:", error);
        source.close();
      };
    };

    return () => {
      if (source) {
        source.close();
      }
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputText.trim()) {
      setMessages((prevMessages) => [...prevMessages, inputText]);
      setInputText("");
    }
  };

  return (
    <div>
      <h2>Messages:</h2>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatComponent;