import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
const UploadVideo = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const { courseId, courseName } = useParams();
  const token = sessionStorage.getItem("token");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState("video");
  const [videodata, setvideodata] = useState({
    Lessontitle: "",
    LessonDescription: "",
    fileUrl: "",
    thumbnail: null,
    videoFile: null,
    documentContent: [],
    base64Image: null,
    normalurl: "",
  });

  const [errors, setErrors] = useState({
    Lessontitle: "",
    LessonDescription: "",
    fileUrl: "",
    thumbnail: "",
    videoFile: "",
    documentContent: "",
    base64Image: "",
    normalurl: "",
  });
  const handleDocChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint", // For .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // For .pptx
    ];
    if (file && allowedTypes.includes(file.type)) {
      setvideodata((prevData) => ({
        ...prevData,
        documentContent: [...(prevData.documentContent || []), file], // Store the actual file, not an object
      }));
    } else {
     MySwal.fire({
                        toast:true,
                  position: 'top-end', 
                  icon: 'warning',
                  title: 'Only PDF or PPT files arre allowed',
                  showConfirmButton: false,
                  timer: 3000,
                  timerProgressBar: true,
                  didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                  }
                });
      // Optionally, clear the input if invalid
      e.target.value = null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = "";
    switch (name) {
      case "Lessontitle":
        error = value.length < 1 
        ? "Please enter a lesson Title" : value.length > 50 
        ? "Lesson Title should not exceed 50 characters" 
        :(value.includes("/") || value.includes("\\"))
            ?  "Lesson Title should not contain the '/' or '\' character"
        : "";
        setvideodata({ ...videodata, [name]: value });
        break;
      case "LessonDescription":
        error = value.length < 1 
        ? "Please enter a Lesson Descriptio " : value.length > 1000
        ? "Lesson Description should not exceed 1000 characters" 
        : "";
        setvideodata({ ...videodata, [name]: value });
        break;
      case "normalurl":
        const updatedData = { ...videodata, [name]: value }; // Update normalurl

        const match = value.match(
          /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
        );
        let extractedId;

        if (match) {
          extractedId = match[1];
          const embedUrl = `https://www.youtube.com/embed/${extractedId}`;

          // Combine both normalurl and fileUrl updates in one setvideodata
          setvideodata({ ...updatedData, fileUrl: embedUrl });
         
        } else {
          setvideodata(updatedData); // Ensure the normalurl is still updated even if the match fails
          error = "Invalid YouTube URL. Please provide a valid URL.";
        }
        break;

      default:
        break;
    }
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const handleFileChange = (e) => {
    const { name, value } = e.target;
    const file = e.target.files[0];

    // Update formData with the new file
    setvideodata((prevVideodata) => ({ ...prevVideodata, [name]: file }));
    if (name === "thumbnail") {
      // Convert the file to base64
      convertImageToBase64(file)
        .then((base64Data) => {
          // Set the base64 encoded image in the state
          setvideodata((prevVideodata) => ({
            ...prevVideodata,
            base64Image: base64Data,
          }));
        })
        .catch((error) => {
          console.error("Error converting image to base64:", error);
        });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasErrors = false;
   
    // List of fields to check for required validation
    const requiredFields = [
      { field: 'Lessontitle', errorMessage: 'This field is required' },
      { field: 'LessonDescription', errorMessage: 'This field is required' },
    ];
  
    // Check for required fields and set errors if necessary
    requiredFields.forEach(({ field, errorMessage }) => {
      console.log("in requiredfield")
      if (!videodata[field]?.trim() ) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: errorMessage
        }));
        hasErrors = true;
      }
    });
  
    // Check if there are any existing errors in the `errors` state using forEach
    Object.keys(errors).forEach((field) => {
      if (errors[field]) {
        hasErrors = true;
      }
    });
  
    if (hasErrors) {
      return; // Early return if there are any errors
    }
    if(
      (!videodata.videoFile && !videodata.fileUrl)
    ) {
        MySwal.fire({
                          toast:true,
                    position: 'top-end', 
                    icon: 'warning',
                    title: 'either video or Youtube Url must be provided',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.addEventListener('mouseenter', Swal.stopTimer);
                      toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                  });
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append("Lessontitle", videodata.Lessontitle.trim());
    formDataToSend.append("LessonDescription", videodata.LessonDescription);
    formDataToSend.append("thumbnail", videodata.thumbnail);
    if (videodata.documentContent && videodata.documentContent.length > 0) {
      videodata.documentContent.forEach((doc, index) => {
        formDataToSend.append("documentContent", doc); // Ensure each document is appended properly
      });
    }
    if (uploadType === "video") {
      formDataToSend.append("videoFile", videodata.videoFile);
      formDataToSend.append("fileUrl", null);
    } else {
      formDataToSend.append("fileUrl", videodata.fileUrl);
      formDataToSend.append("videoFile", null);
    }
  
    try {
      const response = await axios.post(
        `${baseUrl}/lessons/save/${courseId}`,
        formDataToSend,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setIsSubmitting(false);
      if (response.status === 200) {
        setvideodata({
          Lessontitle: "",
          LessonDescription: "",
          fileUrl: "",
          normalurl: "",
          thumbnail: null,
          documentContent: [],
          videoFile: null,
          base64Image: null,
        });
        setSelectedFile("");

        MySwal.fire({
          title: "video added",
          text: "Video added sucessfully !",
          icon: "success",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = `/lessonList/${courseName}/${courseId}`;
          }
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      if (error.response && error.response.status === 413) {
        MySwal.fire({
          title: "Storage Limit Exceeded",
          text: error.response.data,
          icon: "warning",
        });
      } else {
        // Handle network errors or other exceptions
        // MySwal.fire({
        //   title: "Error!",
        //   text: "Some Unexpected Error occured . Please try again ....later.",
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error
      }
    }
  };
  const handleRemoveDoc = (indexToRemove) => {
    const updatedDocs = videodata.documentContent.filter(
      (doc, index) => index !== indexToRemove
    );
    // Update the state to remove the file
    setvideodata({ ...videodata, documentContent: updatedDocs });
  };

  const handleDocDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint", // For .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // For .pptx
    ];
    if (file && allowedTypes.includes(file.type)) {
      setvideodata((prevData) => ({
        ...prevData,
        documentContent: [...(prevData.documentContent || []), file], // Store the actual file, not an object
      }));
    } else {
    MySwal.fire({
                       toast:true,
                 position: 'top-end', 
                 icon: 'warning',
                 title: 'Only PDF or PPT files arre allowed',
                 showConfirmButton: false,
                 timer: 3000,
                 timerProgressBar: true,
                 didOpen: (toast) => {
                   toast.addEventListener('mouseenter', Swal.stopTimer);
                   toast.addEventListener('mouseleave', Swal.resumeTimer);
                 }
               });
      // Optionally, clear the input if invalid
      e.target.value = null;
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.includes("video")) {
      setSelectedFile(file);
    } else {
     MySwal.fire({
                          toast:true,
                    position: 'top-end', 
                    icon: 'warning',
                    title: 'Please Select a video File',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.addEventListener('mouseenter', Swal.stopTimer);
                      toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                  });
    }
  };
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    const maxSize = 1024 * 1024 * 1024; // 1 GB in bytes

    if (file && file.size > maxSize) {
        MySwal.fire({
                          toast:true,
                    position: 'top-end', 
                    icon: 'warning',
                    title: 'File Size Exceeds 1 GB limit',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.addEventListener('mouseenter', Swal.stopTimer);
                      toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                  });
    } else if (file.type.includes("video")) {
      setSelectedFile(file);
      setvideodata({ ...videodata, videoFile: file, fileUrl: "" });
    } else {
       MySwal.fire({
                          toast:true,
                    position: 'top-end', 
                    icon: 'warning',
                    title: 'Please Select a video File',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.addEventListener('mouseenter', Swal.stopTimer);
                      toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                  });
    }
  };

  const handleUploadTypeChange = (e) => {
    setUploadType(e.target.value);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div>
    <div className="page-header"></div>
    <div className="card">
      <div className="card-header">
        <div className="navigateheaders">
          <div
            onClick={() => {
              navigate(-1);
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <div></div>
          <div
            onClick={() => {
              navigate("/dashboard/course");
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </div>
        </div>
        <h4>
              Upload Video for {courseName}{" "}
            </h4>
        </div>
        <div className="card-body">
        <div className="row">
        <div className="col-12">
          {isSubmitting &&  <div className="outerspinner active">
        <div className="spinner"></div>
      </div>}
          
           
            <div className="innerdivider">
              <div >
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Video Title <span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-9">
                    {" "}
                    <input
                      type="text"
                      placeholder="Video Title"
                      name="Lessontitle"
                      value={videodata.Lessontitle}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`form-control   mt-1 ${
                        errors.Lessontitle && "is-invalid"
                      }`}
                      required
                    />
                    <div className="invalid-feedback">{errors.Lessontitle}</div>
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Description<span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-9">
                    <textarea
                      name="LessonDescription"
                      value={videodata.LessonDescription}
                      placeholder="Video Description"
                      rows={4}
                      className={`form-control   mt-1 ${
                        errors.LessonDescription && "is-invalid"
                      }`}
                      disabled={isSubmitting}
                      onChange={handleChange}
                    ></textarea>{" "}
                    <div className="invalid-feedback">
                      {errors.LessonDescription}
                    </div>
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Thumbnail</label>
                 <div className="col-sm-9"> <div className=" custom-file">
                  <label
                    htmlFor="fileInput"
                  className="custom-file-label"
                  >
                    Upload
                  </label>
                  <input
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    name="thumbnail"
                    type="file"
                    id="fileInput"
                    className={`custom-file-input ${
                      errors.fileInput && "is-invalid"
                    }`}
                    accept="image/*"
                  />
                  </div>
                  </div>
                  </div>
                  {videodata.base64Image && (
                     <div className="form-group row">
                     <label className="col-sm-3 col-form-label"></label>
                     <div className="col-sm-9">
                    <img
                      src={videodata.base64Image}
                      alt="Selected "
                      style={{ width: "100px", height: "100px" }}
                    />
                    </div>
                    </div>
                  )}
             
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Attachments</label>
    <div className="col-sm-9">
                  <div
                    className="dropzone "
                    onDrop={handleDocDrop}
                    onDragOver={handleDragOver}
                  >
                    <p>Drag and drop </p>

                    <p>or</p>
                    <label
                      htmlFor="documentContent"
                      style={{ margin: "auto", width: "200px" }}
                      className="file-upload-btn"
                    >
                      Upload
                    </label>
                    <p>Allowed Files .pdf |.ppt |.pptx</p>
                    <input
                      type="file"
                      accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      name="documentContent"
                      id="documentContent"
                      className={`file-upload ${
                        errors.documentContent && "is-invalid"
                      }`}
                      onChange={handleDocChange}
                    />
                    {videodata.documentContent &&
                      videodata.documentContent.length > 0 && (
                        <ul>
                          {videodata.documentContent.map((doc, index) => (
                            <li key={index} className="doclink">
                              {doc.name}
                              <i
                                className="fa-regular fa-trash-can"
                                style={{
                                  marginLeft: "10px",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleRemoveDoc(index)}
                              ></i>
                            </li> // Display document name
                          ))}
                        </ul>
                      )}
                  </div>
                  </div>
                </div>
              </div>

              <div className="videoinputs">
                <div>
                  <input
                    type="radio"
                    name="uploadType"
                    id="video"
                    value="video"
                    checked={uploadType === "video"}
                    onChange={handleUploadTypeChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="video" style={{ marginLeft: "20px" }}>
                    Video <span className="text-danger">*</span>
                  </label>
                </div>
                <div>
                  <input
                    type="radio"
                    name="uploadType"
                    id="url"
                    value="url"
                    checked={uploadType === "url"}
                    onChange={handleUploadTypeChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="url" style={{ marginLeft: "20px" }}>
                    Youtube Url <span className="text-danger">*</span>
                  </label>
                </div>

                {uploadType === "url" ? (
                  <>
                    <div>
                      <input
                        type="text"
                        name="normalurl"
                        placeholder="Enter Youtube URL"
                        value={videodata.normalurl}
                        onChange={handleChange}
                        className={`form-control  mt-1 urlinput ${
                          errors.normalurl && "is-invalid"
                        }`}
                        disabled={isSubmitting}
                      />
                      <div className="invalid-feedback">{errors.normalurl}</div>
                      {videodata.fileUrl && (
                        <>
                          <div>
                            <input
                              type="text"
                              name="fileUrl"
                              value={videodata.fileUrl}
                              onChange={handleChange}
                              className="form-control mt-2"
                              readOnly
                              disabled={isSubmitting}
                              data-toggle="tooltip"
                              data-placement="top"
                              title="Embeded Url"
                            />
                          </div>
                          <div>
                            {videodata.fileUrl && (
                              <iframe
                                style={{ marginTop: "10px" }}
                                src={videodata.fileUrl}
                              ></iframe>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className="dropzone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <p>Drag and drop </p>
                    <p>or</p>
                    <label
                      htmlFor="videoupload"
                      style={{ width: "200px" }}
                      className="file-upload-btn"
                    >
                      {" "}
                      upload Video
                    </label>
                    <input
                      type="file"
                      className="file-upload"
                      id="videoupload"
                      name="file"
                      accept="video/*"
                      onChange={handleFileInputChange}
                      disabled={isSubmitting}
                    />
                    {selectedFile && <p>{selectedFile.name}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="cornerbtn ">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  navigate(-1);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Save
              </button>
            </div>
       
        </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default UploadVideo;
