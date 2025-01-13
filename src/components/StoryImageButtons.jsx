import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const StoryImageButtons = ({
  page,
  index,
  imageFileRefs,
  handleFileUpload,
  handleImageGenerated,
}) => {
  const getFileName = () => {
    let fileLabel;
    if (!page || (page && !page.image)) {
      fileLabel = "No file selected";
    } else {
      let theSplit = page.image.split("\\");
      fileLabel = theSplit[theSplit.length - 1];
      if (fileLabel.length > 25) {
        fileLabel = fileLabel.slice(0, 25) + "...";
      }
    }
    return fileLabel;
  };

  return (
    <>
      <div className="page-image-buttons" style={{ marginTop: "10px" }}>
        <div className="input-file-field">
          {/* File Upload for Image */}
          <input
            type="file"
            accept="image/*"
            ref={(el) => (imageFileRefs.current[index] = el)} // Assign ref to the input
            onChange={(e) => handleFileUpload(e, index, "image")}
          />
          <label className="file-name image-field">{getFileName()}</label>
        </div>

        {page.text.trim() && (
          <div>
            {/* Parent wrapper */}
            {/* Generate Image Button */}
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="generate-image-tooltip">
                  Generate an AI Image on story content
                </Tooltip>
              }
            >
              <button
                type="button"
                onClick={() => handleImageGenerated(index, page.text)}
                disabled={page.isGenerating} // Disable the button while generating
                className="add-edit-story-buttons"
                style={{
                  backgroundColor: page.isGenerating ? "white" : "darkblue",
                  color: "Magenta",
                  fontfamily: "Bubblegum San",
                  fontWeight: "bold",
                  cursor: page.isGenerating ? "not-allowed" : "pointer",
                  border: "none",
                  borderRadius: "5px",
                  height: "35px",
                  fontSize: "0.8em",
                }}
              >
                {page.isGenerating ? "Generating..." : "Generate Image"}
              </button>
            </OverlayTrigger>
          </div>
        )}
      </div>
    </>
  );
};

export default StoryImageButtons;
