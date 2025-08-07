import React, { useState } from 'react';
import NpcCreator from './components/NpcCreator';
import NpcList from './components/NpcList';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'create'

  const handleNpcCreated = (newNpc) => {
    // Refresh the NPC list by triggering a re-render
    setSelectedNpc(null);
    setActiveTab('chat');
  };

  const handleNpcSelect = (npc) => {
    setSelectedNpc(npc);
    setActiveTab('chat');
  };

  return (
    <div className="App">
      <div className="container">
        <header className="app-header">
          <h1>AI NPC Generator</h1>
          <p>Create and chat with AI-powered characters</p>
        </header>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat with NPCs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create New NPC
          </button>
        </div>

        {activeTab === 'chat' && (
          <div className="chat-section">
            <div className="sidebar">
              <NpcList 
                selectedNpc={selectedNpc} 
                onNpcSelect={handleNpcSelect} 
              />
            </div>
            <div className="main-content">
              <ChatWindow selectedNpc={selectedNpc} />
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-section">
            <NpcCreator onNpcCreated={handleNpcCreated} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 