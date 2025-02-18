import "../styles/WonderShelf.css"; // Importing styles
import { useState, useEffect } from "react"; // Importing React hooks
import { useSearchParams } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";

import { useStories } from "../contexts/stories.context.jsx";
import FunctionBar from "../components/FunctionBar.jsx";
import StoryGridView from "../components/StoryGridView.jsx";
import StoryListView from "../components/StoryListView.jsx";

const WonderShelf = () => {
  const { stories, loading, error } = useStories(); //Fetched stories in Context API
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchStr, setSearchStr] = useState(""); // State for search text
  const [filteredBooks, setFilteredBooks] = useState([...stories]);
  const [hasResults, setHasResults] = useState(0);
  const [ascSort, setAscSort] = useState(true);
  const [gridMode, setGridMode] = useState(true);

  const mode = searchParams.get("mode");

  useEffect(() => {
    /*Search filter added here*/
    let tempBooks = [...stories];
    if (searchStr) {
      tempBooks = stories.filter((oneStory) => {
        if (oneStory.title) {
          return (
            oneStory.title.toUpperCase().search(searchStr.toUpperCase()) >= 0
          );
        } else {
          return false;
        }
      });
    }
    tempBooks = sortByTitle(tempBooks);
    setFilteredBooks([...tempBooks]);
    setHasResults(tempBooks.length);
  }, [searchStr, stories, ascSort]);

  function sortByTitle(books) {
    return books.sort((a, b) => {
      const titleA = a.title || ""; // Fallback to empty string
      const titleB = b.title || ""; // Fallback to empty string

      if (ascSort) {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });
  }

  useEffect(() => {
    let tempBooks = stories.filter((story) => story.title); // Exclude invalid entries

    if (searchStr) {
      tempBooks = tempBooks.filter((oneStory) => {
        if (oneStory.title) {
          return oneStory.title.toUpperCase().includes(searchStr.toUpperCase());
        } else {
          return false;
        }
      });
    }

    tempBooks = sortByTitle(tempBooks);
    setFilteredBooks([...tempBooks]);
    setHasResults(tempBooks.length);
  }, [searchStr, stories, ascSort]);

  /* Display loading indicator */
  if (!stories || loading) {
    return (
      <div className="message-area">
        <Spinner animation="grow" variant="info" />
        <p>Unveiling imaginative tales...</p>
      </div>
    );
  }

  /* Display error */
  if (error) {
    return (
      <div className="message-area">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="wonder-shelf">
      {/* Search & Sort */}
      <div className="function-area">
        <FunctionBar
          searchStr={searchStr}
          setSearchStr={setSearchStr}
          ascSort={ascSort}
          setAscSort={setAscSort}
          gridMode={gridMode}
          setGridMode={setGridMode}
        />
      </div>

      {/* Display stories in Grid Mode*/}
      {gridMode && (
        <StoryGridView
          filteredBooks={filteredBooks}
          mode={mode}
        ></StoryGridView>
      )}

      {/* Display stories in List Mode*/}
      {!gridMode && (
        <StoryListView
          filteredBooks={filteredBooks}
          mode={mode}
        ></StoryListView>
      )}
    </div>
  );
};

export default WonderShelf;
