const speakerID = 'wQHnBeDjtQUASXBO9akt'
const generateAudio = async (text: string, apiKey: string, speakerId: string, speed: number) => {
    const bodyPayload: any = {
        "voice_settings": {
            "similarity_boost": 0.5,
            "stability": 0.5,
            "use_speaker_boost": true,
            "speed": speed
        },
        "pronunciation_dictionary_locators": [],
        "model_id": "eleven_multilingual_v2",
        "text": text
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${speakerId}?output_format=mp3_44100_96`, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        }),
        body: JSON.stringify(bodyPayload)
    })
    let data = await response.arrayBuffer()
    return data
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    const data = await req.json();
    console.log(data);

    const { text, apiKey, speakerId, speed = 1.0 } = data;
    console.log("Received Text:", text);
    console.log("Received Speed:", speed);

    const validatedSpeed = Math.max(0.5, Math.min(2.0, speed));
    const finalSpeed = Math.max(0.8, Math.min(1.2, validatedSpeed));

    try {
      let audioBuffer = await generateAudio(text, apiKey, speakerId, finalSpeed)
      console.log("Audio buffer size:", audioBuffer.byteLength);

      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return new Response(JSON.stringify({audioBuf: base64Audio}), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error("Error generating audio:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage);
      return new Response(JSON.stringify({ error: `Failed to generate audio: ${errorMessage}` }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
