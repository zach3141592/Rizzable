import React, { useState } from 'react';
import { Heart, Sparkles, MessageCircle, Target } from 'lucide-react';

interface UserPreferences {
  name: string;
  genderIdentity: string;
  sexualOrientation: string;
}

interface LandingPageProps {
  onStart: (preferences: UserPreferences) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    genderIdentity: '',
    sexualOrientation: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const genderOptions = [
    'Woman',
    'Man', 
    'Non-binary',
    'Genderfluid',
    'Agender',
    'Prefer not to say',
    'Other'
  ];

  const orientationOptions = [
    'Straight',
    'Gay',
    'Lesbian',
    'Bisexual',
    'Pansexual',
    'Asexual',
    'Queer',
    'Prefer not to say',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!preferences.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (preferences.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!preferences.genderIdentity) {
      newErrors.genderIdentity = 'Please select your gender identity';
    }

    if (!preferences.sexualOrientation) {
      newErrors.sexualOrientation = 'Please select your sexual orientation';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onStart(preferences);
    }
  };

  const updatePreferences = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Header */}
        <div className="landing-header">
          <div className="landing-title">
            <h1 className="app-title">Rizzable</h1>
          </div>
          <p className="landing-subtitle">
            The AI dating simulator that helps you get more huzz
          </p>
        </div>

        {/* Game Instructions */}
        <div className="instructions-section">
          <h2 className="section-title">
            <Target className="section-icon" />
            How to Play
          </h2>
          <div className="instructions-list">
            <div className="instruction-item">
              <MessageCircle className="instruction-icon green" />
              <p><strong>Chat with AI personas</strong> - Each match has their own personality, interests, and conversation style</p>
            </div>
            <div className="instruction-item">
              <Heart className="instruction-icon pink" />
              <p><strong>Build interest gradually</strong> - Start conversations naturally and let chemistry develop over time</p>
            </div>
            <div className="instruction-item">
              <Sparkles className="instruction-icon purple" />
              <p><strong>Your goal</strong> - Convince them to go on a date through genuine conversation and rizzabilities</p>
            </div>
          </div>
          <div className="pro-tip">
            <p><strong>Pro tip:</strong> Be authentic and ask thoughtful questions. Authenticity beats tryna be nonchalant.</p>
          </div>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSubmit} className="preferences-form">
          <h2 className="section-title">Your Preferences</h2>
          
          {/* Name */}
          <div className="form-group">
            <label className="form-label">What's your name?</label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) => updatePreferences('name', e.target.value)}
              className="form-input"
              placeholder="Enter your name"
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>



          {/* Gender Identity */}
          <div className="form-group">
            <label className="form-label">Gender identity</label>
            <select
              value={preferences.genderIdentity}
              onChange={(e) => updatePreferences('genderIdentity', e.target.value)}
              className="form-select"
            >
              <option value="">Select your gender identity</option>
              {genderOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.genderIdentity && <p className="error-message">{errors.genderIdentity}</p>}
          </div>

          {/* Sexual Orientation */}
          <div className="form-group">
            <label className="form-label">Sexual orientation</label>
            <select
              value={preferences.sexualOrientation}
              onChange={(e) => updatePreferences('sexualOrientation', e.target.value)}
              className="form-select"
            >
              <option value="">Select your sexual orientation</option>
              {orientationOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.sexualOrientation && <p className="error-message">{errors.sexualOrientation}</p>}
          </div>

          {/* Submit Button */}
          <button type="submit" className="start-button">
            Start Your Rizzable Journey
          </button>
        </form>

        {/* Footer */}
        <div className="landing-footer">
          <p>Ready to test your charm? Let's see if you can rizz your way to a date!</p>
        </div>
      </div>


    </div>
  );
};

export default LandingPage; 