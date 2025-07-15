// src/lib/blobToPCM.ts
export async function blobToPCM(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
    // 16kHz / モノラルにリサンプリング
    const offlineContext = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
  
    const renderedBuffer = await offlineContext.startRendering();
    const float32Data = renderedBuffer.getChannelData(0); // モノラルのデータ取得
  
    // Whisperが期待する形式（Float32Array [-1,1]）をそのまま渡す
    await audioContext.close();
    return float32Data;
  }
  