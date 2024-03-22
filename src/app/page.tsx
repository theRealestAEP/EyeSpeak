'use client'
import Image from "next/image";
import React, { FunctionComponent, useState, useRef, ChangeEvent } from "react";
import KeyboardWrapper from "./components/keyboardWrapper";

export default function Home() {
  const [input, setInput] = useState("");
  const keyboard = useRef(null);

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.target.value;
    setInput(input);
    if (keyboard.current !== null) {
      (keyboard.current as any).setInput(input); //assertion 
    }
  };

  return (
    <main className="h-screen flex">
      {/* Left Section: Text input, buttons, and keyboard */}
      <div className="flex flex-col w-3/4">
        {/* Top Left: Text input and buttons */}
        <div className="p-4 space-y-4">
          <input
            className="w-full p-2 border rounded mb-4 custom-textbox-height"
            value={input}
            placeholder="Type here..."
            onChange={onChangeInput}
          />
          {/* Predict and Control buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              {/* Predict buttons */}
              <button className="bg-purple-600 text-white py-2 px-4 rounded">Predict 1</button>
              <button className="bg-purple-600 text-white py-2 px-4 rounded">Predict 2</button>
              <button className="bg-purple-600 text-white py-2 px-4 rounded">Predict 3</button>
            </div>
            <div className="flex space-x-2">
              {/* Play/Pause/Clear buttons */}
              <button className="bg-green-500 text-white py-2 px-4 rounded">Play</button>
              <button className="bg-yellow-400 text-white py-2 px-4 rounded">Pause</button>
              <button className="bg-red-500 text-white py-2 px-4 rounded">Clear All</button>
            </div>
          </div>
        </div>
        {/* Bottom Left: Keyboard */}
        <div className="p-5">
          <KeyboardWrapper

            keyboardRef={keyboard}
            onChange={setInput}
          />
        </div>
      </div>
      {/* Right Section: Past messages and common phrases */}
      <div className="w-1/4 bg-gray-100 p-4 space-y-4 overflow-auto">
        <div>
          <h2 className="font-bold mb-2">Past Messages</h2>
          {/* Container for past messages */}
        </div>
        <div>
          <h2 className="font-bold mb-2">Common Phrases</h2>
          {/* Container for common phrases */}
        </div>
      </div>
    </main>
  );
}

