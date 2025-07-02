import React from "react";
const FileViewer = ({ mimeType, base64 ,fileName}) => {
  const dataUrl = `data:${mimeType};base64,${base64}`;
  if (mimeType.startsWith("image/")) {
    return (
        <div>
             <p>   Click here to download the File  <a href={dataUrl} download={fileName} style={{ marginBottom: "10px", display: "inline-block" }}>
   ⬇️ Download 
</a></p>
      <img
        src={dataUrl}
        alt="Uploaded file"
        style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px" }}
      />
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return (
        <div style={{ width: "100%", height: "800px", overflow: "hidden" }}>
      <p>   Click here to download the file  <a href={dataUrl} download={fileName} style={{ marginBottom: "10px", display: "inline-block" }}>
   ⬇️ Download 
</a></p>

      <object
        data={dataUrl}
        type="application/pdf"
        width="100%"
        height="100%"
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
      >
        <p>Your browser does not support PDFs. Please <a href={dataUrl} download={fileName}>download the PDF</a>.</p>
      </object>
      
    </div>
    );
  }
  if (mimeType.startsWith("video/")) {
    return (
        <div >
            <p>   Click here to download the File  <a href={dataUrl} download={fileName} style={{ marginBottom: "10px", display: "inline-block" }}>
   ⬇️ Download 
</a></p>
      <video
        controls
        style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px" }}
      >
        <source src={dataUrl} type={mimeType} />
        Your browser does not support the video tag.
        <a href={dataUrl} download={fileName} >
        ⬇️ Download file
</a>
      </video>
      </div>
    );
  }

  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "text/csv"
  ) {
    const decoded = atob(base64); // Decode Base64 to text
    return (
        <div>
            <p>   Click here to download the File  <a href={dataUrl} download={fileName} style={{ marginBottom: "10px", display: "inline-block" }}>
   ⬇️ Download 
</a></p>
      <pre
        style={{
          backgroundColor: "#f9f9f9",
          padding: "10px",
          borderRadius: "8px",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {decoded}
      </pre>
      </div>
    );
  }

  // Fallback for unsupported formats
  return (
    <p>  Your browser does not support viewing  "{mimeType}" file 
    <a
      href={dataUrl}
      download={fileName}
      rel="noopener noreferrer"
     
    >
    ⬇️ Download file
    </a>
    </p>
  );
};

export default FileViewer;
