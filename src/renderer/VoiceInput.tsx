import React, { useState, useEffect, useRef } from 'react';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isActive, onToggle }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Проверка поддержки Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ru-RU';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing...');
          return;
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        // Автоматически перезапускаем если пользователь не остановил вручную
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Could not restart recognition');
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
    };
  }, [onTranscript, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="voice-input">
      <button
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        title={isListening ? 'Остановить запись' : 'Начать голосовой ввод'}
      >
        {isListening ? '🎤' : '🎙️'}
      </button>
      {isListening && (
        <div className="voice-indicator">
          <div className="voice-wave">
            <span></span>
            <span></span>
            <span></span>
          </div>
          {transcript && (
            <div className="voice-transcript">{transcript}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
