import React, { useState, useRef } from 'react';
import './VoiceInputLocal.css';

interface VoiceInputLocalProps {
  onTranscript: (text: string) => void;
}

const VoiceInputLocal: React.FC<VoiceInputLocalProps> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Визуализация уровня звука
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Здесь можно отправить на локальный сервер распознавания
        // Пока просто уведомляем пользователя
        onTranscript('[Голосовое сообщение записано - требуется локальный сервер распознавания]');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Не удалось получить доступ к микрофону. Проверьте разрешения.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="voice-input-local">
      <button
        className={`voice-btn-local ${isRecording ? 'recording' : ''}`}
        onClick={toggleRecording}
        title={isRecording ? 'Остановить запись' : 'Начать запись'}
      >
        {isRecording ? '🔴' : '🎙️'}
      </button>
      {isRecording && (
        <div className="audio-level-indicator">
          <div
            className="audio-level-bar"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceInputLocal;
