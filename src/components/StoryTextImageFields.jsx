import micIcon from "../assets/mic.png";
import SpeechToTextModal from "./Speechtotext.jsx"; //Import the Speech to text component

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const StoryTextImageFields = ({
  page,
  pages,
  index,
  handlePageTextChange,
  temporaryComponent,
  mode,
  isModalVisible,
  openSpeechToTextModal,
  closeSpeechToTextModal,
  handleModalSubmit,
  currentPageIndex,
  errors,
}) => {
  return (
    <>
      {/* Text Area */}
      <div style={{ display: "flex" }}>
        <div className="story-text-field">
          <textarea
            value={page.text}
            placeholder="Write your story here..."
            onChange={(e) => handlePageTextChange(e.target.value, index)}
          />

          {/*Speak Story Button*/}
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="speak-tooltip">
                Narrate your story to text here.
              </Tooltip>
            }
          >
            <button
              className="speak-button"
              style={{ display: mode === "add" ? "flex" : "none" }}
              onClick={(e) => {
                e.preventDefault();
                openSpeechToTextModal(index);
              }}
            >
              <img src={micIcon} alt="Mic Icon" />
            </button>
          </OverlayTrigger>
        </div>

        {/* Speech-to-Text Modal */}
        {isModalVisible && (
          <SpeechToTextModal
            isVisible={isModalVisible}
            onClose={closeSpeechToTextModal}
            onSubmit={handleModalSubmit}
            existingText={
              currentPageIndex !== null ? pages[currentPageIndex].text : ""
            }
          />
        )}

        <div>
          {page.image && (
            <div>
              <img
                src={page.image}
                alt={`Page ${page.page}`}
                className="page-content-image"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dynamically Render the Temporary Component */}
      {!page.image && temporaryComponent}
      {page.imageError && <span className="error">{page.imageError}</span>}

      {errors &&
        errors.pages &&
        index + 1 === parseInt(errors.pages.match(/\d+/)?.[0]) && (
          <span className="error">{errors.pages}</span>
        )}
    </>
  );
};

export default StoryTextImageFields;
