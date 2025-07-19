import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

const raw = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString('utf-8');
const credentials = JSON.parse(raw);

const client = new SpeechClient({
  projectId: credentials.project_id,
  credentials,
});

export async function POST(req: NextRequest) {
  const body = await req.arrayBuffer();
  const audioBytes = Buffer.from(body).toString('base64');

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: 'WEBM_OPUS', // or LINEAR16 if you're sending PCM
      sampleRateHertz: 48000, // WebMなら通常48000Hz
      languageCode: 'en-US',
    },
  } as const;

  try {
    const [response] = await client.recognize(request);
    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({ error: 'STT failed', detail: err }, { status: 500 });
  }
}
