import { useState, useRef, useEffect } from "react";

import playIcon from "../assets/play.png";
import stopIcon from "../assets/stop.png";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const StoryContentMediaFields = ({
  page,
  index,
  audioFileRefs,
  handleFileUpload,
}) => {
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef && audioRef.current) {
        console.log("Media: cleaned up");
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [page]);

  const getFileName = () => {
    let fileLabel;
    if (!page || (page && !page.mediaUrl)) {
      fileLabel = "No file selected";
    } else {
      let theSplit = page.mediaUrl.split("\\");
      fileLabel = theSplit[theSplit.length - 1];
      if (fileLabel.length > 25) {
        fileLabel = fileLabel.slice(0, 25) + "...";
      }
    }
    return fileLabel;
  };

  const toggleMedia = () => {
    let mediaUrl = page.mediaUrl;

    if (!audioRef.current) {
      // Create the audio object if it doesn't exist
      audioRef.current = new Audio(mediaUrl);
      audioRef.current.volume = 0.25;
    } else {
      // Change the audio source if a new URL is provided
      if (audioRef.current.src !== mediaUrl) {
        audioRef.current.src = mediaUrl;
      }
    }

    if (isMediaPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsMediaPlaying(!isMediaPlaying);
  };

  return (
    <div className="page-media-buttons">
      <div className="input-file-field">
        {/* Audio File Input */}
        <input
          type="file"
          accept="audio/*"
          ref={(el) =>
            audioFileRefs ? (audioFileRefs.current[index] = el) : null
          } // Assign ref to the input
          onChange={(e) => handleFileUpload(e, index, "audio")}
        />
        <label className="file-name media-field">{getFileName()}</label>
      </div>
      <div>
        {/* Play/Pause Button for Audio */}
        {page && page.mediaUrl && !page.mediaUrlError && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="play-audio-tooltip">
                {isMediaPlaying ? "Stop the audio" : "Play the audio"}
              </Tooltip>
            }
          >
            <button
              type="button"
              onClick={() => toggleMedia(index)}
              className="add-edit-story-buttons media-button"
            >
              <img
                className="media-button"
                src={isMediaPlaying ? stopIcon : playIcon}
                alt="Play Media Icon"
              />
            </button>
          </OverlayTrigger>
        )}
      </div>
      {page && page.mediaUrlError && (
        <span className="error">{page.mediaUrlError}</span>
      )}{" "}
    </div>
  );
};

export default StoryContentMediaFields;
