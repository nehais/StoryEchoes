import { useState, useRef, useEffect } from "react";

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
  }, []);

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
      <div
        style={{
          width: "40%",
        }}
      >
        {/* Audio File Input */}
        <input
          type="file"
          accept="audio/*"
          ref={(el) =>
            audioFileRefs ? (audioFileRefs.current[index] = el) : null
          } // Assign ref to the input
          onChange={(e) => handleFileUpload(e, index, "audio")}
          className="media-field"
        />
        {page && page.mediaUrlError && (
          <span className="error">{page.mediaUrlError}</span>
        )}{" "}
      </div>

      <div
        style={{
          alignSelf: "flex-start",
        }}
      >
        {/* Play/Pause Button for Audio */}
        {page && page.mediaUrl && !page.mediaUrlError && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="play-audio-tooltip">Play the audio</Tooltip>}
          >
            <button
              type="button"
              onClick={() => toggleMedia(index)}
              className="add-edit-story-buttons"
              style={{
                backgroundColor: "transparent",
                padding: "5px 0 0 10px",
                border: "none",
              }}
            >
              {isMediaPlaying ? "⏸️" : "▶️"}
            </button>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
};

export default StoryContentMediaFields;
