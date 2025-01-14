import React, { useRef, useState, useEffect } from "react";

// Helper to convert Data URL to Blob
const dataURLToBlob = (dataUrl) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const Doodle = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const saveDoodle = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const blob = dataURLToBlob(dataUrl);
    onSave(blob); // Pass the Blob back to the parent
    onClose(); // Close the modal
  };

  // Set the canvas background color when the component opens
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#d4f8e8"; // Light green background
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
      ctx.strokeStyle = "black"; // Set the default stroke color
      ctx.lineWidth = 2; // Set the stroke width
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="doodle-modal">
        <h2>Draw Your Doodle</h2>
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          style={{
            border: "1px solid black",
            cursor: "crosshair",
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={onClose} // This now calls the `onClose` method to close the modal
            className="modal-button"
            style={{ backgroundColor: "#f44336" }}
          >
            Cancel
          </button>
          <button
            onClick={saveDoodle}
            className="modal-button"
            style={{ backgroundColor: "#4CAF50" }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Doodle;
