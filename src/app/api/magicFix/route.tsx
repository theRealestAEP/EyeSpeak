import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});


const generatePredictions = async (sentence: string) => {
    // console.log('translating');
    // console.log(typeof(sentence))
    // console.log(typeof(word))
    // console.log(typeof(index))
    if(typeof(sentence) === 'undefined'){
        sentence = ''
    }
    // console.log('cleaning');
    // console.log(sentence)
    // console.log(word)
    // console.log(index)

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { "role": "system", "content": `You are an AI designed to correct and re-output sentences that might be in broken english, in a complete sentence with punctuation.
            Keep the context and meaning of the message as much as possible.
            Do not prepend or append any additional information to the sentence.
            Only respond with the adjusted sentence do not give the user any other feedback.` },
            { "role": "user", "content": `${sentence}` }
        ],
        stream: false,
    });
    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    // Handle POST request
    const data = await req.json();
    console.log(data);

    // Do something with 'text'...
    console.log(data.text);
    let text = data.text
    if(typeof(text) == 'undefined'){
        text = ''
    }

    console.log(text)

    let predictions = await generatePredictions(text)

    let magicArray = predictions!.split(' ') // split the predictions into an array of words

    // Return a response object
    return new Response(JSON.stringify({magicArray: magicArray}), {
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
