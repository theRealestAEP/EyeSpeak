const speakerID = '9DieBUJyEAiLNdK8CupU'
const gerenateAudio = async (text: string) => {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${speakerID}?output_format=mp3_44100_96`, {
        method: 'POST',
        headers: new Headers({ //ignore this for now
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABSKEY || ''
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
    // Handle POST request
    const data = await req.json();
    console.log(data);

    // Do something with 'text'...
    console.log(data.text);
    // let text = data.text

    let audioBuffer = await gerenateAudio(data.text)
    console.log(audioBuffer)
    // Return a response object
    return new Response(JSON.stringify({audioBuf: Buffer.from(audioBuffer).toString('base64')}), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
