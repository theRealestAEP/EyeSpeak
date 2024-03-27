'use client'
import Image from "next/image";
import React, { FunctionComponent, useState, useRef, ChangeEvent, useEffect } from "react";
import KeyboardWrapper from "./components/keyboardWrapper";

export default function Home() {
  const [input, setInput] = useState(""); //split this into an array 
  const [arrayInput, setArrayInput] = useState<string[]>([]);
  const keyboard = useRef(null);

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.target.value;
    setInput(input);
    if (keyboard.current !== null) {
      (keyboard.current as any).setInput(input); //assertion 
    }
  };

  useEffect(() => {
    if (input != "") {
      setArrayInput(input.split(" "))
    }
    if (input == "") {
      setArrayInput([])
    }
  }, [input]);

  return (
    <main>
      {/* Left Section: Text input, buttons, and keyboard */}
      <div className="flex flex-col w-3/4">
        {/* Top Left: Text input and buttons */}
        <div className="p-4 space-y-4">
          {/* Text input */}
          <div className="text-input-container">
            <textarea
              className="text-input"
              value={input}
              placeholder="This is what a"
              onChange={onChangeInput}
            />
            <div className="flex flex-wrap mb-20 mt-10">
              {arrayInput.map((word) => {
                return (
                  <div className="mr-2 bg-slate-200 p-2 rounded-md border-black">{word}</div>
                )
              })}
            </div>
          </div>
          {/* Predict and Control buttons */}
          <div className="button-container">
            {/* Predict buttons */}
            <div className="predict-buttons">
              <button className="button predict">Predict 1</button>
              <button className="button predict">Predict 2</button>
              <button className="button predict">Predict 3</button>
            </div>
            {/* Play/Pause/Clear buttons */}
            <div className="control-buttons">
              <button className="button play">Play</button>
              <button className="button pause">Pause</button>
              <button className="button clear">Clear All</button>
              <button className="button delete">Delete Word</button>
              <button className="button share">Share</button>
              <button className="button generate">Generate Audio</button>
            </div>
          </div>
        </div>
        {/* Bottom Left: Keyboard */}
        <div className="keyboard-wrapper">
          <KeyboardWrapper
            keyboardRef={keyboard}
            onChange={setInput}
          />
        </div>
      </div>
      {/* Right Section: Past messages and common phrases */}
      <div className="right-section">
        <div>
          <h2 className="title">Past Messages</h2>
          {/* Container for past messages */}
        </div>
        <div>
          <h2 className="title">Common Phrases</h2>
          {/* Container for common phrases */}
        </div>
      </div>
    </main>

  );
}

