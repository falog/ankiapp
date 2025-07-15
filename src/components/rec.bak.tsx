'use client';
import React, { useState, useEffect, useRef } from 'react';
import Recorder from './Recorder';

type Props = {
  engine: 'whisper' | 'webspeech';
};

const phrasesList = [
  'Hello, how are you?',
  'I like to eat apples.',
  'Can you speak English?',
  'This is a beautiful day.',
  'She sells seashells.',
  'The quick brown fox jumps.',
  'Please open the window.',
  'I love learning languages.',
  'Where is the nearest station?',
  "It's time to start.",
  'Have a great day!',
  'I am going to school.',
  'What is your name?',
  'He is reading a book.',
  "Let's practice speaking."
];

const normalizeText = (text: string) =>
  text.toLowerCase().replace(/[.,!?']/g, '').trim();

export const Game: React.FC<Props> = ({ engine }) => {
  const phrasesRef = useRef(phrasesList);
  const [target, setTarget] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<'waiting' | 'listening' | 'done'>('waiting');
  const [trigger, setTrigger] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 初期フレーズセット
  useEffect(() => {
    const initial = phrasesRef.current[Math.floor(Math.random() * phrasesRef.current.length)];
    setTarget(initial);
  }, []);

  // 正解時に次のフレーズをセット
  useEffect(() => {
    if (status === 'done' && normalizeText(result) === normalizeText(target)) {
      let nextPhrase;
      do {
        nextPhrase = phrasesRef.current[Math.floor(Math.random() * phrasesRef.current.length)];
      } while (nextPhrase === target);

      const timeout = setTimeout(() => {
        setTarget(nextPhrase);
        setResult('');
        setStatus('waiting');
        setAudioUrl(null);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [status, result, target]);

  const startListening = () => {
    if (engine === 'webspeech') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRecognition) {
        alert('Web Speech API がサポートされていません');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setStatus('listening');
      recognition.start();

      recognition.onresult = (event) => {
        const firstResult = event.results?.[0];
        const firstAlternative = firstResult?.[0];

        if (firstAlternative?.transcript) {
          const transcript = firstAlternative.transcript.trim();
          setResult(transcript);
          setStatus('done');
        } else {
          setStatus('waiting');
        }
      };

      recognition.onerror = () => {
        setStatus('waiting');
      };
    } else {
      setTrigger(prev => !prev);
    }
  };

  const isCorrect = normalizeText(result) === normalizeText(target);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>発音してみよう！</h2>
      <p style={{ fontSize: '1.8rem', margin: '1rem' }}>{target}</p>

      {status !== 'listening' && (
        <button onClick={startListening} style={buttonStyle}>
          🎤 マイクで発音する
        </button>
      )}

      {status === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <p>あなたの発音（テキスト）: <strong>{result}</strong></p>
          <p style={{ color: isCorrect ? 'green' : 'red' }}>
            {isCorrect ? '正解！' : 'ちょっと違うかも…'}
          </p>
          {audioUrl && (
            <audio controls src={audioUrl} style={{ marginTop: '1rem' }} />
          )}
        </div>
      )}

      <Recorder
        trigger={trigger}
        setResult={setResult}
        setStatus={setStatus}
        setAudioUrl={setAudioUrl}
      />
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '1em 2em',
  fontSize: '1rem',
  backgroundColor: '#555',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '1rem',
};
