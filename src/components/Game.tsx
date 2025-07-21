'use client';
import React, { useState, useEffect, useRef } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';


const phrases = [
  "I really like it.",
  "Where are you from?",
  "Let’s have lunch together.",
  "Do you have a reservation?",
  "How long will it take?",
  "I thought it was fine.",
  "Would you like some coffee?",
  "Please speak more clearly.",
  "She lives near here.",
  "They’re waiting for us.",
  "I’d rather stay home.",
  "There’s a lot of traffic.",
  "I forgot my umbrella.",
  "I have a little brother.",
  "Let’s go shopping.",
  "Can you hear me clearly?",
  "It’s hard to believe.",
  "Let’s meet later.",
  "I’m learning English.",
  "He works at a law firm.",
  "Let me think about it.",
  "I visited my friend yesterday.",
  "That’s a great idea!",
  "This is quite different.",
  "Please leave a message.",
  "It’s a beautiful day.",
  "Do you live nearby?",
  "They’ll arrive at noon.",
  "Let’s make a reservation.",
  "This place is really clean."
];



export const Game: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState(phrases[0]);
  const [result, setResult] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'listening' | 'done' | 'loading'>('waiting');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const normalize = (text: string) =>
    text.toLowerCase().replace(/[.,!?'"‘’“”]/g, '').replace(/\s+/g, ' ').trim();


useEffect(() => {
  setTarget(phrases[index]);
  setResult('');
  setConfidence(0);
  setStatus('waiting');
  setAudioUrl(null);
}, [index]);


  const handleTTS = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: target }),
      });

      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      alert('TTSエラー: ' + e);
    } finally {
      setStatus('waiting');
    }
  };

  const handleStart = async () => {
    setStatus('listening');
    setResult('');
    setConfidence(0);
    setAudioUrl(null);
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));

      setStatus('loading');
      try {
        const buffer = await blob.arrayBuffer();
        const res = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'audio/webm' },
          body: buffer,
        });

        if (!res.ok) throw new Error('STT failed');

        const data = await res.json();
        const transcript = data.response?.results?.[0]?.alternatives?.[0]?.transcript || '';
        const conf = data.response?.results?.[0]?.alternatives?.[0]?.confidence ?? 0;

        console.log('STT 結果:', transcript, conf);

        setResult(transcript);
        setConfidence(conf);
        setStatus('done');
      } catch (err) {
        console.error('STTエラー:', err);
        alert('音声認識に失敗しました。');
        setStatus('waiting');
      }
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    }, 3000); // 3秒録音
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % phrases.length);
  };

  const isCorrect = normalize(result) === normalize(target) && confidence >= 0.90;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>発音してみよう！</h2>
      <p style={{ fontSize: '1.5rem' }}>{target}</p>

      <div style={{ margin: '1rem' }}>
        <button onClick={handleTTS} style={buttonStyle} disabled={status === 'loading'}>
          ▶️ 見本を聴く
        </button>
      </div>

      {status !== 'listening' && (
        <button onClick={handleStart} style={buttonStyle} disabled={status === 'loading'}>
          🎤 発音スタート
        </button>
      )}

      {status === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <p>
            あなたの発音: <strong>{result}</strong>
          </p>
          <p>発音スコア: {(confidence * 100).toFixed(1)}%</p>
          <p style={{ color: isCorrect ? 'green' : 'red' }}>
            {isCorrect ? '正解！次へ進んでね。' : '発音の質が足りないか、内容が違うよ！'}
          </p>

          {isCorrect && (
            <button onClick={handleNext} style={{ ...buttonStyle, marginTop: '1rem' }}>
              次へ
            </button>
          )}

{audioUrl && (
  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
    <AudioPlayer
      src={audioUrl}
      showJumpControls={false}
      showDownloadProgress={false}
      customVolumeControls={[]}
      customAdditionalControls={[]}
      style={{
        borderRadius: '10px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      }}
    />
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
