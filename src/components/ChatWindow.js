import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import aiService from '../services/aiService';

// Utility function to format AI responses
const formatAIResponse = (content) => {
  if (!content) return content;
  
  // Split content into paragraphs
  const paragraphs = content.split('\n').filter(para => para.trim());
  
  // Process each paragraph for better formatting
  const formattedParagraphs = paragraphs.map(para => {
    let formatted = para.trim();
    
    // Handle emphasis (text between *asterisks*)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle strong emphasis (text between **double asterisks**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle code snippets (text between `backticks`)
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Handle line breaks within paragraphs
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  });
  
  return formattedParagraphs;
};

const ChatWindow = ({ selectedNpc }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [dialogueOptions, setDialogueOptions] = useState([]);
  const chatContainerRef = useRef(null);

  // Generate a conversation ID if none exists
  useEffect(() => {
    if (selectedNpc && !conversationId) {
      const newConversationId = `conversation_${Date.now()}`;
      setConversationId(newConversationId);
    }
  }, [selectedNpc, conversationId]);

  // Load conversation history
  useEffect(() => {
    if (selectedNpc && conversationId) {
      loadConversationHistory();
    }
  }, [selectedNpc, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const conversationRef = doc(db, 'npcs', selectedNpc.id, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        setMessages(data.history || []);
      } else {
        // Create new conversation document
        await setDoc(conversationRef, {
          startTime: new Date().toISOString(),
          history: []
        });
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedNpc || !conversationId) return;

    const playerMessage = {
      role: 'Player',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    // Add player message to UI immediately
    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the AI service to generate NPC response
      const { npcResponse, playerOptions } = await aiService.generateNpcResponse(
        selectedNpc,
        messages,
        messageText
      );

      const npcMessage = {
        role: selectedNpc.name,
        content: npcResponse,
        timestamp: new Date().toISOString()
      };

      // Add NPC response to messages
      setMessages(prev => [...prev, npcMessage]);
      setDialogueOptions(playerOptions || []);

      // Update conversation in Firestore
      const conversationRef = doc(db, 'npcs', selectedNpc.id, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        history: arrayUnion(playerMessage, npcMessage)
      });

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        role: selectedNpc.name,
        content: 'I apologize, but I am having trouble responding right now. Please check your API key configuration.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleDialogueOption = (option) => {
    sendMessage(option);
    setDialogueOptions([]);
  };

  const handleTranslate = async (messageContent) => {
    try {
      const translation = await aiService.translateText(messageContent);
      alert(`Translation: ${translation}`);
    } catch (error) {
      alert('Translation failed. Please check your API key configuration.');
    }
  };

  if (!selectedNpc) {
    return (
      <div className="card">
        <h2>Chat Window</h2>
        <p>Please select an NPC to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="chat-header">
        <h2>Chat with {selectedNpc.name}</h2>
        <div className="npc-details">
          <p><strong>Race:</strong> {selectedNpc.race || 'Unknown'}</p>
          <p><strong>Profession:</strong> {selectedNpc.profession || 'Unknown'}</p>
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <p>Start a conversation with {selectedNpc.name}...</p>
            <small>Type a message below to begin chatting!</small>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.role === 'Player' ? 'player' : 'npc'}`}>
              <div className="message-content">
                <strong>{message.role}:</strong>
                {message.role === 'Player' ? (
                  <span>{message.content}</span>
                ) : (
                  <div className="ai-response">
                    {formatAIResponse(message.content).map((paragraph, pIndex) => (
                      <p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                )}
              </div>
              {message.role !== 'Player' && (
                <button 
                  className="btn translate-btn" 
                  onClick={() => handleTranslate(message.content)}
                  title="Translate this message"
                >
                  🌐 Translate
                </button>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>{selectedNpc.name} is thinking...</span>
          </div>
        )}
      </div>

      {dialogueOptions.length > 0 && (
        <div className="dialogue-options">
          <h4>💡 Suggested responses:</h4>
          {dialogueOptions.map((option, index) => (
            <button
              key={index}
              className="dialogue-option"
              onClick={() => handleDialogueOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Message ${selectedNpc.name}...`}
          className="input message-input"
          disabled={isLoading}
        />
        <button type="submit" className="btn" disabled={isLoading || !inputMessage.trim()}>
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              Sending...
            </>
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 