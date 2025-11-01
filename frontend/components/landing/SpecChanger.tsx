'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PartData } from '@/lib/landing-types';
import { Mic, Square, Type, Save } from 'lucide-react';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpecChangerProps {
  selectedPart: PartData | null;
}

const SpecChanger: React.FC<SpecChangerProps> = ({ selectedPart }) => {
  const [recommendations, setRecommendations] = useState<Array<{
    partSection: string;
    recommendation: string;
    timestamp: string;
    partName: string;
    source: 'voice' | 'text';
  }>>([]);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Auto-restart if no speech detected (optional)
        // recognition.start();
      } else {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Save final transcript if there's any content
      if (finalTranscriptRef.current.trim()) {
        setTranscriptHistory(prev => [...prev, finalTranscriptRef.current.trim()]);
      }
      finalTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      finalTranscriptRef.current = '';
      setTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      alert('Could not start voice recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const handleSaveTranscript = () => {
    const text = transcript.trim() || finalTranscriptRef.current.trim() || (transcriptHistory.length > 0 ? transcriptHistory[transcriptHistory.length - 1] : '');
    
    if (!text) {
      alert('No transcript to save. Please record something first.');
      return;
    }

    const recommendation = {
      partSection: selectedPart?.name?.toLowerCase() || selectedPart?.partName?.toLowerCase() || 'turret',
      recommendation: text,
      timestamp: new Date().toISOString(),
      partName: selectedPart?.name || selectedPart?.partName || 'Unknown',
      source: 'voice' as const
    };

    setRecommendations(prev => [...prev, recommendation]);
    setTranscript('');
    setTranscriptHistory([]);
    finalTranscriptRef.current = '';

    // Create JSON file with the recommendation
    const data = {
      ...recommendation,
      vehicleId: 'TANK-001',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendation_${recommendation.partSection}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleSaveTextInput = () => {
    const text = textInput.trim();
    
    if (!text) {
      alert('Please enter some text before saving.');
      return;
    }

    const recommendation = {
      partSection: selectedPart?.name?.toLowerCase() || selectedPart?.partName?.toLowerCase() || 'turret',
      recommendation: text,
      timestamp: new Date().toISOString(),
      partName: selectedPart?.name || selectedPart?.partName || 'Unknown',
      source: 'text' as const
    };

    setRecommendations(prev => [...prev, recommendation]);
    setTextInput('');
    setShowTextInput(false);

    // Create JSON file with the recommendation
    const data = {
      ...recommendation,
      vehicleId: 'TANK-001',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendation_${recommendation.partSection}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="h-full w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Spec Changer</h3>
          <p className="text-gray-400 text-sm mb-4">
            Record or type recommendations for {selectedPart?.name || selectedPart?.partName || 'selected part'}
          </p>
        </div>

        {/* Voice Recording Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Start Voice Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>
            )}
            
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Type className="w-5 h-5" />
              {showTextInput ? 'Hide' : 'Type'} Text
            </button>
          </div>

          {/* Live Transcript Display */}
          {isRecording && (
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-red-400">Recording...</span>
              </div>
              <p className="text-gray-300 text-sm min-h-[60px]">
                {transcript || 'Listening...'}
              </p>
            </div>
          )}

          {/* Text Input Section */}
          {showTextInput && (
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Type Your Recommendation</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your recommendation for changes..."
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                rows={4}
              />
              <button
                onClick={handleSaveTextInput}
                disabled={!textInput.trim()}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Text Recommendation
              </button>
            </div>
          )}

          {/* Save Transcript Button (for voice) */}
          {(transcript.trim() || transcriptHistory.length > 0) && !isRecording && (
            <button
              onClick={handleSaveTranscript}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Save Voice Transcript
            </button>
          )}

          {/* Transcript History */}
          {transcriptHistory.length > 0 && !isRecording && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase">Previous Recordings</h4>
              {transcriptHistory.map((text, index) => (
                <div key={index} className="p-2 bg-gray-800/30 border border-gray-700/50 rounded text-xs text-gray-400">
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Recommendations</h4>
            <div className="space-y-2">
              {recommendations.slice().reverse().map((rec, index) => (
                <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-400 capitalize">{rec.partSection}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        rec.source === 'voice' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rec.source === 'voice' ? '🎤 Voice' : '⌨️ Text'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecChanger;

