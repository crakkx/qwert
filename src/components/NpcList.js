import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const NpcList = ({ selectedNpc, onNpcSelect }) => {
  const [npcs, setNpcs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNpcs();
  }, []);

  const loadNpcs = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'npcs'));
      const npcsList = querySnapshot.docs.map(doc => ({
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

  const handleNpcSelect = (npc) => {
    onNpcSelect(npc);
  };

  if (isLoading) {
    return (
      <div className="card">
        <h2>NPCs</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading NPCs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="npc-list-header">
        <h2>NPCs ({npcs.length})</h2>
        {npcs.length > 0 && (
          <div className="npc-list-stats">
            <span className="stat-item">
              <span className="stat-number">{npcs.length}</span>
              <span className="stat-label">Characters</span>
            </span>
          </div>
        )}
      </div>
      
      {npcs.length === 0 ? (
        <div className="empty-npc-list">
          <div className="empty-npc-icon">🎭</div>
          <p>No NPCs created yet</p>
          <small>Create your first NPC to get started!</small>
        </div>
      ) : (
        <div className="npc-list">
          {npcs.map((npc) => (
            <div
              key={npc.id}
              className={`npc-card ${selectedNpc?.id === npc.id ? 'selected' : ''}`}
              onClick={() => handleNpcSelect(npc)}
            >
              <div className="npc-card-header">
                <div className="npc-name">{npc.name}</div>
                <div className="npc-status">
                  {selectedNpc?.id === npc.id && (
                    <span className="status-indicator">●</span>
                  )}
                </div>
              </div>
              <div className="npc-details">
                {npc.race && <span className="npc-race">🏛️ {npc.race}</span>}
                {npc.profession && <span className="npc-profession">⚔️ {npc.profession}</span>}
              </div>
              {npc.personality && (
                <div className="npc-personality">
                  {npc.personality.length > 100 
                    ? `${npc.personality.substring(0, 100)}...` 
                    : npc.personality}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NpcList; 