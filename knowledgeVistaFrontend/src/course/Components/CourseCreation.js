import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CreateBatchModel from "../../Batch/CreateBatchModel";

const CourseCreation = () => {
  const token = sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const openModal = () => setIsModalOpen(true);   // Set modal open
  const closeModal = () => setIsModalOpen(false);  // Set modal close
  // Initial state for form errors
    const [searchQueryBatches,setSearchQueryBatches]=useState('')
    const [Batches, setBatches] = useState({});
    const[selectedBatches,setSelectedBatches]=useState([])
  const [errors, setErrors] = useState({
    courseName: "",
    courseDescription: "",
    courseCategory: "",
    courseAmount: "",
    Duration: "",
    Noofseats: "",
    courseImage: "",
  });
  const courseName = useRef(null);
  const courseCategory = useRef(null);
  const courseDescription = useRef(null);
  const courseAmount = useRef(null);
  const Duration = useRef(null);
  const Noofseats = useRef(null);
  const courseImage = useRef(null);
  // Initial state for form data
  const [formData, setFormData] = useState({
    courseName: "",
    courseDescription: "",
    courseCategory: "",
    courseAmount: "",
    Duration: "",
    Noofseats: "",
    courseImage: null,
    base64Image: null,
    batches:selectedBatches
  });
  const searchBatches = async (e) => {
    try {
      setSearchQueryBatches(e.target.value)
      const response = await axios.get(`${baseUrl}/searchBatch`, {
        params: { batchTitle: e.target.value },
        headers: {
          Authorization: token,
        },
      });
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  const handleBatchClick = (item) => {
    setSelectedBatches((prevSelected) => {
      // Check if the batch is already selected
      const exists = prevSelected.find((batchPrev) => batchPrev.batchId === item.batchId);
      let updatedBatched;
  
      if (exists) {
        // If the batch already exists, do not add it again
        updatedBatched = prevSelected;
      } else {
        // Add the new batch if not already selected
        updatedBatched = [...prevSelected, { id: item.id, batchId: item.batchId, batchTitle: item.batchTitle }];
      }
  
      // Update the batches in formData
      setFormData((prev) => ({
        ...prev,
        batches: updatedBatched,
      }));
  
      // Return the updated array
      return updatedBatched;
    });
  
    // Clear any batch selection error
    setErrors((prev) => ({
      ...prev,
      batches: "",
    }));
  
    // Clear search-related states if needed
    setBatches({});
    setSearchQueryBatches('');
  };
  
  
  const handelBatchRemove = (item) => {
    setSelectedBatches((prevSelected) => {
      // Ensure prevSelected is an array
      if (!Array.isArray(prevSelected)) {
        return []; // Return an empty array if it's not an array
      }
  
      // Check if item is already selected
      const exists = prevSelected.find((itemprev) => itemprev.id === item.id);
      let updatedCourses;
  
      if (exists) {
        // Remove the selected item from the array
        updatedCourses = prevSelected.filter((itemprev) => itemprev.id !== item.id);
        
        // You can add additional logic here to add the batch to course creation if needed
        // Example: setCourseCreationBatches(updatedCourses); (if needed)
      } else {

        updatedCourses = prevSelected; 
        // If not found, keep the original array
      }
      if(updatedCourses.length===0){
        setErrors((prev) => ({
          ...prev,
          batches: "Batch Cannot Be Empty",
        }));
      }
      return updatedCourses; // Return the updated array
    });
   
  };
  
  // Handle changes to form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = "";

    // Parse value to a number where necessary
    const numericValue =
      name === "courseAmount" || name === "Duration" || name === "Noofseats"
        ? parseFloat(value)
        : value;

    switch (name) {
      case "courseName":
        error = value.length < 1 
            ? "Please enter a Course Title" 
            : value.length > 50 
            ? "Course Title should not exceed 50 characters" 
            :(value.includes("/") || value.includes("\\"))
            ?  "Course Title should not contain the '/' or '\' character"
            : "";
        break;
      case "courseCategory":
        error = value.length < 1 
        ? "Please enter a Course Category" 
        : value.length > 50 
        ? "Course Category should not exceed 50 characters" 
         :(value.includes("/") || value.includes("\\"))
            ?  "Course Title should not contain the '/' or '\' character"
        : "";
        break;
      case "courseDescription":
        error = value.length < 1 
        ? "Please enter a Course Description " : value.length > 100
        ? "Course Description should not exceed 100 characters" 
        : "";
        break;
      case "courseAmount":
        error =
          numericValue < 0
            ? "Course amount must be greater than or equal to 0"
            : "";
        break;
      case "Duration":
        error = numericValue < 1 ? "Duration must be greater than 0" : "";
        break;
      case "Noofseats":
        error =
          numericValue < 1 ? "Number of seats must be greater than 0" : "";
        break;
      default:
        break;
    }

    // Update errors state
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));

    // Update form data state
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Convert image file to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const scrollToError = () => {
    if (errors.courseName) {
      courseName.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.courseCategory) {
      courseCategory.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.courseDescription) {
      courseDescription.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.courseAmount) {
      courseAmount.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.Duration) {
      Duration.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.Noofseats) {
      Noofseats.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  };

  useEffect(() => {
    scrollToError();
  }, [errors]);
  // Handle changes to the file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Define allowed MIME types for images
    const allowedImageTypes = ["image/jpeg", "image/png"];

    // Check file type (MIME type)
    if (file &&  !allowedImageTypes.includes(file.type)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        courseImage: "Please select an image of type JPG or PNG",
      }));
      return;
    }

    // Check file size (should be 1 MB or less)
    if (file && file.size > 50 * 1024) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        courseImage: "Image size must be 50 kb or smaller",
      }));
      return;
    }

    // Update formData with the new file
    setFormData((prevFormData) => ({
      ...prevFormData,
      courseImage: file,
    }));

    // Convert the file to base64
    convertImageToBase64(file)
      .then((base64Data) => {
        // Set the base64 encoded image in the state
        setFormData((prevFormData) => ({
          ...prevFormData,
          base64Image: base64Data,
        }));
        setErrors((prevErrors) => ({
          ...prevErrors,
          courseImage: "",
        }));
      })
      .catch((error) => {
        console.error("Error converting image to base64:", error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          courseImage: "Error converting image to base64",
        }));
      });
  };
 
  // Handle form submission
  const handleSubmit = async (e) => {
    
    try {
      e.preventDefault();
    let hasErrors = false;
    const requiredFields = [
      "courseName",
      "courseDescription",
      "courseCategory",
      "courseAmount",
      "Duration",
      "Noofseats",
      "courseImage"
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].length === 0 || errors[field]) {
        hasErrors = true;
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: !formData[field] ? "This field is required" : errors[field],
        }));
      }
    });
    if (selectedBatches=== 0) {
      hasErrors = true;
      setErrors((prevErrors) => ({
        ...prevErrors,
        batches: "Select a batch",
      }));
     
    }
    if (!formData.courseImage) {
      hasErrors = true;
      setErrors((prevErrors) => ({
        ...prevErrors,
        courseImage: "Image is Required",
      }));
    }
   if(selectedBatches.length===0){
    hasErrors = true;
    setErrors((prevErrors) => ({
      ...prevErrors,
      batches: "batch is Required",
    }));
   }
    if (!hasErrors) {
      // Create a FormData object to send the form data
      const formDataToSend = new FormData();
      formDataToSend.append("courseName", formData.courseName.trim());
      formDataToSend.append("courseDescription", formData.courseDescription);
      formDataToSend.append("courseCategory", formData.courseCategory);
      formDataToSend.append("courseAmount", formData.courseAmount);
      formDataToSend.append("courseImage", formData.courseImage);
      formDataToSend.append("Trainer", formData.Trainer);
      formDataToSend.append("Duration", formData.Duration);
      formDataToSend.append("Noofseats", formData.Noofseats);
      formDataToSend.append("batches",JSON.stringify(selectedBatches))
     

      const response = await axios.post(
        `${baseUrl}/course/add`,
        formDataToSend,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.status === 200) {
        const reply = response.data;
        const { message, courseId, coursename } = reply;
        navigate(`/course/Addlesson/${coursename}/${courseId}`)
      }
    }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        MySwal.fire({
          title: "Error",
          text: "you are unauthorized to access this page",
          icon: "error",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(-1);
          }
        });
      } else if (error.response && error.response.status === 400) {
        MySwal.fire({
          title: "Limit Reached !",
          text: error.response.data,
          icon: "waring",
          confirmButtonText: "OK",
        });
      } else {
        // MySwal.fire({
        //   title: "Error!",
        //   text: "Some unexpected error occurred. Please try again later.",
        //   icon: "error",
        //   confirmButtonText: "OK",});
        throw error
      }
    }
  };

 

  return (
<div>
  <div className="page-header"></div>
  <div className="card">
    <div className="card-body">
    
        <div className="row">
          <div className="col-12">
         <div className="navigateheaders">
              <div onClick={() => { navigate(-1); }}>
                <i className="fa-solid fa-arrow-left"></i>
              </div>
              <div></div>
              <div onClick={() => { navigate("/dashboard/course"); }}>
                <i className="fa-solid fa-xmark"></i>
              </div>
            </div>
            <h4>Setting up a Course</h4>
            <hr />
            <form className="col-10">
              {/* Course Title */}
              <div className="form-group row">
                <label htmlFor="courseName" ref={courseName} 
                className="col-sm-3 col-form-label">
                  Course Title <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={formData.courseName}
                    className={`form-control ${errors.courseName && "is-invalid"}`}
                    placeholder="Course Title"
                    onChange={handleChange}
                    autoFocus
                    required
                  />
                  <div className="invalid-feedback">{errors.courseName}</div>
                </div>
              </div>

              {/* Course Description */}
              <div className="form-group row" ref={courseDescription}>
                <label htmlFor="courseDescription" className="col-sm-3 col-form-label">
                  Course Description <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                  type="text"
                    id="courseDescription"
                    name="courseDescription"
                    value={formData.courseDescription}
                    onChange={handleChange}
                    className={`form-control ${errors.courseDescription && "is-invalid"}`}
                    placeholder="Course Description"
                    required
                  />
                  <div className="invalid-feedback">{errors.courseDescription}</div>
                </div>
              </div>

              {/* Course Category */}
              <div className="form-group row" ref={courseCategory}>
                <label htmlFor="courseCategory" className="col-sm-3 col-form-label">
                  Course Category <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    id="courseCategory"
                    name="courseCategory"
                    onChange={handleChange}
                    className={`form-control ${errors.courseCategory && "is-invalid"}`}
                    placeholder="Course Category"
                    value={formData.courseCategory}
                    required
                  />
                  <div className="invalid-feedback">{errors.courseCategory}</div>
                </div>
              </div>

              {/* Course Image */}
              <div className="form-group row" ref={courseImage}>
                <label htmlFor="courseImage" 
                className="col-sm-3 col-form-label">
                  Course Image <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9 ">
                  <div className="custom-file">
                  <input
                    type="file"
                    className={`custom-file-input 
                      ${errors.courseImage && "is-invalid"}`}
                    onChange={handleFileChange}
                    id="courseImage"
                    name="courseImage"
                    accept="image/*"
                  />
                  <label className="custom-file-label" 
                  htmlFor="courseImage">
                    Choose file...
                  </label>
                  <div className="invalid-feedback">{errors.courseImage}</div>
                </div>
                </div>
              </div>
              {formData.base64Image && (
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label"></label>
                  <div className="col-sm-9">
                    <img
                      src={formData.base64Image}
                      alt="Selected"
                      style={{ width: "100px", height: "100px" }}
                    />
                  </div>
                </div>
              )}

              {/* Duration, Number of Seats, and Course Amount */}
              <div className="form-group row p-3">
                <div className="col-sm-7" ref={Duration}>
                  <div className="row">
                    <label htmlFor="Duration"
                     className="col-form-label col-sm-5 p-0 pt-2">
                      Duration (Hours) <span className="text-danger">*</span>
                    </label>
                    <div className="col">
                      <input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Duration"
                        id="Duration"
                        name="Duration"
                        value={formData.Duration}
                        onChange={handleChange}
                        className={`form-control ${errors.Duration && "is-invalid"}`}
                        required
                      />
                      <div className="invalid-feedback">{errors.Duration}</div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-5" ref={Noofseats}>
                  <div className="row">
                    <label htmlFor="Noofseats" className="col-form-label col-sm-5">
                      Number of Seats <span className="text-danger">*</span>
                    </label>
                    <div className="col">
                      <input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="No Of Seats"
                        id="Noofseats"
                        name="Noofseats"
                        className={`form-control ${errors.Noofseats && "is-invalid"}`}
                        value={formData.Noofseats}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.Noofseats}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Select Batch
                    <span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-7">
                  <div className="inputlike">
                  {selectedBatches.length > 0 && (
        <div className="listemail">
          {selectedBatches.map((item) => (
            <div key={item.id} className="selectedemail">
              {item.batchTitle}{" "}
              <i
                onClick={() => handelBatchRemove(item)}
                className="fa-solid fa-xmark"
              ></i>
            </div>
          ))}
        </div>
      )}

                      <input
                        type="input"
                        id="customeinpu"
                        className={`form-control ${errors.batches && "is-invalid"}`}
                        placeholder="search batch..."
                        onChange={searchBatches}
                        value={searchQueryBatches}
                      />
                      <div className="invalid-feedback">{errors.batches}</div>
                    </div>
                    {Batches.length > 0 && (
        <div className="user-list">
          {Batches.map((item) => (
            <div key={item.id} className="usersingle">
              <label
                id="must"
                className="p-1 w-100"
                htmlFor={item.batchTitle}
                onClick={() => handleBatchClick(item)}
              >
                {item.batchTitle}
              </label>
            </div>
          ))}
        </div>
      )}
                  </div>
                  <div className="col-sm-2 pt-1">
                  <button
        type="button"
        className="btn btn-primary"
        style={{ minWidth: '150px' }}
        onClick={openModal} // Trigger modal open on click
      >
        Add New Batch
      </button>

      {/* Pass state and functions to the CreateBatchModel component */}
      {isModalOpen && (
        <CreateBatchModel 
          setSelectedBatches={setSelectedBatches}
          closeModal={closeModal}  // Pass close function to the modal
          setErrors={setErrors}
        />
      )}

                  </div>
                </div>
              <div className="form-group row" ref={courseAmount}>
                 
                    <label htmlFor="courseAmount" className="col-sm-3 col-form-label">
                      Course Amount <span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-9">
                      <input
                        type="number"
                        placeholder="Amount"
                        style={{ marginBottom: "4px" }}
                        id="courseAmount"
                        name="courseAmount"
                        value={formData.courseAmount}
                        className={`form-control ${errors.courseAmount && "is-invalid"}`}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        required
                      />
                      <div className="invalid-feedback">{errors.courseAmount}</div>
                    </div>
              
                </div>
              {/* Submit and Cancel Buttons */}
            </form>
            <div className="cornerbtn">
              <button className="btn btn-secondary" type="button" onClick={() => { navigate(-1); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      
    </div>
  </div>
</div>

  );
};

export default CourseCreation;