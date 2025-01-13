import { useState } from "react";

import Doodle from "./Doodle";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const BookCoverFields = ({
  title,
  setTitle,
  author,
  setAuthor,
  frontCoverFileRef,
  handleFileUpload,
  setFrontCover,
  frontCover,
  validate,
  errors,
  setErrors,
  mode,
}) => {
  const [isDoodleOpen, setIsDoodleOpen] = useState(false); // Controls the Doodle modal

  const getFileName = () => {
    let fileLabel;
    if (!frontCover) {
      fileLabel = "No file selected";
    } else {
      let theSplit = frontCover.split("\\");
      fileLabel = theSplit[theSplit.length - 1];
      if (fileLabel.length > 20) {
        fileLabel = fileLabel.slice(0, 20) + "...";
      }
    }
    return fileLabel;
  };

  // Function to handle Doodle Save
  const handleDoodleGenerated = async (blob) => {
    try {
      console.log("Uploading Doodle...");
      const uploadedUrl = await uploadToCloudinary(blob, "Doodle"); // Upload to Cloudinary
      setFrontCover(uploadedUrl); // Update front cover

      console.log("Doodle uploaded successfully:", uploadedUrl);

      // Clear the file input field for the front cover
      if (frontCoverFileRef.current) {
        frontCoverFileRef.current.value = ""; // Reset the file input field
        console.log("Front cover file input cleared.");
      }
    } catch (error) {
      console.error("Doodle upload failed:", error);
      alert("Failed to upload the Doodle. Please try again.");
    }
  };

  function checkValidate() {
    if (mode === "edit") {
      validate();
    }
  }
  return (
    <>
      {/* Title and Author */}
      <div className="row">
        <div
          id="title"
          className={`form-group ${
            errors.title
              ? "error-highlight"
              : title.trim()
              ? "success-highlight"
              : ""
          }`}
        >
          <label>Title</label>
          <input
            type="text"
            value={title || ""}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prevErrors) => ({ ...prevErrors, title: "" }));
              }
            }}
            onBlur={checkValidate}
          />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>
        <div
          id="author"
          className={`form-group ${
            errors.author
              ? "error-highlight"
              : author.trim()
              ? "success-highlight"
              : ""
          }`}
        >
          <label>Author</label>
          <input
            type="text"
            value={author || ""}
            onChange={(e) => {
              setAuthor(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prevErrors) => ({ ...prevErrors, author: "" }));
              }
            }}
            onBlur={checkValidate}
          />
          {errors.author && <span className="error">{errors.author}</span>}
        </div>
      </div>

      {/* Front Cover */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
        }}
      >
        {/* Select Front Cover pic*/}
        <div className="front-cover-create">
          <div
            id="frontCover"
            className={`form-group front-cover-group ${
              errors.frontCover ? "error-highlight" : ""
            }`}
          >
            <label>Front Cover</label>
            <div className="input-cover-field">
              <input
                type="file"
                ref={frontCoverFileRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, null, "image")}
              />
              <label className="file-name media-field">{getFileName()}</label>
            </div>
          </div>

          {/* "Create a Doodle" Button */}
          <div className="doodle-button">
            {/* Add the "Create a Doodle" Button */}
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="doodle-tooltip">
                  Draw a Doodle for Cover Page
                </Tooltip>
              }
            >
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent default action
                  setIsDoodleOpen(true); // Open the Doodle modal
                }}
                className="add-edit-story-buttons"
              >
                Doodle 🎨
              </button>
            </OverlayTrigger>

            {/* Render the Doodle Component */}
            <Doodle
              isOpen={isDoodleOpen}
              onClose={() => setIsDoodleOpen(false)} // Close the modal
              onSave={handleDoodleGenerated} // Handle Doodle upload and update state
            />
          </div>
        </div>

        <div className="front-cover-img">
          {frontCover && <img src={frontCover} alt="Front Cover" />}
        </div>
      </div>

      {/* Front Cover Pic errors*/}
      {errors.frontCover && (
        <span className="error" style={{ paddingLeft: "10px" }}>
          {errors.frontCover}
        </span>
      )}
    </>
  );
};

export default BookCoverFields;
