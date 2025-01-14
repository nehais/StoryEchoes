import React, { useState, useEffect, useRef } from "react";
import annyang from "annyang";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const SpeechToTextModal = React.memo(({ isVisible, onClose, onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false); // Tracks the speech-transcribed text
  const [speechText, setSpeechText] = useState(""); // Tracks the speech-transcribed text
  const [charLimitExceeded, setCharLimitExceeded] = useState(false); // Tracks if the character limit is exceeded
  const lastSentenceRef = useRef(""); // Tracks the last processed sentence to avoid duplicates

  const CHAR_LIMIT = 300; // Define character limit

  useEffect(() => {
    if (isVisible) {
      setSpeechText(""); // Clear the text when the modal is opened
      setCharLimitExceeded(false); // Reset character limit flag
      lastSentenceRef.current = ""; // Clear last processed sentence
    }
  }, [isVisible]);

  const processPunctuation = (text) =>
    text
      .replace(/\bquestion mark\b/gi, "?")
      .replace(/\bdot\b/gi, ".")
      .replace(/\bcomma\b/gi, ",")
      .replace(/\bexclamation mark\b/gi, "!")
      .replace(/\bdash\b/gi, "-")
      .replace(/\bcolon\b/gi, ":")
      .replace(/\bsemicolon\b/gi, ";")
      .trim();

  const processText = (text) => {
    const sentences = text
      .split(".")
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1));

    const processedText =
      sentences.join(". ") + (text.endsWith(".") ? "." : "");
    if (processedText.length > CHAR_LIMIT) {
      setCharLimitExceeded(true);
      return processedText.slice(0, CHAR_LIMIT).trim();
    }

    setCharLimitExceeded(false);
    return processedText;
  };

  const startListening = async (e) => {
    e.preventDefault();

    if (!annyang) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please enable microphone access to use speech recognition.");
      return;
    }

    // Ensure the listening session starts fresh
    annyang.abort();

    annyang.addCallback("result", (phrases) => {
      const rawPhrase = phrases[0];
      const processedPhrase = processPunctuation(rawPhrase);

      // Avoid adding duplicate sentences
      if (processedPhrase !== lastSentenceRef.current) {
        setSpeechText((prevText) => {
          const updatedText = `${prevText} ${processedPhrase}`.trim();
          lastSentenceRef.current = processedPhrase; // Update the last processed sentence
          return processText(updatedText);
        });
      }
    });

    annyang.start({ autoRestart: true, continuous: true }); // Allow continuous and seamless listening
    console.log("Speech recognition started.");
    setIsRecording(true);
  };

  const stopListening = (e) => {
    e.preventDefault();
    if (annyang) {
      console.log("Stopping speech recognition...");
      annyang.abort();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(speechText.trim()); // Submit the transcribed text
    setSpeechText(""); // Clear state for the next use
    setCharLimitExceeded(false); // Reset character limit
    onClose(); // Close the modal
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setSpeechText(""); // Reset text
    setCharLimitExceeded(false); // Reset character limit flag
    onClose(); // Close the modal
  };

  if (!isVisible) return null;

  return (
    <div className="modal-container">
      <div className="speech-to-text-modal">
        <h2>Speech-to-Text</h2>
        <textarea
          value={speechText}
          readOnly // Make the text area readonly
          placeholder="Start talking to see text here..."
        />
        {charLimitExceeded && (
          <p>
            Page 1 exceeds the character limit of {CHAR_LIMIT} characters. Extra
            text has been trimmed.
          </p>
        )}

        <div>
          {!isRecording && (
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="start-tooltip">
                  {" "}
                  Start listening to narrate your story!
                </Tooltip>
              }
            >
              <button
                onClick={startListening}
                className="modal-button"
                style={{ backgroundColor: "#28a745" }}
                isVisible={isRecording}
              >
                Start Listening
              </button>
            </OverlayTrigger>
          )}

          {isRecording && (
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="stop-tooltip"> Stop your story narration!</Tooltip>
              }
            >
              <button
                onClick={stopListening}
                className="modal-button"
                style={{ backgroundColor: "#ffc107" }}
              >
                Stop Listening
              </button>
            </OverlayTrigger>
          )}

          <button
            onClick={handleSubmit}
            className="modal-button"
            style={{ backgroundColor: "#007BFF" }}
          >
            Submit
          </button>

          <button
            onClick={handleCancel}
            className="modal-button"
            style={{ backgroundColor: "#dc3545" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default SpeechToTextModal;
