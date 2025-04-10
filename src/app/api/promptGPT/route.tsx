import OpenAI from 'openai'

const generatePredictions = async (sentence: string, word: string, index: number, apiKey: string) => {
  const openai = new OpenAI({ apiKey });
  // console.log('translating');
  // console.log(typeof(sentence))
  // console.log(typeof(word))
  // console.log(typeof(index))

  if (word == undefined) {
    word = ''
  }
  if (typeof (sentence) === 'undefined') {
    sentence = ''
  }
  // console.log('cleaning');
  // console.log(sentence)
  // console.log(word)
  // console.log(index)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        "role": "system", "content": `You are an advanced text message autocomplete tool designed to enhance sentence completion by providing word suggestions based on the typing context. Your operation will vary slightly depending on the position of the word in the sentence:
            1. When receiving a sentence, the current word under consideration, and its position in the sentence, you should:
               - If the word's index is at the end of the sentence, suggest six words that could logically follow to extend the sentence.
               - ONLY If the word's index is in the middle of the sentence, suggest six alternative words that could replace it, ensuring they fit the context and grammar of the sentence.
            2. If the sentence input is empty and the word index is 0, assume it's the beginning of a new message and suggest three words that could start a sentence.
            3. If the word is at the end of the sentence and it's a complete word, not just a word fragment. Suggest words that advance the sentence and contextually make sense.
            3. Always return your suggestions as a space-separated list, avoiding any punctuation or delimiters other than spaces.
            4. Your response should strictly consist of the suggested words, without additional commentary or feedback.` },
      { "role": "user", "content": `the current sentence is:${sentence}, the current word selected:${word}, and the index of the word:${index}` }
    ],
    stream: false,
  });
  console.log(response.choices[0].message.content);
  return response.choices[0].message.content;
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    const data = await req.json();
    const { text, word, index, openaiKey } = data;

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let predictions = await generatePredictions(text || '', word, index, openaiKey);

    let predictionsArray = predictions!.replace(/"/g, '').split(' '); // split the predictions into an array of words

    // Return a response object
    return new Response(JSON.stringify({ predictionsArray: predictionsArray }), {
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
