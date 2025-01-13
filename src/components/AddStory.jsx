import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddEditStory.css";
import FallbackImage from "../assets/fallback.jpg";

import axios from "axios";
import { API_URL } from "../config/apiConfig.js";
import { useStories } from "../contexts/stories.context.jsx";

import PollinationImage from "./PollinationImage.jsx";
import BookCoverFields from "./BookCoverFields.jsx";
import StoryTextImageFields from "./StoryTextImageFields.jsx";
import StoryImageButtons from "./StoryImageButtons.jsx";
import StoryContentMediaFields from "./StoryContentMediaFields.jsx";
import PageButtons from "./PageButtons.jsx";

import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const AddStory = () => {
  const imageFileRefs = useRef([]);
  const audioFileRefs = useRef([]);

  const INITIAL_ERRORS = [];
  const imageCache = new Map(); // Cache to store prompt-image mappings
  const cachedUrl = imageCache.get("debugText"); // Replace "debugText" with a test string
  console.log("Retrieved cached URL:", cachedUrl);
  const { setRefresh } = useStories(); //Fetched stories in Context API
  const [isStoryAdded, setIsStoryAdded] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Control modal visibility
  const [pageToDelete, setPageToDelete] = useState(null);
  const frontCoverFileRef = useRef([]);
  const [title, setTitle] = useState("");
  const [imageGenerated, setImageGenerated] = useState(false);
  const [author, setAuthor] = useState("");
  const [frontCover, setFrontCover] = useState("");
  const [temporaryComponent, setTemporaryComponent] = useState(null);

  const [generalErrorMessage, setGeneralErrorMessage] = useState(); // State for error message
  const updatePages = (updatedPages) => {
    setPages(updatedPages);
  };
  const CHARACTER_LIMIT = 300;

  const openSpeechToTextModal = (index) => {
    setCurrentPageIndex(index); // Track which page is being edited
    setIsModalVisible(true); // Open the modal
  };

  const closeSpeechToTextModal = () => {
    setIsModalVisible(false); // Close the modal
    setCurrentPageIndex(null); // Reset the current page index
  };

  const handleModalSubmit = (text) => {
    if (currentPageIndex !== null) {
      setPages((prevPages) => {
        const updatedPages = [...prevPages];
        updatedPages[currentPageIndex].text += ` ${text}`; // Append the text
        return updatedPages;
      });
    }
    closeSpeechToTextModal(); // Close the modal after submission
  };

  useEffect(() => {
    return () => {
      pages.forEach((page) => {
        if (page.mediaInstance) {
          page.mediaInstance.pause();
          page.mediaInstance = null;
        }
      });
    };
  }, []);

  const movePage = (pageIndex, direction) => {
    setPages((prevPages) => {
      const targetIndex = direction === "up" ? pageIndex - 1 : pageIndex + 1;

      // Ensure the target index is within bounds
      if (targetIndex < 0 || targetIndex >= prevPages.length) {
        return prevPages;
      }

      // Create a copy of the pages array
      const updatedPages = [...prevPages];

      // Swap the pages (explicitly handling all fields, including media)
      const temp = { ...updatedPages[pageIndex] }; // Temporarily store the current page
      updatedPages[pageIndex] = {
        ...updatedPages[targetIndex],
        page: pageIndex + 1, // Update page number
      };
      updatedPages[targetIndex] = {
        ...temp,
        page: targetIndex + 1, // Update page number
      };

      // Reset any file inputs if necessary
      if (imageFileRefs.current[pageIndex]) {
        imageFileRefs.current[pageIndex].value = null; // Reset file input for the current page
      }
      if (imageFileRefs.current[targetIndex]) {
        imageFileRefs.current[targetIndex].value = null; // Reset file input for the target page
      }

      // Reset any file inputs if necessary
      if (audioFileRefs.current[pageIndex]) {
        audioFileRefs.current[pageIndex].value = null; // Reset file input for the current page
      }
      if (audioFileRefs.current[targetIndex]) {
        audioFileRefs.current[targetIndex].value = null; // Reset file input for the target page
      }

      // Return the updated pages
      return updatedPages;
    });
  };

  useEffect(() => {
    if (generalErrorMessage && pagesContainerRef.current) {
      // Scroll to the bottom of the container when a general message is set
      pagesContainerRef.current.scrollTo({
        top: pagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [generalErrorMessage]);

  const [pages, setPages] = useState([
    {
      page: 1,
      text: "",
      image: null,
      mediaUrl: "",
      imageError: null,
      mediaUrlError: null,
      isGenerating: false, // Track if AI image is being generated
      imageGenerated: false,
    },
  ]);
  const [errors, setErrors] = useState({ INITIAL_ERRORS });
  const [limitReached, setLimitReached] = useState(false);
  const [beeSubmitMessage, setBeeSubmitMessage] = useState(
    "Submit your story ✨"
  );
  const navigate = useNavigate();
  const MAX_PAGES = 7;
  const pagesContainerRef = useRef(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (pages.length > 0) {
      const firstErrorField = document.querySelector(".error-highlight");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [pages, errors]);

  useEffect(() => {
    console.log("Pages updated:", pages);
  }, [pages]);

  const scrollToErrors = () => {
    const errorFields = document.querySelectorAll(".error-highlight");
    if (errorFields.length > 0) {
      errorFields.forEach((field, i) => {
        setTimeout(() => {
          field.scrollIntoView({ behavior: "smooth", block: "center" });
        }, i * 300); // Delay scrolling to avoid overlapping
      });
    }
  };

  // Call this during validation
  scrollToErrors();

  // Main Function to Handle Image Generation
  const handleImageGenerated = async (index, text) => {
    try {
      console.log("Starting image generation process...");
      console.log("Page Index:", index);
      console.log("Prompt Text:", text);

      // Step 1: Validate Text Input
      if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("Valid text is required for image generation.");
        return;
      }

      // Step 2: Reset Local Image and State
      console.log("Resetting local image...");
      updatePageState(index, {
        image: null, // Clear the existing image
        isGenerating: true,
        imageGenerated: false,
      });
      resetFileInput(index);

      // Step 3: Check Cache
      if (imageCache.has(text)) {
        console.log("Using cached image for text:", text);
        const cachedImageUrl = imageCache.get(text);

        // Update state with the cached image URL
        updatePageState(index, {
          image: cachedImageUrl,
          imageGenerated: true,
          isGenerating: false,
        });
        return;
      }

      // Step 4: Generate Image
      const generatedImageUrl = await generateImageWithTimeout(text);

      // Step 5: Cache Generated Image
      imageCache.set(text, generatedImageUrl);
      console.log("Generated image cached successfully:", generatedImageUrl);

      // Step 6: Upload and Save Image URL in Parallel
      console.log("Uploading Image...");
      const uploadedImageUrl = await uploadToCloudinary(
        generatedImageUrl,
        "Image"
      );

      // Step 7: Update State with Final Image URL
      updatePageState(index, {
        image: uploadedImageUrl,
        isGenerating: false,
        imageGenerated: true,
      });

      console.log("Image generation process completed successfully.");
    } catch (error) {
      console.error("Error during image generation process:", error);

      // Reset state on error
      updatePageState(index, { isGenerating: false });
      alert("An error occurred during image generation. Please try again.");
    }
  };

  // Utility Function to Reset File Input
  const resetFileInput = (index) => {
    if (imageFileRefs.current[index]) {
      imageFileRefs.current[index].value = ""; // Clear the file input field
    }
  };

  // Utility Function to Update Page State
  const updatePageState = (index, updates) => {
    setPages((prevPages) => {
      if (!prevPages[index]) {
        console.warn(`Page at index ${index} does not exist.`);
        return prevPages;
      }
      const updatedPages = [...prevPages];
      updatedPages[index] = { ...updatedPages[index], ...updates };
      return updatedPages;
    });
  };

  // Utility Function to Generate Image with Timeout
  const generateImageWithTimeout = (text) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Image generation timed out")),
        15000
      );

      setTemporaryComponent(
        <PollinationImage
          prompt={text}
          onComplete={(url) => {
            clearTimeout(timeout);
            if (!url) {
              const error = new Error(
                "Image generation failed: No URL returned."
              );
              reject(error);
              setTemporaryComponent(null); // Clean up component
              return;
            }
            resolve(url); // Resolve the promise with the image URL
            setTemporaryComponent(null); // Clean up component
          }}
          onError={(error) => {
            clearTimeout(timeout);
            reject(error);
            setTemporaryComponent(null); // Clean up component
          }}
        />
      );
    });
  };

  const addPage = () => {
    const currentPage = pages[pages.length - 1];
    if (!currentPage.text.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        pages: `Page ${currentPage.page} needs text.`,
      }));
      return;
    }

    if (pages.length < MAX_PAGES) {
      setPages((prevPages) => [
        ...prevPages,
        {
          page: prevPages.length + 1,
          text: "",
          image: null,
          mediaUrl: "",
          imageError: null,
          mediaUrlError: null,
          isGenerating: false, // Initialize generating state
          newlyAdded: true,
        },
      ]);
    }

    if (pages.length + 1 === MAX_PAGES) {
      setLimitReached(true);
    }
  };

  const deletePage = async (indexToDelete) => {
    try {
      // Ensure the page exists
      const pageToDelete = pages[indexToDelete];
      if (!pageToDelete) {
        console.error("Page to delete does not exist.");
        return;
      }

      // Ensure the page has an ID
      const pageId = pageToDelete.id;
      if (!pageId) {
        console.warn(
          "Page does not have an ID. Cannot delete from the backend."
        );
        // Remove locally and reindex if no ID
        setPages((prevPages) =>
          prevPages
            .filter((_, index) => index !== indexToDelete)
            .map((page, index) => ({
              ...page,
              page: index + 1,
            }))
        );
        return;
      }

      // Send DELETE request to backend
      console.log(`Attempting to delete page with ID: ${pageId}`);
      const response = await axios.delete(`${API_URL}/stories/${pageId}`);
      if (response.status === 200) {
        console.log("Page deleted successfully.");

        // Update local state after successful deletion
        setPages((prevPages) =>
          prevPages
            .filter((_, index) => index !== indexToDelete)
            .map((page, index) => ({
              ...page,
              page: index + 1, // Reindex pages
            }))
        );
      } else {
        console.error(`Failed to delete the page. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const handlePageTextChange = (value, index) => {
    if (!value) value = ""; // Ensure value is always a string

    let trimmedValue = value;
    if (value.length > CHARACTER_LIMIT) {
      trimmedValue = value.slice(0, CHARACTER_LIMIT); // Trim text to the character limit
      setErrors((prevErrors) => ({
        ...prevErrors,
        pages: `Page ${
          index + 1
        } exceeds the character limit of ${CHARACTER_LIMIT} characters. Extra text has been trimmed.`,
      }));
    } else {
      // Clear errors for this page if within the limit and text exists
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors.pages;
        return updatedErrors;
      });
    }

    const updatedPages = pages.map((page, i) =>
      i === index ? { ...page, text: trimmedValue } : page
    );

    updatePages(updatedPages);
  };

  const handleFileUpload = async (e, index, type) => {
    const file = e.target.files[0];
    if (!file) {
      // Handle case where no file is selected
      if (type === "image") {
        if (index === null) {
          setFrontCover("");
          setErrors((prevErrors) => ({
            ...prevErrors,
            frontCover:
              "Once you add a DoodleImage or upload an Image you are good here...",
          }));
        } else {
          setPages((prevPages) =>
            prevPages.map((page, i) =>
              i === index ? { ...page, image: null, imageError: null } : page
            )
          );
        }
      } else if (type === "audio") {
        setPages((prevPages) =>
          prevPages.map((page, i) =>
            i === index
              ? { ...page, mediaUrl: null, mediaUrlError: null }
              : page
          )
        );
      }
      return;
    }

    const validImageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i; // Only image formats
    const validAudioExtensions = /\.(mp3|mp4|wav|ogg)$/i; // Audio formats including mp4

    // Check for image file type
    if (type === "image") {
      // Check if the file type is invalid
      if (!validImageExtensions.test(file.name)) {
        // Handle invalid file type
        setPages((prevPages) =>
          prevPages.map((page, i) =>
            i === index
              ? {
                  ...page,
                  image: null, // Clear the image field
                  imageError:
                    "Error! Supported formats: .jpg, .jpeg, .png, .gif, .webp.",
                  isLoading: false, // Ensure no loading state
                }
              : page
          )
        );
        return; // Stop further processing
      }

      // Set loading state and clear previous errors
      setPages((prevPages) =>
        prevPages.map((page, i) =>
          i === index
            ? {
                ...page,
                image: null, // Clear the image field while uploading
                imageError: null, // Clear any previous error
                isLoading: true, // Indicate upload in progress
              }
            : page
        )
      );

      try {
        // Upload the image to Cloudinary
        console.log("Uploading Image...");
        const uploadedUrl = await uploadToCloudinary(file, "Image"); // Upload to Cloudinary

        if (uploadedUrl) {
          // Update the state with the uploaded image
          setPages((prevPages) =>
            prevPages.map((page, i) =>
              i === index
                ? {
                    ...page,
                    image: uploadedUrl, // Set the uploaded image URL
                    imageError: null, // Clear any previous error
                    isLoading: false, // Clear loading state
                  }
                : page
            )
          );
        }
      } catch (error) {
        console.error("File upload failed:", error);

        // Set error state on failure
        setPages((prevPages) =>
          prevPages.map((page, i) =>
            i === index
              ? {
                  ...page,
                  image: null, // Clear the image field on failure
                  imageError: "Failed to upload image. Please try again.", // Set error message
                  isLoading: false, // Clear loading state
                }
              : page
          )
        );
      }
    }

    // Check for audio file type
    if (type === "audio") {
      if (!validAudioExtensions.test(file.name)) {
        setPages((prevPages) =>
          prevPages.map((page, i) =>
            i === index
              ? {
                  ...page,
                  mediaUrl: null,
                  mediaUrlError:
                    "Error!. Supported formats: .mp3, .mp4, .wav, .ogg.",
                }
              : page
          )
        );
        return; // Exit the function to prevent further processing
      }
    }

    // Proceed with file upload if the file type is valid
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "StoryEchoes");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dhxwg8gcz/upload",
        formData
      );

      if (response.data.secure_url) {
        const uploadedUrl = response.data.secure_url;

        if (type === "image") {
          if (index === null) {
            setFrontCover(uploadedUrl);
            setErrors((prevErrors) => {
              const updatedErrors = { ...prevErrors };
              delete updatedErrors.frontCover;
              return updatedErrors;
            });
          } else {
            setPages((prevPages) =>
              prevPages.map((page, i) =>
                i === index
                  ? { ...page, image: uploadedUrl, imageError: null }
                  : page
              )
            );
          }
        } else if (type === "audio") {
          setPages((prevPages) =>
            prevPages.map((page, i) =>
              i === index
                ? { ...page, mediaUrl: uploadedUrl, mediaUrlError: null }
                : page
            )
          );
        }
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("An error occurred while uploading. Please try again.");
    }
  };

  //Scroll for general page message.
  useEffect(() => {
    if (generalErrorMessage) {
      const errorMessageContainer = document.querySelector(
        ".general-error-message"
      );
      if (errorMessageContainer) {
        errorMessageContainer.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [generalErrorMessage]);

  const validate = () => {
    const newErrors = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Every story needs a title! ✨";
    }

    // Validate author
    if (!author.trim()) {
      newErrors.author = "Who is the storyteller? Add your name! 📖";
    }

    // Validate front cover
    if (!frontCover || frontCover.trim() === "") {
      newErrors.frontCover =
        "Once you add a Doodle Image or upload an Image, you are good here...";
    }

    // Validate all pages
    const emptyPages = pages
      .map((page, index) => ({
        pageNumber: index + 1,
        hasText: page.text.trim() !== "",
      }))
      .filter((page) => !page.hasText); // Filter out pages without text

    // General error message for multiple empty pages
    if (emptyPages.length > 1) {
      const pageNumbers = emptyPages.map((p) => p.pageNumber).join(", ");
      setGeneralErrorMessage(`The following pages need text: ${pageNumbers}.`); // General message
    } else {
      setGeneralErrorMessage(""); // Clear general message if fewer than 2 empty pages
    }

    // Specific error message for a single empty page
    if (emptyPages.length === 1) {
      newErrors.pages = `Page ${emptyPages[0].pageNumber} needs text.`; // Specific page error
    }

    // Add a combined general error message to newErrors if multiple pages are empty
    if (emptyPages.length > 0) {
      newErrors.general =
        "Some pages are missing content. Please review all pages to ensure they have text.";
    }

    // Validate character limit
    const CHARACTER_LIMIT = 300; // Define your character limit
    const limitExceededPages = pages.filter(
      (page) => page.text.length > CHARACTER_LIMIT
    );

    if (limitExceededPages.length > 0) {
      const pageNumbers = limitExceededPages
        .map((_, index) => index + 1)
        .join(", ");
      newErrors.characterLimit = `The following pages exceed the character limit of ${CHARACTER_LIMIT} characters:
      ${pageNumbers}.`;
    }

    // Log errors and prevent submission if errors exist
    if (Object.keys(newErrors).length > 0) {
      console.error("Validation failed with the following errors:", newErrors);
    }

    setErrors(newErrors);

    // Return false if there are any errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate and ensure submission stops if errors exist
    if (!validate()) {
      console.error("Submission blocked due to validation errors.");
      return;
    }

    if (generalErrorMessage) {
      console.error("Cannot submit: unresolved errors exist.");
      return; // Stop submission if general errors exist
    }

    // Prepare the story object for submission
    const story = {
      title,
      author,
      front_cover: frontCover || FallbackImage,
      content: pages.map((page) => ({
        ...page,
        image: page.image || FallbackImage,
        mediaUrl: page.mediaUrl || null,
      })),
    };

    try {
      // POST request to save the story
      const response = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      });

      if (response.ok) {
        const responseData = await response.json();

        // Set success message and navigate to the story read page
        setBeeSubmitMessage(
          "🐝 Hooray! Your story has been submitted successfully!"
        );
        setIsStoryAdded(true);
        //Indicate Context API for refresh
        setRefresh((prev) => prev + 1);

        setTimeout(() => {
          navigate(
            `/readStory/${
              responseData._id ? responseData._id : responseData.id
            }?state=new`
          );
        }, 2000);
      } else {
        // Handle server errors
        console.error("Failed to submit story. Server returned an error.");
        alert("Failed to submit your story. Please try again.");
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Error submitting story:", error);
      alert("Error submitting story. Please try again.");
    }
  };

  return (
    <div className="story-creator">
      <h1 className="add-story-header">Create Your Magical Adventure</h1>
      <div className="story-container">
        <form className="story-form">
          {/* Title, Author and Front Cover Fields*/}
          <BookCoverFields
            title={title}
            setTitle={setTitle}
            author={author}
            setAuthor={setAuthor}
            frontCoverFileRef={frontCoverFileRef}
            handleFileUpload={handleFileUpload}
            setFrontCover={setFrontCover}
            frontCover={frontCover}
            validate={validate}
            errors={errors}
            setErrors={setErrors}
            mode={"add"}
          ></BookCoverFields>

          <div className="row">
            <div className="form-group">
              {/* Story Content Label */}
              <label>Story Content</label>
            </div>
          </div>

          {/* Pages Section */}
          <div ref={pagesContainerRef} className="pages-container">
            {pages.map((page, index) => (
              <div key={index} className="page-input-group">
                {/* Page Number Below the Thick Line */}

                {page.page > 1 ? (
                  <h3>--------- Page {page.page} ---------</h3>
                ) : (
                  <h3>--------- Page {page.page} ---------</h3>
                )}
                {pages.map((page, index) => (
                  <div
                    key={index}
                    className={`page ${
                      errors.pages?.includes(`Page ${page.page}`)
                        ? "error-highlight"
                        : ""
                    }`}
                  ></div>
                ))}

                {/* Text Area & Image */}
                <StoryTextImageFields
                  page={page}
                  pages={pages}
                  index={index}
                  handlePageTextChange={handlePageTextChange}
                  temporaryComponent={temporaryComponent}
                  mode={"add"}
                  isModalVisible={isModalVisible}
                  openSpeechToTextModal={openSpeechToTextModal}
                  closeSpeechToTextModal={closeSpeechToTextModal}
                  handleModalSubmit={handleModalSubmit}
                  currentPageIndex={currentPageIndex}
                  errors={errors}
                />

                {/* Image Button Area */}
                <StoryImageButtons
                  page={page}
                  index={index}
                  imageFileRefs={imageFileRefs}
                  handleFileUpload={handleFileUpload}
                  handleImageGenerated={handleImageGenerated}
                />

                {/* Media Area */}
                <StoryContentMediaFields
                  page={page}
                  index={index}
                  audioFileRefs={audioFileRefs}
                  handleFileUpload={handleFileUpload}
                />

                {/* Page Buttons for Add Move & Delete */}
                <PageButtons
                  page={page}
                  pages={pages}
                  index={index}
                  addPage={addPage}
                  movePage={movePage}
                  deletePage={deletePage}
                />
              </div>
            ))}

            {limitReached && (
              <div className="limit-message">
                🎉 You’ve reached the maximum of 7 pages. Time to wrap up your
                story! 🦄
              </div>
            )}
          </div>

          {/* General Error Message */}
          {generalErrorMessage && (
            <div
              style={{
                color: "Magenta",
                fontFamily: "Comic Neuve, cursive",
                fontSize: "20px",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              {generalErrorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="honey-bee-message" onClick={handleSubmit}>
            {beeSubmitMessage}
          </div>
        </form>
      </div>{" "}
    </div>
  );
};

export default AddStory;
