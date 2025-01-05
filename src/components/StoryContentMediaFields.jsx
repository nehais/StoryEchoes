import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const StoryContentMediaFields = ({
  page,
  index,
  audioFileRefs,
  handleFileUpload,
}) => {
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
          style={{
            backgroundColor: page && page.audio ? "lightgreen" : "white", // Greyed out if media URL is provided
            opacity: page && page.mediaUrl ? 0.5 : 1, // Adjust opacity
          }}
          disabled={page && !!page.mediaUrl} // Disable if media URL is provided
        />
        {page && page.audioError && (
          <span className="error">{page.audioError}</span>
        )}{" "}
      </div>

      <div
        style={{
          alignSelf: "flex-start",
        }}
      >
        {/* Play/Pause Button for Audio */}
        {page && page.audio && !page.audioError && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="play-audio-tooltip">Play the audio</Tooltip>}
          >
            <button
              type="button"
              onClick={() => toggleAudio(index)}
              className="add-edit-story-buttons"
              style={{
                backgroundColor: "transparent",
                padding: "5px 0 0 10px",
                border: "none",
              }}
            >
              {page && page.isPlaying ? "⏸️" : "▶️"}
            </button>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
};

export default StoryContentMediaFields;
