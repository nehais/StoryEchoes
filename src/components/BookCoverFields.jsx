import { useState } from "react";

import Doodle from "./Doodle";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const BookCoverFields = ({
  title,
  setTitle,
  author,
  setAuthor,
  frontCoverFileRef,
  handleFileUpload,
  handleDoodleGenerated,
  frontCover,
  validate,
  errors,
  setErrors,
  mode,
}) => {
  const [isDoodleOpen, setIsDoodleOpen] = useState(false); // Controls the Doodle modal

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
        <div
          style={{
            width: "47%",
            display: "flex",
            justifyContent: "space-between",
            padding: "0px",
            alignItems: "center",
          }}
        >
          <div
            id="frontCover"
            className={`form-group front-cover-group ${
              errors.frontCover ? "error-highlight" : ""
            }`}
            style={{
              width: "100%",
            }}
          >
            <label>Front Cover</label>
            <input
              type="file"
              ref={frontCoverFileRef}
              accept="image/*"
              onChange={(e) => handleFileUpload(e, null, "image")}
              className="image-field"
              style={{
                width: "100%",
              }}
            />
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
                style={{
                  height: "37px",
                  fontFamily: "Comic Neuve, cursive",
                  fontSize: "1em", // Increased font size
                  borderRadius: "10px",
                  backgroundColor: "darkblue",
                  color: "Magenta",
                  border: "2px solid #28c4ac",
                  padding: "5px 5px",
                }}
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

        <div
          className="front-cover-img"
          style={{
            paddingLeft: "20px",
          }}
        >
          {frontCover && (
            <img
              src={frontCover}
              alt="Front Cover"
              style={{
                width: "80px",
                maxHeight: "80px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          )}
        </div>
      </div>

      {/* Front Cover Pic errors*/}
      {errors.frontCover && <span className="error">{errors.frontCover}</span>}
    </>
  );
};

export default BookCoverFields;
