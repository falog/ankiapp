import { NextRequest, NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString('utf-8'));
const client = new textToSpeech.TextToSpeechClient({ credentials });

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Chirp3-HD-Laomedeia',
      ssmlGender: 'FEMALE',
    },
    audioConfig: { audioEncoding: 'MP3' },
  } as const;

  try {
    const [response] = await client.synthesizeSpeech(request);
    return new NextResponse(Buffer.from(response.audioContent as Uint8Array), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'TTS failed', detail: err }, { status: 500 });
  }
}
