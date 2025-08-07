import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import aiService from '../services/aiService';
import ttsService from '../services/ttsService';

const Arena = () => {
  const [npcs, setNpcs] = useState([]);
  const [selectedNpc1, setSelectedNpc1] = useState(null);
  const [selectedNpc2, setSelectedNpc2] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationTopic, setConversationTopic] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load all NPCs from Firestore
  useEffect(() => {
    const loadNpcs = async () => {
      try {
        const npcsCollection = collection(db, 'npcs');
        const npcsSnapshot = await getDocs(npcsCollection);
        const npcsList = npcsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNpcs(npcsList);
      } catch (error) {
        console.error('Error loading NPCs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNpcs();
  }, []);

  const startConversation = async () => {
    if (!selectedNpc1 || !selectedNpc2 || !conversationTopic.trim()) {
      alert('Please select two NPCs and enter a conversation topic.');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate opening line from NPC1
      const openingPrompt = `You are ${selectedNpc1.name}, a ${selectedNpc1.race} ${selectedNpc1.profession}. You are having a conversation with ${selectedNpc2.name} about: "${conversationTopic}". Start the conversation with an opening line. Keep it natural and in character.`;
      
      const openingResponse = await aiService.generateResponse(openingPrompt);
      
      const firstMessage = {
        speaker: selectedNpc1.name,
        content: openingResponse,
        timestamp: new Date().toISOString()
      };

      setConversation([firstMessage]);

      // Auto-speak if TTS is enabled
      if (ttsEnabled) {
        speakMessage(openingResponse, selectedNpc1);
      }

    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const continueConversation = async () => {
    if (conversation.length === 0) {
      alert('Please start a conversation first.');
      return;
    }

    setIsGenerating(true);
    try {
      const lastSpeaker = conversation[conversation.length - 1].speaker;
      const nextSpeaker = lastSpeaker === selectedNpc1.name ? selectedNpc2 : selectedNpc1;
      const otherNpc = lastSpeaker === selectedNpc1.name ? selectedNpc1 : selectedNpc2;

      const conversationHistory = conversation.map(msg => `${msg.speaker}: ${msg.content}`).join('\n');
      
      const responsePrompt = `You are ${nextSpeaker.name}, a ${nextSpeaker.race} ${nextSpeaker.profession}. You are having a conversation with ${otherNpc.name} about: "${conversationTopic}". 

Previous conversation:
${conversationHistory}

Respond as ${nextSpeaker.name} to continue the conversation. Keep it natural, in character, and engaging.`;

      const response = await aiService.generateResponse(responsePrompt);
      
      const newMessage = {
        speaker: nextSpeaker.name,
        content: response,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, newMessage]);

      // Auto-speak if TTS is enabled
      if (ttsEnabled) {
        speakMessage(response, nextSpeaker);
      }

    } catch (error) {
      console.error('Error continuing conversation:', error);
      alert('Failed to continue conversation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setConversationTopic('');
  };

  const speakMessage = async (text, npc) => {
    if (!ttsEnabled || !ttsService.isAvailable()) return;

    try {
      setIsSpeaking(true);
      const { voiceId, settings } = ttsService.getVoiceForNpc(npc);
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

  if (isLoading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading NPCs...</span>
        </div>
      </div>
    );
  }

  if (npcs.length === 0) {
    return (
      <div className="card">
        <div className="no-npcs">
          <h3>No NPCs Available</h3>
          <p>Please create some NPCs first to use the Arena feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-section">
      <div className="arena-header">
        <div className="arena-header-top">
          <h2>🏟️ NPC Arena</h2>
          <div className="arena-controls">
            <button
              className={`btn tts-toggle-btn ${ttsEnabled ? 'active' : ''}`}
              onClick={toggleTTS}
              title={ttsEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
            >
              {ttsEnabled ? '🔊 TTS ON' : '🔇 TTS OFF'}
            </button>
          </div>
        </div>
        <p>Watch two NPCs have conversations with each other!</p>
      </div>

      <div className="arena-setup">
        <div className="npc-selection">
          <div className="npc-selector">
            <h3>NPC 1</h3>
            <select 
              value={selectedNpc1?.id || ''} 
              onChange={(e) => {
                const npc = npcs.find(n => n.id === e.target.value);
                setSelectedNpc1(npc || null);
              }}
              className="input"
            >
              <option value="">Select NPC 1</option>
              {npcs.map(npc => (
                <option key={npc.id} value={npc.id}>
                  {npc.name} ({npc.race} {npc.profession})
                </option>
              ))}
            </select>
            {selectedNpc1 && (
              <div className="npc-preview">
                <strong>{selectedNpc1.name}</strong>
                <p>{selectedNpc1.race} {selectedNpc1.profession}</p>
                <small>{selectedNpc1.personality}</small>
              </div>
            )}
          </div>

          <div className="arena-vs">VS</div>

          <div className="npc-selector">
            <h3>NPC 2</h3>
            <select 
              value={selectedNpc2?.id || ''} 
              onChange={(e) => {
                const npc = npcs.find(n => n.id === e.target.value);
                setSelectedNpc2(npc || null);
              }}
              className="input"
            >
              <option value="">Select NPC 2</option>
              {npcs.map(npc => (
                <option key={npc.id} value={npc.id}>
                  {npc.name} ({npc.race} {npc.profession})
                </option>
              ))}
            </select>
            {selectedNpc2 && (
              <div className="npc-preview">
                <strong>{selectedNpc2.name}</strong>
                <p>{selectedNpc2.race} {selectedNpc2.profession}</p>
                <small>{selectedNpc2.personality}</small>
              </div>
            )}
          </div>
        </div>

        <div className="conversation-topic">
          <h3>Conversation Topic</h3>
          <input
            type="text"
            value={conversationTopic}
            onChange={(e) => setConversationTopic(e.target.value)}
            placeholder="Enter a topic for the NPCs to discuss..."
            className="input"
          />
        </div>

        <div className="arena-controls">
          <button 
            className="btn start-btn" 
            onClick={startConversation}
            disabled={isGenerating || !selectedNpc1 || !selectedNpc2 || !conversationTopic.trim()}
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                Starting...
              </>
            ) : (
              '🎬 Start Conversation'
            )}
          </button>
          
          <button 
            className="btn continue-btn" 
            onClick={continueConversation}
            disabled={isGenerating || conversation.length === 0}
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                Generating...
              </>
            ) : (
              '➡️ Continue'
            )}
          </button>
          
          <button 
            className="btn clear-btn" 
            onClick={clearConversation}
            disabled={isGenerating}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {conversation.length > 0 && (
        <div className="arena-conversation">
          <h3>Conversation</h3>
          <div className="conversation-container">
            {conversation.map((message, index) => {
              const speakerNpc = message.speaker === selectedNpc1?.name ? selectedNpc1 : selectedNpc2;
              return (
                <div key={index} className={`conversation-message ${message.speaker === selectedNpc1?.name ? 'npc1' : 'npc2'}`}>
                  <div className="message-header">
                    <strong>{message.speaker}</strong>
                    <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                  {ttsEnabled && (
                    <div className="message-actions">
                      <button 
                        className="btn speak-btn" 
                        onClick={() => speakMessage(message.content, speakerNpc)}
                        disabled={isSpeaking}
                        title="Speak this message"
                      >
                        {isSpeaking ? '🔊 Speaking...' : '🔊 Speak'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {isGenerating && (
              <div className="generating-indicator">
                <div className="loading-spinner"></div>
                <span>Generating next response...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Arena;
