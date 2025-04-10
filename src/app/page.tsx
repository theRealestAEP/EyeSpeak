'use client'
import React, { FunctionComponent, useState, useRef, ChangeEvent, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const [input, setInput] = useState(""); //split this into an array 
  const [arrayInput, setArrayInput] = useState<string[]>([]);
  const keyboardRef = useRef<any>(null); //fuck this stupid fucking type fuck it any 
  const [audioSpeechBlob, setAudioSpeechBlob] = useState<Blob | null>(null); //just to have
  const visualizerRef = useRef<HTMLCanvasElement>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [predictedWords, setPredictedWords] = useState<string[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [savedPhrasesOpen, setsavedPhrasesOpen] = useState(false)

  //this is for the currently typed sentence 
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollAmount = 50;


  //this will be for phrases
  const scrollablePhrasesDivRef = useRef<HTMLDivElement>(null);
  const [isScrollablePhrases, setIsScrollablePhrases] = useState(false);

  const [deleteSavedWordMode, setdeleteSavedWordMode] = useState(false)


  //store passed messages locally on device storage - and fetch like the most recent 5 messages and stick them here 
  // only store ones that have been generated into audio so trigger on generate audio
  const [pastMessages, setPastMessages] = useState<string[]>([])


  // const commonPhrases = ["Thank you! ", "Can you come over here really, quickly? ", "Hey how are you doing today? ", "Yes!", "No."]
  const [commonPhrases, setCommonPhrases] = useState<string[]>([]);
  const [speechSpeed, setSpeechSpeed] = useState(1.0); // Add state for speed
  const [settingsOpen, setSettingsOpen] = useState(false); // Add state for settings modal

  useEffect(() => {
    const storedPhrases = localStorage.getItem('commonPhrases');
    if (storedPhrases) {
      setCommonPhrases(JSON.parse(storedPhrases));
    }
  }, []);

  useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;

    function handleScrollUp() {
      if (scrollableDiv) {
        scrollableDiv.scrollTop -= scrollAmount;
      }
    }

    function handleScrollDown() {
      if (scrollableDiv) {
        scrollableDiv.scrollTop += scrollAmount;
      }
    }

    const scrollUpButton = document.getElementById('scrollUp');
    const scrollDownButton = document.getElementById('scrollDown');

    if (scrollUpButton) {
      scrollUpButton.addEventListener('click', handleScrollUp);
    }

    if (scrollDownButton) {
      scrollDownButton.addEventListener('click', handleScrollDown);
    }

    // Clean up function
    return () => {
      if (scrollUpButton) {
        scrollUpButton.removeEventListener('click', handleScrollUp);
      }

      if (scrollDownButton) {
        scrollDownButton.removeEventListener('click', handleScrollDown);
      }
    };
  }, [isScrollable]);

  useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;

    // Function to check if content is scrollable
    function checkScrollable() {
      if (scrollableDiv && scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
        setIsScrollable(true);
      } else {
        setIsScrollable(false);
      }
    }

    // Check if content is scrollable initially
    checkScrollable();

    // Recheck when window size changes
    window.addEventListener('resize', checkScrollable);

    // Recheck when content changes
    const observer = new MutationObserver(checkScrollable);
    if (scrollableDiv) {
      observer.observe(scrollableDiv, { childList: true });
    }

    // Clean up function
    return () => {
      window.removeEventListener('resize', checkScrollable);
      observer.disconnect();
    };
  }, []);


  const onChangeInput = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    const newInput = event.target.value;
    const currentInput = input;
    // console.log('new input: ' + newInput);
    // console.log('current input: ' + currentInput);

    setInput(newInput);
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(newInput); //assertion 
    }
    setArrayInput((newInput).trim().split(' '));
  };

  const addMessageToPastMessages = (message: string) => {
    // console.log('adding message to past messages')
    let tempMessages = [...pastMessages];
    tempMessages.push(message)
    if (tempMessages.length > 3) {
      tempMessages.shift()
    }
    setPastMessages(tempMessages)

  }




  const generateAudio = async () => {
    setAudioLoading(true);
    console.log('Generating audio');

    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('elevenkey');
    const speakerId = urlParams.get('elevenid');

    if (!apiKey || !speakerId) {
      setAudioLoading(false);
      console.error('API key or speaker ID not provided in URL parameters');
      toast.error('API key or speaker ID not provided');
      return;
    }

    try {
      const response = await fetch('/api/getSpeech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          apiKey: apiKey,
          speakerId: speakerId,
          speed: speechSpeed // Pass the speed state here
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.audioBuf) {
        throw new Error('No audio data received from the server');
      }

      const audioBufBase64 = data.audioBuf;
      // console.log(audioBufBase64)
      const audioBuf = Buffer.from(audioBufBase64, 'base64');

      const audioBlob = new Blob([audioBuf], { type: 'audio/mp3' });
      setAudioSpeechBlob(audioBlob);
      const audioURL = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioURL);
      audio.onerror = (e) => {
        // console.error('Audio error:', e);
        // console.error('Audio error code:', audio.error?.code);
        // console.error('Audio error message:', audio.error?.message);
        toast.error('Error loading audio');
      };
      setAudioElement(audio);

      await audio.load();
      console.log('Audio loaded successfully');

      addMessageToPastMessages(input);
      toast.success('Audio generated successfully');
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAudioLoading(false);
    }
  };

  const playAudio = () => {
    if (audioElement !== null) {
      console.log('Audio element:', audioElement);
      console.log('Audio source:', audioElement.src);
      console.log('Audio ready state:', audioElement.readyState);
      audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
    } else {
      console.error('No audio element available');
      toast.error('No audio to play');
    }
  }

  const pauseAudio = () => {
    if (audioElement !== null) {
      audioElement.pause();
    }
  }

  const clearAll = () => {
    setArrayInput([])
    setInput("")
    setAudioSpeechBlob(null)
    setAudioElement(null)
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(""); //assertion 
    }
  }

  const deleteWord = () => {
    const words = input.trim().split(/\s+/);
    if (selectedWordIndex >= 0 && selectedWordIndex < words.length) {
      words.splice(selectedWordIndex, 1); // Remove the word at selectedWordIndex
    }
    const newInput = words.join(" ") + " "; // Reconstruct the input, add space for separation
    setInput(newInput);
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(newInput); //assertion 
    }
    setArrayInput(newInput.split(" "));
    // Reset selectedWordIndex to the last word
    setSelectedWordIndex(words.length - 1);
  };


  const selectWord = (event: any, word: string, index: number) => {
    //so this is when you click on an existing word in the array of words and then you can edit it or auto correct it 
    setSelectedWordIndex(index)
    //get list of possible word replacements
    generatePredictions(word, index)
  }


  const generatePredictions = async (word: string, index: number) => {
    setPredictionsLoading(true)
    
    const urlParams = new URLSearchParams(window.location.search);
    const openaiKey = urlParams.get('openaikey');

    if (!openaiKey) {
      setPredictionsLoading(false);
      console.error('OpenAI API key not provided in URL parameters');
      // toast.error('OpenAI API key not provided');
      return;
    }

    const response = await fetch('/api/promptGPT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input, word: word, index: index, openaiKey: openaiKey }),
    });

    if (!response.ok) {
      setAudioLoading(false)
      //throw an error here 
      console.error('HTTP error', response.status);
    } else {
      const data = await response.json();
      // const autoCompleteData = await autoComplete.json();

      setPredictionsLoading(false)
      // console.log(data);
      //remove all commas and periods from the predictions
      // console.log(data.predictionsArray)
      data.predictionsArray = data.predictionsArray.map((word: string) => word.replaceAll(',', ''))
      // autoCompleteData.predictionsArray = autoCompleteData.predictionsArray.map((word: string) => word.replaceAll(',', ''))

      let combinedArray = data.predictionsArray.slice(0, 5)
      // .concat(autoCompleteData.predictionsArray.slice(0, 4));
      // let combinedArray = combinedArray.filter((value: any, index: any, self: any) => self.indexOf(value) === index);
      setPredictedWords(combinedArray)
      // setAudioLoading(false)
      // set the predictions herea


    }

  }

  const fillPredictedWord = (event: any, word: string) => {
    // console.log('filling predicted word ' + word)
    let newArrayInput = [...arrayInput];
    if (newArrayInput.length === 0) {
      newArrayInput.push(word);
    } else {
      newArrayInput[selectedWordIndex] = word;
    }
    setArrayInput(newArrayInput);
    let newInput
    if (selectedWordIndex < newArrayInput.length - 1) {
      newInput = newArrayInput.join(" ");
    }
    else {
      newInput = newArrayInput.join(" ") + " ";
    }
    setInput(newInput);
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(newInput); //assertion 
    }
  }

  const enterSentence = (message: string) => {
    let newInput = message;
    let newInputArray = (message + " ").split(" ");
    setArrayInput(newInputArray)
    setSelectedWordIndex(newInputArray.length - 1)
    setInput(newInput);
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(newInput); //assertion 
    }
  }
  const handleShare = async () => {
    if (!navigator.share) {
      alert("Sorry, your device does not support sharing.");
      return;
    }

    try {
      if (!audioSpeechBlob) {
        alert("There is no audio to share.");
        return;
      }
      const file = audioSpeechBlob
      const filesArray = [
        new File([file], "audio.mp3", {
          type: "audio/mpeg",
        }),
      ];

      await navigator.share({
        files: filesArray,
        title: "Audio File",
        text: "Check out this audio file!",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
    }
  };

  const magicFix = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const openaiKey = urlParams.get('openaikey');

    if (!openaiKey) {
      console.error('OpenAI API key not provided in URL parameters');
      toast.error('OpenAI API key not provided');
      return;
    }

    const response = await fetch('/api/magicFix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input, openaiKey: openaiKey }),
    });

    if (!response.ok) {
      console.error('HTTP error', response.status);
    } else {
      const data = await response.json();
      console.log(data);
      let newArray = [...data.magicArray]; // Create a copy of data.magicArray
      // newArray.push(" "); // Add a space to newArray

      console.log(newArray)
      setArrayInput(newArray)
      setSelectedWordIndex(newArray.length - 1)
      let newInput = newArray.join(" ")
      setInput(newInput)
      if (keyboardRef.current !== null) {
        (keyboardRef.current as any).setInput(newInput); //assertion 
      }
    }
  }

  const insertSavedPhrase = (phrase: string) => {
    let newArray = phrase.split(" ");
    setArrayInput(newArray)
    setSelectedWordIndex(newArray.length - 1)
    let newInput = newArray.join(" ")
    setInput(newInput)
    if (keyboardRef.current !== null) {
      (keyboardRef.current as any).setInput(newInput); //assertion 
    }
  }

  useEffect(() => {
    if (input != "") {
      setArrayInput(input.split(" "))
      setSelectedWordIndex(input.split(" ").length - 1)
    }
    if (input == "") {
      setArrayInput([])
    }
    generatePredictions(arrayInput[selectedWordIndex], selectedWordIndex)
  }, [input]);
  // Array of keys for the keyboard
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'backspace'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm',],
    ['space']
  ];

  const getButtonClass = (key: string) => {
    switch (key) {
      case 'space':
        return "kbd-button kbd-space";
      case 'shift':
        return "kbd-button kbd-shift";
      default:
        return "kbd-button kbd-default";
    }
  };



  const keyboardPress = (key: string) => {
    console.log('key pressed: ' + key)

    //handle case for space and backspace
    if (key === 'backspace') {
      let newInput = input.slice(0, -1);
      setInput(newInput);
      return;
    }
    if (key === 'space') {
      let newInput = input + ' ';
      setInput(newInput);
      return;
    }
    else {

      let newInput = input + key;

      setInput(newInput);
    }

  }

  // IF THERE ARE MORE THAN 15 - MAKE SCROLLABLE OR PREVENT USER FROM ADDING MORE 
  // ADD DELETION FOR COMMON PHRASES 
  const deleteSavedPhrase = (index: number) => {
    let newCommonPhrases = [...commonPhrases];
    newCommonPhrases.splice(index, 1);
    setCommonPhrases(newCommonPhrases);
    localStorage.setItem('commonPhrases', JSON.stringify(newCommonPhrases));
  }

  //Need to add a function to save as a common phrase - common phrases will be stored in local storage and fetched on page load 
  const savePhrase = () => {
    //save the current input as a common phrase
    //add to local storage 
    //fetch the common phrases on page load
    // Assume `input` is the current input you want to save
    let commonPhrases: string[] = localStorage.getItem('commonPhrases') ? JSON.parse(localStorage.getItem('commonPhrases')!) : [];
    if (input == "") {
      toast("Please enter a phrase to save!");
      return;
    }

    if (commonPhrases.includes(input)) {
      toast("phrase already saved!");
      return;
    }

    // Add the current input to the array
    commonPhrases.push(input);
    setCommonPhrases(commonPhrases);
    toast("Saved!");
    // setCommonPhrases(commonPhrases);
    // toast that it has been saved 
    // Save the updated array back to local storage
    localStorage.setItem('commonPhrases', JSON.stringify(commonPhrases));
  }

  const handleSpeedChange = (increment: boolean) => {
    setSpeechSpeed(prevSpeed => {
      let newSpeed = increment ? prevSpeed + 0.05 : prevSpeed - 0.05;
      // Clamp the value between 0.8 and 1.2 and round to avoid floating point issues
      newSpeed = Math.max(0.8, Math.min(1.2, parseFloat(newSpeed.toFixed(2))));
      return newSpeed;
    });
  };

  return (
    <main>
      {/* Left Section: Text input, buttons, and keyboard */}
      <div className="flex flex-col">
        {/* Top Left: Text input and buttons */}
        <div className="p-4 space-y-4">
          {/* Text input */}
          <div className="text-input-container">
            <textarea
              className="text-input"
              value={input}
              placeholder="Text will output here..."
              onChange={onChangeInput}
            />
            <div className="flex min-h-[80px]">
              <div ref={scrollableDivRef} className="flex flex-wrap mb-2 mt-2 overflow-y-auto" style={{ maxHeight: '10vh' }}>
                {arrayInput.map((word, index) => {
                  return (
                    <div
                      key={index}
                      className={`mr-2 mb-2 bg-slate-200 p-2 rounded-md border-black text-3xl font-bold ${index === selectedWordIndex ? 'glow' : ''}`}
                      onClick={(event) => selectWord(event, word, index)}
                    >
                      {word}
                    </div>
                  )
                })}
              </div>
              {isScrollable && (
                <div className="flex flex-col justify-center ml-4">
                  <button id="scrollUp" className="mb-2 bg-blue-300 rounded-md p-2 text-3xl">Up</button>
                  <button id="scrollDown" className="bg-blue-300 rounded-md p-2 text-3xl">Down</button>
                </div>
              )}

            </div>
          </div>
          {/* Predict and Control buttons */}
          <div className="flex flex-col">
            <div className="button-container control-buttons">
              {audioElement ?
                <button className="button play" onClick={playAudio}>Play</button>
                :
                <button className="play-disabled">No Audio</button>
              }


              <button className="button delete" onClick={deleteWord}>Delete Word</button>
              {/* share button will come back when I link up supabase */}
              <button className="button clear" onClick={clearAll}>Clear All</button>
              <button className="button share" onClick={handleShare}>Share</button>
              {/* <button className="button pause" onClick={pauseAudio}>Pause</button> */}
              <button className="button magic" onClick={magicFix}>Magic Fix</button>
              <button className="button save" onClick={savePhrase}>Save</button>

              {audioLoading
                ?
                <div role="status">
                  <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>

                : <button className="button generate" onClick={generateAudio}>Generate Audio</button>
              }
            </div>
            <div className="button-container predict-buttons">
              {/* I need to move these under the buttons below */}
              {predictionsLoading ? <div role="status" className="h-[55px]">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
                :
                <div className="predict-buttons">
                  {
                    predictedWords.map((word, index) => {
                      return (
                        <button className="button predict" key={index} onClick={(event) => fillPredictedWord(event, word)}>{word}</button>
                      )
                    })
                  }
                </div>
              }
            </div>
          </div>
          <div className="keyboard-container">
            <div>
              <div>
                {rows.map((row, index) => (
                  <div key={index} className="flex justify-center gap-2 mb-2">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => keyboardPress(key)}
                        className={getButtonClass(key)}
                      >
                        {key.toUpperCase()}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div >
            {/* button to open the modal for saved phrases */}
            <button className="absolute bottom-0 right-0 bg-purple-600 text-3xl rounded-md p-5 font-bold text-white" onClick={() => setsavedPhrasesOpen(!savedPhrasesOpen)}>Saved Phrases</button>
          </div>
          <div>
            {savedPhrasesOpen && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-10 flex items-center justify-center overflow-y-auto">

                <div className="bg-white p-6 rounded shadow-lg relative min-w-[50vw] min-h-[50vh]">
                  {/* Modal content goes here */}
                  <div className="grid grid-cols-3 gap-4">
                    {commonPhrases.length === 0 ? (
                      <p>Nothing saved yet</p>
                    ) : (
                      commonPhrases.map((phrase, index) => (
                        <div key={index} onClick={() => {
                          if (deleteSavedWordMode == false) {
                            insertSavedPhrase(phrase);
                            setsavedPhrasesOpen(!savedPhrasesOpen)
                          }
                          else {
                            deleteSavedPhrase(index)
                          }
                        }} className="card bg-blue-100 p-6 text-3xl rounded shadow text-bold cursor-pointer hover:bg-blue-200">
                          <p>{phrase}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="absolute top-4 right-4 bg-red-600 text-4xl rounded-md p-4 font-bold text-white" onClick={() => {setsavedPhrasesOpen(!savedPhrasesOpen); setdeleteSavedWordMode(false)}}>Close</button>
                  {deleteSavedWordMode ? (
                    <button className="absolute top-4 left-4 bg-red-600 text-4xl rounded-md p-4 font-bold text-white" onClick={() => setdeleteSavedWordMode(!deleteSavedWordMode)}>Stop Deleting</button>
                  ) : (
                    <button className="absolute top-4 left-4 bg-red-600 text-4xl rounded-md p-4 font-bold text-white" onClick={() => setdeleteSavedWordMode(!deleteSavedWordMode)}>Delete Mode</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
             <button
               className="absolute bottom-4 left-4 bg-gray-600 text-3xl rounded-md p-5 font-bold text-white"
               onClick={() => setSettingsOpen(true)}
             >
               ⚙️ {/* Gear Icon */}
             </button>
          </div>
          {settingsOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-20 flex items-center justify-center">
              <div className="bg-white p-8 rounded shadow-lg relative w-1/3">
                <h2 className="text-4xl font-bold mb-6 text-center">Settings</h2>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <span className="text-2xl font-medium">Speech Speed:</span>
                  <button
                    onClick={() => handleSpeedChange(false)}
                    disabled={speechSpeed <= 0.8}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-3xl disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold w-16 text-center">{speechSpeed.toFixed(2)}</span>
                  <button
                    onClick={() => handleSpeedChange(true)}
                    disabled={speechSpeed >= 1.2}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-3xl disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <button
                  className="absolute top-4 right-4 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded text-2xl"
                  onClick={() => setSettingsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        <ToastContainer />
      </div>
    </main>

  );
}
