'use client';
import React, { useEffect, useRef } from 'react';

type Props = {
  trigger: boolean;
  setResult: React.Dispatch<React.SetStateAction<string>>;
  setStatus: React.Dispatch<React.SetStateAction<'waiting' | 'listening' | 'done'>>;
  setAudioUrl: (url: string) => void;
};

const Recorder: React.FC<Props> = ({ trigger, setResult, setStatus, setAudioUrl }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunks.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          // Whisperなどへの送信もここで可能
          setResult('（録音結果をここに渡す）');
          setStatus('done');
        };

        setStatus('listening');
        recorder.start();

        // 5秒で自動停止（必要に応じて調整）
        setTimeout(() => {
          recorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 5000);
      } catch (err) {
        console.error('録音エラー:', err);
        setStatus('waiting');
      }
    };

    startRecording();
  }, [trigger, setResult, setStatus, setAudioUrl]);

  return null;
};

export default Recorder;
