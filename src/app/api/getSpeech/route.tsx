const speakerID = 'wQHnBeDjtQUASXBO9akt'
const generateAudio = async (text: string, apiKey: string, speakerId: string) => {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${speakerId}?output_format=mp3_44100_96`, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        }),
        body: JSON.stringify({
            "voice_settings": {
                "similarity_boost": 0.5,
                "stability": 0.5,
                "use_speaker_boost": true
            },
            "pronunciation_dictionary_locators": [],
            "model_id": "eleven_multilingual_v2",
            "text": text
        })
    })
    let data = await response.arrayBuffer()
    return data
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    const data = await req.json();
    console.log(data);

    const { text, apiKey, speakerId } = data;
    console.log(text);

    try {
      let audioBuffer = await generateAudio(text, apiKey, speakerId)
      console.log("Audio buffer size:", audioBuffer.byteLength);

      // Convert ArrayBuffer to Base64
      const base64Audio = Buffer.from(audioBuffer).toString('base64');


      // console.log(base64Audio)

      return new Response(JSON.stringify({audioBuf: base64Audio}), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error("Error generating audio:", error);
      return new Response(JSON.stringify({ error: "Failed to generate audio" }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } else {
    // Handle other HTTP methods or return an error
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
