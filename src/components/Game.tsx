'use client';
import React, { useState, useEffect, useRef } from 'react';

const phrases = [
  'Hello, how are you?',
  'I like to eat apples.',
  'Can you speak English?',
  'This is a beautiful day.',
  "Let's practice speaking."
];

export const Game: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState(phrases[0]);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<'waiting' | 'listening' | 'done'>('waiting');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const normalize = (text: string) =>
    text.toLowerCase().replace(/[.,!?'"‘’“”]/g, '').replace(/\s+/g, ' ').trim();

  useEffect(() => {
    setTarget(phrases[index]);
    setResult('');
    setStatus('waiting');
    setAudioUrl(null);
  }, [index]);

  const handleStart = async () => {
    setStatus('listening');
    setResult('');
    setAudioUrl(null);
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };

    mediaRecorder.start();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('このブラウザはWeb Speech APIに対応していません。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript?.trim() ?? '';

      if (transcript === '') {
        console.log('❌ 音声認識に失敗（空文字）');
        setResult('');
        setStatus('waiting');
      } else {
        console.log('✅ 認識:', transcript);
        setResult(transcript);
        setStatus('done');
      }

      recognition.stop();
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
    };

    recognition.onerror = (e) => {
      console.error('🛑 音声認識エラー:', e.error);
      setStatus('waiting');
      recognition.stop();
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
    };

    recognition.start();
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % phrases.length);
  };

  const isCorrect = normalize(result) === normalize(target);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>発音してみよう！</h2>
      <p style={{ fontSize: '1.5rem' }}>{target}</p>

      {status !== 'listening' && (
        <button onClick={handleStart} style={buttonStyle}>
          🎤 発音スタート
        </button>
      )}

      {status === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <p>あなたの発音: <strong>{isCorrect ? target : result}</strong></p>
          <p style={{ color: isCorrect ? 'green' : 'red' }}>
            {isCorrect ? '正解！次へ進んでね。' : 'ちょっと違うかも…'}
          </p>

          {isCorrect && (
            <button onClick={handleNext} style={{ ...buttonStyle, marginTop: '1rem' }}>
              次へ
            </button>
          )}

          {isCorrect && audioUrl && (
            <div style={{ marginTop: '1rem' }}>
              <audio controls src={audioUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '1em 2em',
  fontSize: '1rem',
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '1rem',
};
