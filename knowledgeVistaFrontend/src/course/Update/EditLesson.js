import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
import errorimg from "../../images/errorimg.png";
const EditLesson = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MySwal = withReactContent(Swal);
  const { courseName, Lessontitle, lessonId, courseId } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState("video");
  const [videodata, setvideodata] = useState({
    lessontitle: "",
    lessonDescription: "",
    fileUrl: "",
    normalurl: "",
    thumbnail: null,
    existingDocumentDetails: [],
    removedDetails:[],
    newDocumentFiles: [],
    documentPath: "",
    videoFile: null,
    base64Image: null,
  });

  const [errors, setErrors] = useState({
    lessontitle: "",
    lessonDescription: "",
    fileUrl: "",
    documentPath: "",
    thumbnail: "",
    newDocumentFiles: "",
    removedDetails:"",
    existingDocumentDetails: "",
    normalurl: "",
    videoFile: "",
    base64Image: "",
  });

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/lessons/getLessonsByid/${lessonId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        const data = await response.data;

        if (response.status === 200) {
          setvideodata(data);
          if (data.videofilename === null) {
            setUploadType("url");
            const url = data.fileUrl;
            setvideodata((videodata) => ({ ...videodata, normalurl: url }));
          }if (data.videofilename != null) {
            const filename = data.videofilename.substring(
              data.videofilename.indexOf("_") + 1
            );
            
            setSelectedFile((prevFile) => ({
              ...prevFile,
              name: filename,
            }));
          }
          
         
          if (data.thumbnail) {
            setvideodata((prevVideoData) => ({
              ...prevVideoData,
              base64Image: `data:image/jpeg;base64,${data.thumbnail}`,
              documentPath: data.documentPath,
            }));
           
          }
          const docResponse = await axios.get(
            `${baseUrl}/getDocs/${data.lessonId}`,{
              headers: {
                Authorization: token,
              },
            }
          );
         
          setvideodata((prev) => ({
            ...prev,
            existingDocumentDetails: docResponse.data,
          }));
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 401) {
            MySwal.fire({
              title: "Un Authorized",
              text: "you are UnAuthorized to access this Page Redirecting to  back",
              icon: "error",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate(-1);
              }
            });
          } else if (error.response.status === 404) {
            MySwal.fire({
              title: "Not Found",
              text: `No lessons found with lesson name ${Lessontitle}`,
              icon: "error",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate(-1);
              }
            });
          }
        } else {
          // MySwal.fire({
          //   title: "Error!",
          //   text: "An error occurred . Please try again later.",
          //   icon: "error",
          //   confirmButtonText: "OK",
          // });
          throw error
        }
      }
    };

    fetchVideoData(); // Call the async function

    // Add any dependencies if needed
  }, [lessonId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let error = "";
    switch (name) {
      case "lessontitle":
        error = value.length < 1 
        ? "Please enter a Lesson Title" : value.length > 50 
        ? "Lesson Title should not exceed 50 characters" 
        :(value.includes("/") || value.includes("\\"))
            ?  "Lesson Title should not contain the '/' or '\' character"
        : "";
        setvideodata({ ...videodata, [name]: value });
        break;
      case "lessonDescription":
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
        newDocumentFiles: [...(prevData.newDocumentFiles || []), file], // Store the actual file, not an object
      }));
    } else {
       MySwal.fire({
                    toast:true,
              position: 'top-end', 
              icon: 'warning',
              title: 'Only PDF or PPT files are allowed',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
              }
            });
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
        newDocumentFiles: [...(prevData.newDocumentFiles || []), file], // Store the actual file, not an object
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
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const isSaveDisabled = () => {
    // Check if video title and description have values
    const isVideoTitleValid = videodata.lessontitle.trim().length > 0;
    const isVideoDescriptionValid =
      videodata.lessonDescription.trim().length > 0;

    // Check if either video file is selected or URL is present and valid
    let isVideoValid = false;
    if (uploadType === "video") {
      isVideoValid = selectedFile !== null;
    } else if (uploadType === "url") {
      isVideoValid =
        /^(https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+\??[\w-=&]*)$/.test(
          videodata.fileUrl
        );
    }

    // Enable save button only if all conditions are met
    return !(isVideoTitleValid && isVideoDescriptionValid && isVideoValid);
  };
  const handleFileChange = (e) => {
    const { name, value } = e.target;
    const file = e.target.files[0];

    // Update formData with the new file
    setvideodata((prevVideodata) => ({ ...prevVideodata, thumbnail: file }));
   
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
        console.log("thumbnail",videodata.thumbnail)
  };
  const handleEdit = async (e) => {
    e.preventDefault();
    let hasErrors = false;
    Object.keys(errors).forEach((field) => {
      if (errors[field]) {
        
        hasErrors = true;
      }
    });
  
    if (hasErrors) {
      return; // Early return if there are any errors
    }
   
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    if (videodata.lessontitle) {
      formDataToSend.append("Lessontitle", videodata.lessontitle.trim());
    }
    if (videodata.lessonDescription) {
      formDataToSend.append("LessonDescription", videodata.lessonDescription);
    }
    if (videodata.removedDetails ) {
      videodata.removedDetails.forEach(doc => {
          formDataToSend.append("removedDetails", doc); // Append each ID
      });
  }
  
    if (videodata.newDocumentFiles && videodata.newDocumentFiles.length > 0) {
      videodata.newDocumentFiles.forEach((doc, index) => {
        formDataToSend.append("newDocumentFiles", doc); // Ensure each document is appended properly
      });
    }
    if (videodata.thumbnail) {
      formDataToSend.append("thumbnail", videodata.thumbnail);
    }

    // Send video file if available
    if (videodata.videoFile) {
      formDataToSend.append("videoFile", videodata.videoFile);
    }

    // Send file URL if available
    if (videodata.fileUrl) {
      formDataToSend.append("fileUrl", videodata.fileUrl);
    }
    console.log("FormData content:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }
    try {
      const response = await axios.patch(
        `${baseUrl}/lessons/edit/${videodata.lessonId}`,
        formDataToSend,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 200) {
        setIsSubmitting(false);
        MySwal.fire({
          title: "Updated!",
          text: " The Lesson was Updated",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
           navigate(`/lessonList/${courseName}/${courseId}`);
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setIsSubmitting(false);
       navigate( "/unauthorized");
      } else if (error.response && error.response === 404) {
        setIsSubmitting(false);
        MySwal.fire({
          title: "Not Found!",
          text: " The Lesson Not Found",
          icon: "warning",
          confirmButtonText: "OK",
        });
      }
      if (error.response && error.response.status === 413) {
        setIsSubmitting(false);
        MySwal.fire({
          title: "Storage Limit Exceeded",
          text: error.response.data,
          icon: "warning",
        });
      } else {
        setIsSubmitting(false);
        // MySwal.fire({
        //   title: "error!",
        //   text: "Some Unexpected Error occured . Please try again later.",
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error
      }
    }
  };
  const handleRemoveExisDoc = (indexToRemove) => {
    // Get the document object to be removed
    const docToRemove = videodata.existingDocumentDetails[indexToRemove];
  
    // Get the ID of the document to be removed
    const docToRemoveId = docToRemove.id; // Access the id property
  
    // Update the removedDetails state
    const updatedRemovedDetails = [...(videodata.removedDetails || []), docToRemoveId];
  
    // Filter out the document from existingDocumentDetails
    const updatedDocs = videodata.existingDocumentDetails.filter(
      (doc, index) => index !== indexToRemove
    );
  
    // Update the state to remove the file and add the removed ID
    setvideodata({ 
      ...videodata, 
      existingDocumentDetails: updatedDocs,
      removedDetails: updatedRemovedDetails // Add the removed ID here
    });
  };
  
  const handleRemoveDoc = (indexToRemove) => {
    const updatedDocs = videodata.newDocumentFiles.filter(
      (doc, index) => index !== indexToRemove
    );
    // Update the state to remove the file
    setvideodata({ ...videodata, newDocumentFiles: updatedDocs });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const maxSize = 1024 * 1024 * 1024;
      if (file && file.size > maxSize) {
       MySwal.fire({
                    toast:true,
              position: 'top-end', 
              icon: 'warning',
              title: 'File Size exceeds 1GB Limit',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
              }
            });
    } else {
      if (file && file.type.includes("video")) {
        // Set the selected file name in state
        setSelectedFile((prev) => ({
          ...prev,
          name: file.name, // Set the file name in selectedFile
        }));
  
        // Update the videodata state with the file
        setvideodata((prevData) => ({
          ...prevData,
          videoFile: file, 
          fileUrl: "", // Clear file URL if necessary
        }));
      } else {
         MySwal.fire({
                      toast:true,
                position: 'top-end', 
                icon: 'warning',
                title: 'Please Select a Video File',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer);
                  toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
              });
      }
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
              title: 'File Size Exceeds 1GB Limit!',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
              }
            });
    } else {
      if (file && file.type.includes("video")) {
        // Set the selected file name in state
        setSelectedFile((prev) => ({
          ...prev,
          name: file.name, // Set the file name in selectedFile
        }));
  
        // Update the videodata state with the file
        setvideodata((prevData) => ({
          ...prevData,
          videoFile: file, 
          fileUrl: "", // Clear file URL if necessary
        }));
      } else {
         MySwal.fire({
                      toast:true,
                position: 'top-end', 
                icon: 'warning',
                title: 'Please Select a Video File.',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer);
                  toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
              });
      }
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
        <form onSubmit={handleEdit}>
          {isSubmitting &&  <div className="outerspinner active">
        <div className="spinner"></div>
      </div>}
         
            <h4>
              Edit Lesson {Lessontitle}{" "}
            </h4>
            <div className="card-body">
        <div className="row">
        <div className="col-12">
            <div className="innerdivider">
              <div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Video Title</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      placeholder="Video Title"
                      name="lessontitle"
                      value={videodata.lessontitle}
                      onChange={handleChange}
                      className={`form-control   mt-1 ${
                        errors.lessontitle && "is-invalid"
                      }`}
                      disabled={isSubmitting}
                    />
                    <div className="invalid-feedback">{errors.lessontitle}</div>
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Description</label>
                  <div className="col-sm-9">
                    <textarea
                      name="lessonDescription"
                      value={videodata.lessonDescription}
                      className={`form-control   mt-1 ${
                        errors.lessonDescription && "is-invalid"
                      }`}
                      placeholder="Video Description"
                      rows={4}
                      disabled={isSubmitting}
                      onChange={handleChange}
                    ></textarea>
                    <div className="invalid-feedback">
                      {errors.lessonDescription}
                    </div>
                  </div>
                </div>
                <div className="form-group row">
                  <label  className="col-sm-3 col-form-label">Thumbnail</label>
                 <div className="col-sm-9"> <div className=" custom-file">
                    <label
                    htmlFor="thumbnail"
                    
                    className="custom-file-label"
                  >
                    Upload
                  </label>
                  <input
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    name="thumbnail"
                    type="file"
                    id="thumbnail"
                    className="custom-file-input"
                    accept="image/*"
                  />
                  </div></div>
                  </div>
                  {videodata.base64Image && (
                     <div className="form-group row">
                     <label className="col-sm-3 col-form-label"></label>
                     <div className="col-sm-9">
                    <img
                      src={videodata.base64Image}
                      onError={(e) => {
                        e.target.src = errorimg; // Use the imported error image
                      }}
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
                    className="dropzone"
                    onDrop={handleDocDrop}
                    onDragOver={handleDragOver}
                  >
                    <p>Drag and drop </p>

                    <p>or</p>
                  <label
                    htmlFor="existingDocumentDetails"
                    id="must"
                    
                    style={{ margin: "auto", width: "200px" }}
                      className="file-upload-btn"
                  >
                    Upload
                  </label>
                  <p>Allowed Files .pdf |.ppt |.pptx</p>
                  <input
                    type="file"
                    accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      
                    name="existingDocumentDetails"
                    id="existingDocumentDetails"
                    className={`file-upload ${
                      errors.existingDocumentDetails && "is-invalid"
                    }`}
                    onChange={handleDocChange}
                  />
                  <div>
                    {videodata.existingDocumentDetails &&
                      videodata.existingDocumentDetails.length > 0 && (
                        <ul>
                          {videodata.existingDocumentDetails.map(
                            (doc, index) => (
                              <li
                                key={index}
                               
                              >
                                <div 
                                className="doclinkedit"
                               > {doc.documentName &&(
                                  < div onClick={() => {
                                    navigate(`/viewDocument/${doc.documentPath}/${lessonId}/${doc.id}`);
                                    }}>
                                    {doc.documentName && doc.documentName.length<40?doc.documentName:doc.documentName.slice(0,40)+"..."}
                                    {doc.documentName.endsWith(".pdf") && (
                                      <i className="fa-regular fa-file-pdf"></i>
                                    )}
                                    {(doc.documentName.endsWith(".ppt") ||
                                      doc.documentName.endsWith(".pptx")) && (
                                      <i className="fa-regular fa-file-powerpoint"></i>
                                    )}
                                     
                                  </div>
                                )}<i
                                className="fa-regular fa-trash-can text-danger"
                                style={{
                                  marginLeft: "10px",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleRemoveExisDoc(index)}
                              ></i>
                               </div>
                              </li> // Display document name
                            )
                          )}
                        </ul>
                      )}
                    {videodata.newDocumentFiles &&
                      videodata.newDocumentFiles.length > 0 && (
                        <ul>
                          {videodata.newDocumentFiles.map((doc, index) => (
                            <li key={index} className="doclink" >
                              {doc.name &&(
                                <>
                                 {doc.name && doc.name.length<40?doc.name:doc.name.slice(0,40)+"..."}
                                  {doc.name.endsWith(".pdf") && (
                                    <i className="fa-regular fa-file-pdf"></i>
                                  )}
                                  {(doc.name.endsWith(".ppt") ||
                                    doc.name.endsWith(".pptx")) && (
                                    <i className="fa-regular fa-file-powerpoint"></i>
                                  )}
                                </>
                              )}
                               <i
                                className="fa-regular fa-trash-can text-danger"
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
                    Video
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
                    Youtube Url
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
                        className={`form-control   mt-1 urlinput ${
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
                    {selectedFile && selectedFile.name && (
                      <p>
                     {selectedFile.name} 
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

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

              <button
                className="btn btn-primary"
                disabled={isSaveDisabled()}
                type="submit"
              >
                Save
              </button>
            </div>
          </div>
        </form>
        </div>
        </div>
      </div>
  );
};

export default EditLesson;
