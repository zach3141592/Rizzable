import React, { useState } from 'react';
import { Heart, Sparkles, MessageCircle, Target } from 'lucide-react';

interface UserPreferences {
  name: string;
  ageRange: {
    min: number;
    max: number;
  };
  genderIdentity: string;
  sexualOrientation: string;
}

interface LandingPageProps {
  onStart: (preferences: UserPreferences) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    ageRange: { min: 20, max: 30 },
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

    if (preferences.ageRange.min < 18 || preferences.ageRange.max > 99) {
      newErrors.ageRange = 'Age range must be between 18-99';
    }

    if (preferences.ageRange.min >= preferences.ageRange.max) {
      newErrors.ageRange = 'Minimum age must be less than maximum age';
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
            <Heart className="title-icon heart" />
            <h1 className="app-title">Rizzable</h1>
            <Sparkles className="title-icon sparkle" />
          </div>
          <p className="landing-subtitle">
            The AI dating simulator where your charm is the only currency
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
              <p><strong>Your goal</strong> - Convince them to go on a date through genuine conversation and charm</p>
            </div>
          </div>
          <div className="pro-tip">
            <p>💡 <strong>Pro tip:</strong> Be authentic, ask thoughtful questions, and let the AI lead the conversation naturally. Authenticity beats pickup lines!</p>
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

          {/* Age Range */}
          <div className="form-group">
            <label className="form-label">
              Preferred age range: {preferences.ageRange.min} - {preferences.ageRange.max}
            </label>
            <div className="age-range-grid">
              <div className="age-range-item">
                <label className="range-label">Minimum age</label>
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.ageRange.min}
                  onChange={(e) => updatePreferences('ageRange', {
                    ...preferences.ageRange,
                    min: parseInt(e.target.value)
                  })}
                  className="range-slider slider"
                />
                <div className="range-value">{preferences.ageRange.min}</div>
              </div>
              <div className="age-range-item">
                <label className="range-label">Maximum age</label>
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.ageRange.max}
                  onChange={(e) => updatePreferences('ageRange', {
                    ...preferences.ageRange,
                    max: parseInt(e.target.value)
                  })}
                  className="range-slider slider"
                />
                <div className="range-value">{preferences.ageRange.max}</div>
              </div>
            </div>
            {errors.ageRange && <p className="error-message">{errors.ageRange}</p>}
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
            Start Your Rizzable Journey ✨
          </button>
        </form>

        {/* Footer */}
        <div className="landing-footer">
          <p>Ready to test your charm? Let's see if you can rizz your way to a date! 💫</p>
        </div>
      </div>


    </div>
  );
};

export default LandingPage; 