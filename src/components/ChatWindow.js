import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import aiService from '../services/aiService';
import ttsService from '../services/ttsService';

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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [conversationPath, setConversationPath] = useState('neutral');
  const [pathHistory, setPathHistory] = useState([]);
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
      const { npcResponse, playerOptions, isImportantMoment } = await aiService.generateNpcResponse(
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

      // Auto-speak NPC response if TTS is enabled
      if (ttsEnabled) {
        handleSpeakMessage(npcResponse);
      }

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
    // Determine the conversation path based on the chosen option
    const pathType = determineConversationPath(option);
    setConversationPath(pathType);
    
    // Record the path choice in history
    setPathHistory(prev => [...prev, {
      choice: option,
      path: pathType,
      timestamp: new Date().toISOString()
    }]);
    
    sendMessage(option);
    setDialogueOptions([]);
  };

  const determineConversationPath = (option) => {
    const optionLower = option.toLowerCase();
    
    // Keywords that indicate different paths
    const diplomaticKeywords = ['please', 'help', 'trust', 'friend', 'peace', 'understand', 'sorry', 'apologize', 'kind', 'gentle'];
    const aggressiveKeywords = ['fight', 'attack', 'kill', 'destroy', 'hate', 'enemy', 'war', 'battle', 'threaten', 'force', 'angry'];
    const neutralKeywords = ['observe', 'watch', 'listen', 'think', 'consider', 'maybe', 'perhaps', 'curious', 'interesting'];
    
    const diplomaticScore = diplomaticKeywords.filter(keyword => optionLower.includes(keyword)).length;
    const aggressiveScore = aggressiveKeywords.filter(keyword => optionLower.includes(keyword)).length;
    const neutralScore = neutralKeywords.filter(keyword => optionLower.includes(keyword)).length;
    
    if (aggressiveScore > diplomaticScore && aggressiveScore > neutralScore) {
      return 'aggressive';
    } else if (diplomaticScore > aggressiveScore && diplomaticScore > neutralScore) {
      return 'diplomatic';
    } else {
      return 'neutral';
    }
  };

  const handleTranslate = async (messageIndex, messageContent) => {
    try {
      const translation = await aiService.translateText(messageContent);
      setTranslatedMessages(prev => ({
        ...prev,
        [messageIndex]: {
          original: messageContent,
          translated: translation
        }
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const handleRevertTranslation = (messageIndex) => {
    setTranslatedMessages(prev => {
      const newState = { ...prev };
      delete newState[messageIndex];
      return newState;
    });
  };

  const handleSpeakMessage = async (text) => {
    if (!ttsEnabled || !ttsService.isAvailable()) return;

    try {
      setIsSpeaking(true);
      const { voiceId, settings } = ttsService.getVoiceForNpc(selectedNpc);
      await ttsService.speak(text, voiceId, settings);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleTTS = () => {
    if (ttsEnabled) {
      ttsService.stopAudio();
    }
    setTtsEnabled(!ttsEnabled);
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
        <div className="chat-header-top">
          <h2>Chat with {selectedNpc.name}</h2>
          <div className="chat-controls">
            <button
              className={`btn tts-toggle-btn ${ttsEnabled ? 'active' : ''}`}
              onClick={toggleTTS}
              title={ttsEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
            >
              {ttsEnabled ? '🔊 TTS ON' : '🔇 TTS OFF'}
            </button>
          </div>
        </div>
        <div className="npc-details">
          <p><strong>Race:</strong> {selectedNpc.race || 'Unknown'}</p>
          <p><strong>Profession:</strong> {selectedNpc.profession || 'Unknown'}</p>
          {conversationPath !== 'neutral' && (
            <div className="conversation-path-indicator">
              <span className="path-indicator-icon">
                {conversationPath === 'diplomatic' ? '🤝' : 
                 conversationPath === 'aggressive' ? '⚔️' : '👁️'}
              </span>
              <span className="path-indicator-text">
                Path: {conversationPath.charAt(0).toUpperCase() + conversationPath.slice(1)}
              </span>
            </div>
          )}
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
          messages.map((message, index) => {
            const isTranslated = translatedMessages[index];
            const displayContent = isTranslated ? isTranslated.translated : message.content;
            
            return (
              <div key={index} className={`message ${message.role === 'Player' ? 'player' : 'npc'}`}>
                <div className="message-content">
                  <strong>{message.role}:</strong>
                  {message.role === 'Player' ? (
                    <span>{displayContent}</span>
                  ) : (
                    <div className="ai-response">
                      {formatAIResponse(displayContent).map((paragraph, pIndex) => (
                        <p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }} />
                      ))}
                    </div>
                  )}
                </div>
                {message.role !== 'Player' && (
                  <div className="message-actions">
                    <button 
                      className="btn speak-btn" 
                      onClick={() => handleSpeakMessage(displayContent)}
                      disabled={isSpeaking}
                      title="Speak this message"
                    >
                      {isSpeaking ? '🔊 Speaking...' : '🔊 Speak'}
                    </button>
                    {isTranslated ? (
                      <button 
                        className="btn revert-btn" 
                        onClick={() => handleRevertTranslation(index)}
                        title="Revert to original text"
                      >
                        🔄 Revert
                      </button>
                    ) : (
                      <button 
                        className="btn translate-btn" 
                        onClick={() => handleTranslate(index, message.content)}
                        title="Translate this message"
                      >
                        🌐 Translate
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>{selectedNpc.name} is thinking...</span>
          </div>
        )}
      </div>

      {dialogueOptions.length > 0 && (
        <div className="dialogue-options important-moment">
          <div className="important-moment-indicator">
            <div className="pulse-dot"></div>
            <h4>🎯 Branching Conversation Path</h4>
            <p>Choose your response to determine the story direction:</p>
          </div>
          <div className="path-options">
            {dialogueOptions.map((option, index) => {
              const pathType = determineConversationPath(option);
              const pathIcon = pathType === 'diplomatic' ? '🤝' : 
                              pathType === 'aggressive' ? '⚔️' : '👁️';
              const pathLabel = pathType === 'diplomatic' ? 'Diplomatic' : 
                               pathType === 'aggressive' ? 'Aggressive' : 'Neutral';
              
              return (
                <button
                  key={index}
                  className={`dialogue-option important-option path-option path-${pathType}`}
                  onClick={() => handleDialogueOption(option)}
                >
                  <div className="option-header">
                    <span className="path-icon">{pathIcon}</span>
                    <span className="path-label">{pathLabel}</span>
                  </div>
                  <div className="option-text">{option}</div>
                </button>
              );
            })}
          </div>
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