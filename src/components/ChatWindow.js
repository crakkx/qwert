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
  const [relationshipStatus, setRelationshipStatus] = useState('neutral'); // tracks overall relationship
  const [pathConsequences, setPathConsequences] = useState({}); // tracks consequences of choices
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
        setPathHistory(data.pathHistory || []);
        setRelationshipStatus(data.relationshipStatus || 'neutral');
        setPathConsequences(data.pathConsequences || {});
        setConversationPath(data.currentPath || 'neutral');
      } else {
        // Create new conversation document
        await setDoc(conversationRef, {
          startTime: new Date().toISOString(),
          history: [],
          pathHistory: [],
          relationshipStatus: 'neutral',
          pathConsequences: {},
          currentPath: 'neutral'
        });
        setMessages([]);
        setPathHistory([]);
        setRelationshipStatus('neutral');
        setPathConsequences({});
        setConversationPath('neutral');
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
      // Use the AI service to generate NPC response with path history
      const { npcResponse, playerOptions, isImportantMoment } = await aiService.generateNpcResponse(
        selectedNpc,
        messages,
        messageText,
        pathHistory
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
        history: arrayUnion(playerMessage, npcMessage),
        pathHistory: pathHistory,
        relationshipStatus: relationshipStatus,
        pathConsequences: pathConsequences,
        currentPath: conversationPath,
        lastUpdated: new Date().toISOString()
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
    
    // Calculate relationship impact
    const relationshipImpact = calculateRelationshipImpact(pathType, relationshipStatus);
    const newRelationshipStatus = updateRelationshipStatus(relationshipStatus, relationshipImpact);
    setRelationshipStatus(newRelationshipStatus);
    
    // Record the path choice in history with consequences
    const pathChoice = {
      choice: option,
      path: pathType,
      timestamp: new Date().toISOString(),
      previousRelationship: relationshipStatus,
      newRelationship: newRelationshipStatus,
      impact: relationshipImpact
    };
    
    setPathHistory(prev => [...prev, pathChoice]);
    
    // Update path consequences
    setPathConsequences(prev => ({
      ...prev,
      [pathType]: (prev[pathType] || 0) + 1,
      lastChoice: pathChoice
    }));
    
    sendMessage(option);
    setDialogueOptions([]);
  };

  const determineConversationPath = (option) => {
    const optionLower = option.toLowerCase();
    
    // Keywords that indicate different paths
    const diplomaticKeywords = ['please', 'help', 'trust', 'friend', 'peace', 'understand', 'sorry', 'apologize', 'kind', 'gentle', 'support', 'care', 'respect', 'appreciate'];
    const aggressiveKeywords = ['fight', 'attack', 'kill', 'destroy', 'hate', 'enemy', 'war', 'battle', 'threaten', 'force', 'angry', 'challenge', 'confront', 'demand'];
    const neutralKeywords = ['observe', 'watch', 'listen', 'think', 'consider', 'maybe', 'perhaps', 'curious', 'interesting', 'tell me', 'explain', 'why', 'how'];
    
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

  const calculateRelationshipImpact = (pathType, currentStatus) => {
    // Define relationship impact based on path choice
    const impacts = {
      diplomatic: { friendly: 2, neutral: 1, hostile: 3, trusted: 1, suspicious: 4 },
      aggressive: { friendly: -3, neutral: -2, hostile: 1, trusted: -4, suspicious: -1 },
      neutral: { friendly: 0, neutral: 0, hostile: 0, trusted: 0, suspicious: 0 }
    };
    
    return impacts[pathType][currentStatus] || 0;
  };

  const updateRelationshipStatus = (currentStatus, impact) => {
    const statusLevels = ['hostile', 'suspicious', 'neutral', 'friendly', 'trusted'];
    const currentIndex = statusLevels.indexOf(currentStatus);
    
    let newIndex = currentIndex + Math.sign(impact) * Math.min(Math.abs(impact), 2);
    newIndex = Math.max(0, Math.min(statusLevels.length - 1, newIndex));
    
    return statusLevels[newIndex];
  };

  const getRelationshipColor = (status) => {
    const colors = {
      hostile: '#ff4444',
      suspicious: '#ff8844',
      neutral: '#888888',
      friendly: '#44aa44',
      trusted: '#44ff44'
    };
    return colors[status] || '#888888';
  };

  const getRelationshipIcon = (status) => {
    const icons = {
      hostile: '😠',
      suspicious: '🤨',
      neutral: '😐',
      friendly: '😊',
      trusted: '🤝'
    };
    return icons[status] || '😐';
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
          <div className="npc-basic-info">
            <p><strong>Race:</strong> {selectedNpc.race || 'Unknown'}</p>
            <p><strong>Profession:</strong> {selectedNpc.profession || 'Unknown'}</p>
          </div>
          
          <div className="relationship-status">
            <span className="relationship-icon">{getRelationshipIcon(relationshipStatus)}</span>
            <span 
              className="relationship-text"
              style={{ color: getRelationshipColor(relationshipStatus) }}
            >
              Relationship: {relationshipStatus.charAt(0).toUpperCase() + relationshipStatus.slice(1)}
            </span>
          </div>

          {conversationPath !== 'neutral' && (
            <div className="conversation-path-indicator">
              <span className="path-indicator-icon">
                {conversationPath === 'diplomatic' ? '🤝' : 
                 conversationPath === 'aggressive' ? '⚔️' : '👁️'}
              </span>
              <span className="path-indicator-text">
                Current Path: {conversationPath.charAt(0).toUpperCase() + conversationPath.slice(1)}
              </span>
            </div>
          )}

          {pathHistory.length > 0 && (
            <div className="path-history-summary">
              <details className="path-history-details">
                <summary className="path-history-summary-text">
                  📜 Path History ({pathHistory.length} choices)
                </summary>
                <div className="path-history-content">
                  {pathHistory.slice(-3).map((path, index) => (
                    <div key={index} className={`path-history-item path-${path.path}`}>
                      <span className="path-choice-icon">
                        {path.path === 'diplomatic' ? '🤝' : 
                         path.path === 'aggressive' ? '⚔️' : '👁️'}
                      </span>
                      <span className="path-choice-text">{path.choice}</span>
                      {path.impact !== 0 && (
                        <span className={`relationship-change ${path.impact > 0 ? 'positive' : 'negative'}`}>
                          {path.impact > 0 ? '+' : ''}{path.impact}
                        </span>
                      )}
                    </div>
                  ))}
                  {pathHistory.length > 3 && (
                    <div className="path-history-more">
                      ... and {pathHistory.length - 3} more choices
                    </div>
                  )}
                </div>
              </details>
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