import UpIcon from "../assets/up.png";
import DownIcon from "../assets/down.png";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const PageButtons = ({ page, pages, index, addPage, movePage, deletePage }) => {
  const MAX_PAGES = 7;

  return (
    <div className="page-buttons">
      {/* Add Page Button (only on the last page and if limit not reached) */}
      <div className="page-add-button">
        {index < MAX_PAGES - 1 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="add-page-tooltip">Add a new story page</Tooltip>
            }
          >
            <button
              type="button"
              onClick={addPage}
              className="add-edit-story-buttons"
            >
              + Add
            </button>
          </OverlayTrigger>
        )}
      </div>

      {/* Move Up Button */}
      <div className="move-buttons">
        {index > 0 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="move-page-up-tooltip">Re-order the page up</Tooltip>
            }
          >
            <button
              type="button"
              onClick={() => movePage(index, "up")}
              className="add-edit-story-buttons move-button"
            >
              <img src={UpIcon} alt="Up Icon Button" />
            </button>
          </OverlayTrigger>
        )}

        {/* Move Down Button */}
        {index < pages.length - 1 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="move-page-down-tooltip">
                Re-order the page down
              </Tooltip>
            }
          >
            <button
              type="button"
              onClick={() => movePage(index, "down")}
              className="add-edit-story-buttons move-button"
            >
              <img src={DownIcon} alt="Down Icon Button" />
            </button>
          </OverlayTrigger>
        )}
      </div>

      {/* Delete Button */}
      <div className="page-delete-button">
        {page.page >= 2 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="delete-page-tooltip">Delete the story page</Tooltip>
            }
          >
            <button
              type="button"
              onClick={() => deletePage(index)}
              className="add-edit-story-buttons"
            >
              - Delete
            </button>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
};

export default PageButtons;
