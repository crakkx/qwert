import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NpcCreator = ({ onNpcCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    race: '',
    profession: '',
    personality: '',
    voice: '',
    backstory: '',
    creatorId: 'default-user' // In a real app, this would come from authentication
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add the NPC to Firestore
      const docRef = await addDoc(collection(db, 'npcs'), {
        ...formData,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setFormData({
        name: '',
        race: '',
        profession: '',
        personality: '',
        voice: '',
        backstory: '',
        creatorId: 'default-user'
      });

      // Notify parent component
      if (onNpcCreated) {
        onNpcCreated({ id: docRef.id, ...formData });
      }

      alert('NPC created successfully!');
    } catch (error) {
      console.error('Error creating NPC:', error);
      alert('Error creating NPC. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="creator-header">
        <h2>🎭 Create New NPC</h2>
        <p>Bring your character to life with detailed personality and backstory</p>
      </div>
      
      <form onSubmit={handleSubmit} className="creator-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Character Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input"
                required
                placeholder="e.g., Kaelen, Aria, Thorne"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="race">Race</label>
              <input
                type="text"
                id="race"
                name="race"
                value={formData.race}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Wood Elf, Human, Dwarf"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="profession">Profession</label>
            <input
              type="text"
              id="profession"
              name="profession"
              value={formData.profession}
              onChange={handleInputChange}
              className="input"
              placeholder="e.g., Retired Royal Guard, Merchant, Wizard"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Character Details</h3>
          <div className="form-group">
            <label htmlFor="personality">Personality *</label>
            <textarea
              id="personality"
              name="personality"
              value={formData.personality}
              onChange={handleInputChange}
              className="textarea"
              required
              placeholder="Describe the character's personality, traits, quirks, and behavioral patterns..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="voice">Voice & Speech Pattern</label>
            <textarea
              id="voice"
              name="voice"
              value={formData.voice}
              onChange={handleInputChange}
              className="textarea"
              placeholder="How does this character speak? Any unique speech patterns, accents, mannerisms, or catchphrases?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="backstory">Backstory</label>
            <textarea
              id="backstory"
              name="backstory"
              value={formData.backstory}
              onChange={handleInputChange}
              className="textarea"
              placeholder="The character's history, experiences, relationships, and significant events that shaped them..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Creating NPC...
              </>
            ) : (
              <>
                ✨ Create NPC
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NpcCreator; 