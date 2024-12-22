import axios from "axios";

// Function to upload on Couldinary
export const uploadToCloudinary = async (blob, content) => {
  const formData = new FormData();
  formData.append("file", blob); // Append the Blob
  formData.append("upload_preset", "StoryEchoes"); // Your Cloudinary upload preset

  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dhxwg8gcz/upload", // Replace with your Cloudinary URL
      formData
    );
    console.log("Cloudinary Response:", response.data);
    return response.data.secure_url; // Return the uploaded image URL
  } catch (error) {
    console.error("Cloudinary upload failed:", error.response || error.message);
    throw new Error(`Failed to upload ${content}.`);
  }
};
