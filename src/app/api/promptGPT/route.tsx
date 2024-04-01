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
            { "role": "system", "content": `You are a text message tool. You will be given a current sentence being typed out and the current word the user is working on and the index of that word. 
            If the word is in the middle of the sentence you should offer fitting alternatives for that word or spelling corrections. 
            If the word is at the end of the sentence you should offer autcompletions and the next best word like texting. 
            Do not give the user any other feedback besides helpful words. 
            If the input is blank and the index is 0 its likely the start of a message. 
            The input must be returned in a space separated list, do not use any other delimiters like commas.
            Do not give the user any other feedback except for the 6 words.` },
            { "role": "user", "content": `the current sentence is:${sentence}, the current word selected:${word}, and the index of the word:${index}` }
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

    let predictionsArray = predictions!.split(' ') // split the predictions into an array of words

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
