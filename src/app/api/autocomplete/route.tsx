import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});


const generatePredictions = async (sentence: string, word:string, index:number) => {
    // console.log('translating');
    // console.log(typeof(sentence))
    // console.log(typeof(word))
    // console.log(typeof(index))

    if(word == undefined){
        word = ''
    }
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
            { "role": "system", "content": `You are an advanced text message autocomplete tool designed to offer word suggestions based on the typing context, only respond with a space separated list of words that might complete the sentence. If the sentence is empty, suggest common words that start a sentence. `},
            { "role": "user", "content": `the current sentence is: ${sentence}` }
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

    let predictions = await generatePredictions(text, data.word, data.index)


    let predictionsArray = predictions!.replace(/"/g, '').split(' '); // split the predictions into an array of words

    // Return a response object
    return new Response(JSON.stringify({predictionsArray: predictionsArray}), {
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
