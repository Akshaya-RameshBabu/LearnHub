import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import baseUrl from '../api/utils';
import { marked } from 'marked';
const Chatpanel = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {text, sender}
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const [copied, setCopied] = useState(false);

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // hide after 1.5s
    });
  };

  const handleSend = async () => {
    if (input.trim() === '' || loading) return;
    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamedText('');
    try {
      // Get token from localStorage or context (adjust as needed)
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${baseUrl}/user/chat`,
        {
            headers: { Authorization: token },
          params: { prompt: userMsg.text },
          responseType: 'stream',
        }
      );
      // For browsers, we need to use response.data as a ReadableStream
      const reader = response.data.getReader ? response.data.getReader() : null;
      let aiText = '';
      if (reader) {
        // If browser supports ReadableStream (Fetch API)
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value);
            aiText += chunk;
            setStreamedText(aiText);
          }
        }
      } else {
        // Fallback: Axios in browser doesn't support streaming, so just use response.data
        aiText = response.data;
        setStreamedText(aiText);
      }
      setMessages(prev => [...prev, { text: aiText, sender: 'ai' }]);
      setStreamedText('');
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Error: Could not get AI response.', sender: 'ai' }]);
      setStreamedText('');
    } finally {
      setLoading(false);
    }
  };
const handleInputKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // prevent newline
    handleSend();
  }
};


  // Helper to render markdown as HTML
  const renderMarkdown = (text) => {
    return { __html: marked.parse(text || '') };
  };

  return (
    <div className="card chatbot-panel">
      <div className="chatbot-header">
        <span>Ask AI</span>
        <button className="chatbot-close-btn" onClick={onClose} title="Close">×</button>
      </div>
      <div className="chatbot-messages">
        {messages.length === 0 && !streamedText && !loading && (
          <div className="chatbot-empty-msg">Hi there! Ask me anything to get started...</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.sender === 'user'
                ? 'chatbot-msg-row chatbot-msg-row-user'
                : 'chatbot-msg-row chatbot-msg-row-ai'
            }
          >
            {msg.sender === 'ai' ? (
              <>
                <span
                  className="chatbot-msg-bubble chatbot-msg-bubble-ai"
                  dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                />
                <div style={{ textAlign: 'right', marginTop: '0.25em', position: 'relative', display: 'inline-block' }}>
      <i
        className="fa-solid fa-copy text-muted"
        title="Copy response"
        style={{ cursor: 'pointer' }}
        onClick={()=>{handleCopy(msg.text)}}
      ></i>

      {copied && (
        <span
          style={{
            position: 'absolute',
            top: '-1.5em',
            right: 0,
            background: '#4caf50',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          Copied...!
        </span>
      )}
    </div>
              </>
            ) : (
              <span className="chatbot-msg-bubble chatbot-msg-bubble-user">
                {msg.text}
              </span>
            )}
          </div>
        ))}
        {/* Streaming AI message or loading dots */}
        {loading && (
          <div className="chatbot-msg-row chatbot-msg-row-ai">
            <span className="chatbot-msg-bubble chatbot-msg-bubble-ai chatbot-msg-bubble-loading">
              <span dangerouslySetInnerHTML={renderMarkdown(streamedText)} />
              <span className="dots big-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            </span>
            
          </div>
        )}
        
        <div ref={messagesEndRef} /> 
       
      </div>
      <div className="chatbot-input-area-bubble">
        <div className="chatbot-input-bubble">
          <textarea
            className="chatbot-input"
            ref={textareaRef}
            rows={1}
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
          />
          <button
            className="chatbot-send-btn-icon"
            onClick={handleSend}
            title="Send"
            disabled={loading || input.trim() === ''}
          >
       <i className="fa-solid fa-paper-plane gradient-icon"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatpanel;
