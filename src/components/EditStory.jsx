import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EditStory.css";
import FallbackImage from "../assets/fallback.jpg";
import PollinationImage from "./PollinationImage"; // Import the PollinationImage component
import axios from "axios";
import { API_URL } from "../config/apiConfig.js";
import { useStories } from "../contexts/stories.context.jsx";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import BookCoverFields from "./BookCoverFields.jsx";
import StoryTextImageFields from "./StoryTextImageFields.jsx";

const EditStory = () => {
  const { id } = useParams();
  const imageFileRefs = useRef([]);
  const frontCoverFileRef = useRef([]);
  const imageCache = new Map(); // Cache to store prompt-image mappings
  const cachedUrl = imageCache.get("debugText"); // Replace "debugText" with a test string
  console.log("Retrieved cached URL:", cachedUrl);
  const audioFileRefs = useRef([]);
  const navigate = useNavigate();
  const pagesContainerRef = useRef(null);
  const { setRefresh } = useStories(); //Fetched stories in Context API
  const [temporaryComponent, setTemporaryComponent] = useState(null);
  const [generalErrorMessage, setGeneralErrorMessage] = useState(); // State for error message
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [frontCover, setFrontCover] = useState("");
  const [pages, setPages] = useState([
    {
      page: 1,
      text: "",
      image: null,
      audio: null,
      imageFileName: "", // Track image file name
      audioFileName: "", // Track audio file name
      mediaUrl: "",
      imageError: null,
      audioError: null,
      mediaUrlError: null,
      isPlaying: false, // Track audio playing state
      audioInstance: null, // Store audio instance
      isGenerating: false, // Track if AI image is being generated
      imageGenerated: false,
    },
  ]);
  const [errors, setErrors] = useState({});
  const [beeMessage, setBeeMessage] = useState(
    "🐝 Bzz... Click me & save your edited magical adventure. ✨"
  );
  const [limitReached, setLimitReached] = useState(false); // Track if max pages limit is reached
  const fileInputRefs = useRef([]); // Create a ref array for file inputs
  // State for tracking transcription statuses per page
  const [transcriptionStatuses, setTranscriptionStatuses] = useState({});
  const MAX_PAGES = 7;
  const CHARACTER_LIMIT = 300; // Define your character limit

  // Function to scroll to the first error field
  const scrollToError = () => {
    const firstErrorField = document.querySelector(".error-highlight");
    if (firstErrorField) {
      firstErrorField.scrollIntoView({
        behavior: "smooth", // Smooth scrolling
        block: "center", // Center the field vertically
      });
    }
  };

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

  useEffect(() => {
    if (generalErrorMessage && pagesContainerRef.current) {
      // Scroll to the bottom of the container when a general message is set
      pagesContainerRef.current.scrollTo({
        top: pagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [generalErrorMessage]);

  // Fetch the story details from the API
  useEffect(() => {
    const fetchStory = async () => {
      try {
        setBeeMessage("🐝 Loading your story...");
        const response = await fetch(`${API_URL}/stories/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch story. Status: ${response.status}`);
        }
        const data = await response.json();

        setTitle(data.title || "Untitled Story");
        setAuthor(data.author || "Unknown Author");
        setFrontCover(data.front_cover || FallbackImage);
        setPages(data.content || []);
        if (data.content.length === MAX_PAGES) {
          setLimitReached(true);
        }

        // Initialize transcription statuses for each page as 'Idle'
        const initialStatuses = {};
        data.content.forEach((_, index) => {
          initialStatuses[index] = "Idle"; // Set initial status for each page as 'Idle'
        });
        setTranscriptionStatuses(initialStatuses);

        setBeeMessage(
          "🐝 Bzz... Click me & save your edited magical adventure. ✨"
        );
      } catch (error) {
        console.error("Error fetching story:", error);
        setBeeMessage("🐝 Oops! Couldn't load your story. Try again later.");
      }
    };

    if (id) {
      fetchStory();
    }
  }, [id]);

  // Update text for a specific page
  const handlePageTextChange = (value, index) => {
    // Trim the text if it exceeds the CHARACTER_LIMIT
    const trimmedValue =
      value.length > CHARACTER_LIMIT ? value.slice(0, CHARACTER_LIMIT) : value;

    const updatedPages = pages.map((page, i) =>
      i === index ? { ...page, text: trimmedValue } : page
    );
    setPages(updatedPages);

    // Set error if the character limit is exceeded
    if (value.length > CHARACTER_LIMIT) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        pages: `Page ${
          index + 1
        } exceeds the character limit of ${CHARACTER_LIMIT} characters. Extra text has been trimmed.`,
      }));
    } else if (value.trim()) {
      // Clear errors for this page if within the limit and text exists
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors.pages;
        return updatedErrors;
      });
    }

    // Validate for empty text
    if (trimmedValue.trim()) {
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[`page-${index}-text`]; // Remove error for this page
        return updatedErrors;
      });
    } else {
      // Revalidate the error if the field is empty again
      setErrors((prevErrors) => ({
        ...prevErrors,
        [`page-${index}-text`]: `Oops! Page ${
          index + 1
        } is missing content! Story Content cannot be empty! ✍️`,
      }));
    }
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
              "Once you add a DoodleImage or upload an Image you are good here...!",
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
            i === index ? { ...page, audio: null, audioError: null } : page
          )
        );
      }
      return;
    }
    const uploadAudioToCloudinary = async (audioFile) => {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("upload_preset", "your_upload_preset"); // Replace with your Cloudinary upload preset

      try {
        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/your_cloud_name/video/upload",
          formData
        );
        return response.data.secure_url; // Return the URL of the uploaded audio
      } catch (error) {
        console.error("Error uploading audio:", error);
        throw new Error("Audio upload failed");
      }
    };
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

      // Upload the image to Cloudinary
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
                  audio: null,
                  audioError:
                    "Invalid File. Supported formats: .mp3, .mp4, .wav, .ogg.",
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
                ? { ...page, audio: uploadedUrl, audioError: null }
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

  // Validate form before submission
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

    // // Validate media or image for each page
    // pages.forEach((page, index) => {
    // if (!page.mediaUrl?.trim() && !page.image) {
    // newErrors[`page${index + 1}`] = `Page ${
    // index + 1
    // } requires either an image or a media URL.`;
    // }
    // });

    // Validate character limit
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
          audio: null,
          mediaUrl: "",
          imageError: null,
          audioError: null,
          mediaUrlError: null,
          isPlaying: false, // Initialize playing state
          audioInstance: null, // Initialize audio instance
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
        setLimitReached(false);

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
  // Front Cover Change Handler
  const handleFrontCoverChange = (e) => {
    const value = e.target.value;
    setFrontCover(value);

    // Validate URL
    const isValidURL = (url) => {
      const regex =
        /^(https?:\/\/.*\.(?:jpg|jpeg|png|gif|bmp|svg|webp))$|^(.*\.(?:jpg|jpeg|png|gif|bmp|svg|webp))$/i;
      if (!regex.test(url)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          frontCover:
            "Oops! Please enter a valid image URL for the front cover. 🖼️",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          frontCover: "",
        }));
      }
    };

    if (value.trim()) {
      isValidURL(value);
    }
  };

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
      const [uploadedImageUrl] = await Promise.all([
        uploadImageToCloudinary(generatedImageUrl),
        saveImageUrlToDatabase(generatedImageUrl),
      ]);
      console.log(
        "Image uploaded successfully to Cloudinary:",
        uploadedImageUrl
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
  const uploadImageToCloudinary = async (imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "StoryEchoes");

    console.time("Cloudinary API Call");
    try {
      console.log("Uploading image to Cloudinary...");
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dhxwg8gcz/upload",
        formData
      );
      console.log("Cloudinary response:", response.data);
      console.timeEnd("Cloudinary API Call");
      return response.data.secure_url; // Return the URL of the uploaded image
    } catch (error) {
      console.error("Error during Cloudinary upload:", error);
      console.timeEnd("Cloudinary API Call");
      throw new Error("Image upload failed");
    }
  };

  const saveImageUrlToDatabase = async (imageUrl, index) => {
    const storyId = "your_story_id";
    const pageData = {
      page: index,
      image: imageUrl,
      storyId: storyId,
    };

    console.time("Database API Call");
    try {
      console.log("Sending image data to the database...");
      const response = await axios.post(`${API_URL}/stories`, pageData);
      if (response.status === 201) {
        console.log("Image URL saved successfully:", response.data);
      } else {
        console.error("Database responded with an error:", response);
      }
      console.timeEnd("Database API Call");
    } catch (error) {
      console.error("Error during database save:", error);
      console.timeEnd("Database API Call");
      throw new Error("Database save failed");
    }
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
        audio: page.audio || null, // Include audio if present
        mediaUrl: page.mediaUrl || null,
      })),
    };

    try {
      setBeeMessage("🐝 Saving your edits...");
      const response = await fetch(`${API_URL}/stories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      });

      if (response.ok) {
        setBeeMessage("Awesome! Your story has been saved! 🚀");
        //Indicate Context API for refresh
        setRefresh((prev) => prev + 1);
        setTimeout(() => {
          navigate(`/readStory/${id}`);
        }, 2000);
      } else {
        setBeeMessage("🐝 Oh no! Couldn't save your story. Try again.");
      }
    } catch (error) {
      console.error("Error saving story:", error);
      setBeeMessage("🐝 Something went wrong. Please try again.");
    }
  };

  const toggleAudio = (index) => {
    const updatedPages = [...pages];
    const page = updatedPages[index];

    if (page.audioInstance) {
      // If audio is already playing, pause it
      page.audioInstance.pause();
      page.audioInstance = null; // Reset audio instance
    } else {
      // Create a new audio instance and play it
      const audio = new Audio(page.audio); // Use `page.audio` instead of `page.mediaUrl` if needed
      audio.play();
      updatedPages[index].audioInstance = audio; // Store the audio instance
    }

    // Update the playing state
    updatedPages[index] = { ...page, isPlaying: !page.isPlaying };
    setPages(updatedPages);
  };

  const toggleMediaPlay = (index) => {
    const updatedPages = [...pages];
    const page = updatedPages[index];

    if (page.mediaInstance) {
      // If media is already playing, pause it
      page.mediaInstance.pause();
      page.mediaInstance = null; // Reset the media instance
    } else {
      try {
        // Check if media URL is valid and create a new Audio instance
        const media = new Audio(page.mediaUrl);
        media.play();
        page.mediaInstance = media; // Store the media instance

        // Set mediaPlaying to false when the media ends
        media.onended = () => {
          setPages((prevPages) =>
            prevPages.map((p, i) =>
              i === index ? { ...p, isPlaying: false, mediaInstance: null } : p
            )
          );
        };
      } catch (error) {
        console.error("Error playing media:", error);
        return;
      }
    }

    // Toggle playing state
    updatedPages[index] = { ...page, isPlaying: !page.isPlaying };
    setPages(updatedPages);
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

  return (
    <div>
      <h1 className="add-story-header">Weave in your edited Magical Story</h1>
      <div className="story-container">
        <form
          className="story-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
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
            mode={"edit"}
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
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "'Bubblegum Sans', cursive",
                  }}
                ></div>
                {page.page > 1 ? (
                  <h3>--------- Page {page.page} ---------</h3>
                ) : (
                  <h3 style={{ fontFamily: "Bubblegum Sans", marginTop: "0" }}>
                    --------- Page {page.page} ---------
                  </h3>
                )}

                {/* Text Area & Image */}
                <StoryTextImageFields
                  page={page}
                  pages={pages}
                  index={index}
                  handlePageTextChange={handlePageTextChange}
                  temporaryComponent={temporaryComponent}
                  errors={errors}
                ></StoryTextImageFields>

                {/* Image Button Area */}
                <div
                  className="page-image-buttons"
                  style={{ marginTop: "10px" }}
                >
                  {/* File Upload for Image */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => (imageFileRefs.current[index] = el)} // Assign ref to the input
                    onChange={(e) => handleFileUpload(e, index, "image")}
                    className="image-field"
                    style={{ width: "40%", maxHeight: "37px" }}
                  />

                  {page.text.trim() && (
                    <div>
                      {" "}
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
                            backgroundColor: page.isGenerating
                              ? "white"
                              : "darkblue",
                            color: "Magenta",
                            fontfamily: "Bubblegum San",
                            fontWeight: "bold",
                            cursor: page.isGenerating
                              ? "not-allowed"
                              : "pointer",
                            border: "none",
                            borderRadius: "5px",
                            height: "35px",
                            fontSize: "0.8em",
                          }}
                        >
                          {page.isGenerating
                            ? "Generating..."
                            : "Generate Image"}
                        </button>
                      </OverlayTrigger>
                    </div>
                  )}
                </div>

                {/* Media Area */}
                <div className="audio-input-container">
                  {/* Audio File Input */}
                  <input
                    type="file"
                    accept="audio/*"
                    ref={(el) => (audioFileRefs.current[index] = el)} // Assign ref to the input
                    onChange={(e) => handleFileUpload(e, index, "audio")}
                    className="media-field"
                    style={{
                      width: "40%",
                      maxHeight: "35px",
                      marginRight: "535px",
                      backgroundColor: page.audio ? "lightgreen" : "white", // Greyed out if media URL is provided
                      opacity: page.mediaUrl ? 0.5 : 1, // Adjust opacity
                    }}
                  />
                  {page.audioError && (
                    <span
                      className="error"
                      style={{
                        fontFamily: "Comic Neuve, cursive",
                        fontSize: "0.75em",
                      }}
                    >
                      {page.audioError}
                    </span>
                  )}

                  <div
                    style={{
                      alignSelf: "flex-start",
                    }}
                  >
                    {/* Play/Pause Button for Audio */}
                    {page.audio && !page.audioError && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id="play-audio-tooltip">
                            Play the audio
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleAudio(index)}
                          className="add-edit-story-buttons"
                          style={{
                            backgroundColor: "transparent",
                            padding: "5px 0 0 10px",
                            transform: "translate(-220%, -115%)",
                            border: "none",
                          }}
                        >
                          {page.isPlaying ? "⏸️" : "▶️"}
                        </button>
                      </OverlayTrigger>
                    )}
                  </div>
                </div>
                <div
                  className="page-buttons"
                  style={{ display: "flex", gap: "10px" }}
                >
                  {/* Add Page Button (only on the last page and if limit not reached) */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    {" "}
                  </div>

                  <div
                    style={{
                      width: "33%",
                      display: "flex",
                      justifyContent: "flex-start",
                    }}
                  >
                    {index < MAX_PAGES - 1 && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id="add-page-tooltip">
                            Add a new story page
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          onClick={addPage}
                          className="add-edit-story-buttons"
                          style={{
                            fontFamily: "Bubblegum San",
                            color: "Magenta",
                            backgroundColor: "darkblue",
                            fontWeight: "bold",
                            border: "none",
                            borderRadius: "5px",
                            height: "35px",
                            fontSize: "0.8em",
                          }}
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
                          <Tooltip id="move-page-up-tooltip">
                            Re-order the page up
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => movePage(index, "up")}
                          className="add-edit-story-buttons"
                          style={{
                            backgroundColor: "transparent",
                            padding: "0px",
                            border: "none",
                          }}
                        >
                          ⬆️
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
                          className="add-edit-story-buttons"
                          style={{
                            backgroundColor: "transparent",
                            padding: "0px",
                            border: "none",
                          }}
                        >
                          ⬇️
                        </button>
                      </OverlayTrigger>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div
                    style={{
                      width: "33%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    {page.page >= 2 && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id="delete-page-tooltip">
                            Delete the story page
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => deletePage(index)}
                          className="add-edit-story-buttons"
                          style={{
                            fontFamily: "Bubblegum San",
                            color: "Magenta",
                            backgroundColor: "darkblue",
                            fontWeight: "bold",
                            border: "none",
                            borderRadius: "5px",
                            height: "35px",
                            fontSize: "0.8em",
                          }}
                        >
                          - Delete
                        </button>
                      </OverlayTrigger>
                    )}
                  </div>
                </div>
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
          <div
            className="honey-bee-message"
            onClick={handleSubmit}
            style={{
              cursor: "pointer",
              fontFamily: "Comic Neuve, cursive",
              fontSize: "1em", // Increased font size
              textAlign: "center",
              marginTop: "10px",
              borderRadius: "10px",
              backgroundColor: "darkblue",

              border: "2px solid #28c4ac",
              padding: "2px 5px",
            }}
          >
            {beeMessage}
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditStory;
