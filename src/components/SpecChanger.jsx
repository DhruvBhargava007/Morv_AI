import React, { useState, useRef } from 'react';
import OpenAI from 'openai';

const SpecChanger = ({ selectedPart }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: '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',
    dangerouslyAllowBrowser: true,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Convert to a format supported by Whisper API (webm is supported)
      const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      });

      const transcribedText = transcriptionResponse.text;
      setTranscription(transcribedText);
      
      // Extract recommendations from transcription
      await processRecommendation(transcribedText);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (error.message?.includes('CORS') || error.message?.includes('Network')) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('API key')) {
        alert('API key error. Please check the configuration.');
      } else {
        alert(`Error transcribing audio: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const processRecommendation = async (text) => {
    try {
      // Determine which part section this refers to
      const partSection = selectedPart?.partName?.toLowerCase() || 'turret';
      
      // Create recommendation object
      const recommendation = {
        partSection: partSection,
        recommendation: text,
        timestamp: new Date().toISOString(),
        partName: selectedPart?.partName || 'Unknown',
      };

      // Add to recommendations list
      setRecommendations(prev => [...prev, recommendation]);

      // Save to file
      await saveRecommendationToFile(recommendation);
    } catch (error) {
      console.error('Error processing recommendation:', error);
    }
  };

  const saveRecommendationToFile = async (recommendation) => {
    try {
      // Create a JSON file with the recommendation
      const data = {
        ...recommendation,
        vehicleId: 'TANK-001', // You can make this dynamic
      };

      // Create blob and download
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
    } catch (error) {
      console.error('Error saving recommendation:', error);
      alert('Error saving recommendation file. Please try again.');
    }
  };

  const handleManualInput = () => {
    const text = prompt('Enter your recommendation for changes:');
    if (text) {
      processRecommendation(text);
    }
  };

  return (
    <div className="h-full w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Spec Changer</h3>
          <p className="text-gray-400 text-sm mb-4">
            Record voice recommendations for {selectedPart?.partName || 'selected part'}
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a1 1 0 011 1v8a1 1 0 01-2 0V3a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8zm0 2a6 6 0 110-12 6 6 0 010 12z" />
              </svg>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 animate-pulse"
            >
              <div className="w-3 h-3 bg-white rounded-full"></div>
              Recording...
            </button>
          )}
          
          <button
            onClick={handleManualInput}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Type
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-300 text-sm">Processing audio...</p>
            </div>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-gray-300 text-sm">{transcription}</p>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Recommendations</h4>
            <div className="space-y-2">
              {recommendations.slice().reverse().map((rec, index) => (
                <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-400 capitalize">{rec.partSection}</span>
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

