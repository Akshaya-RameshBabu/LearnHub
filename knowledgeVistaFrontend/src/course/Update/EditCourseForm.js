import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
import errorimg from "../../images/errorimg.png";
import { useNavigate, useParams } from "react-router-dom";
const EditCourseForm = ({}) => {
  const MySwal = withReactContent(Swal);

  const token = sessionStorage.getItem("token");
  const [courseEdit, setCourseEdit] = useState([]);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({
    courseName: "",
    courseDescription: "",
    courseCategory: "",
    amount: "",
    noofseats: "",
    duration: "",
    courseImage: null,
  });
  const [img, setimg] = useState();
  useEffect(() => {
    const fetchcourse = async () => {
      try {
        const response = await axios.get(`${baseUrl}/course/get/${courseId}`, {
          headers: {
            Authorization: token,
          },
        });
        if (!response.status === 200) {
          MySwal.fire({
            icon: "error",
            title: "HTTP Error!",
            text: `HTTP error! Status: ${response.status}`,
          });
        }
        const data = response.data;
        setimg(`data:image/jpeg;base64,${data.courseImage}`);
        setCourseEdit(data);
      } catch (error) {
        // MySwal.fire({
        //   title: "Error!",
        //   text: "An error occurred while Fetching course in Edit Form. Please try again later.",
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error
      }
    };
    fetchcourse();
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseEdit({ ...courseEdit, [name]: value });
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };
  const validateField = (fieldName, fieldValue) => {
    const validations = {
      courseName: (value) =>
        !value
          ? "Course Name is required"
           :(value.includes("/") || value.includes("\\"))
            ?  "Course Title should not contain the '/' or '\' character"
          : value.length > 50
          ? "Course Name must not exceed 50 characters"
          : "",
    
      courseDescription: (value) =>
        !value
          ? "Course Description is required"
          : value.length > 100
          ? "Course Description must not exceed 100 characters"
          : "",
    
      courseCategory: (value) =>
        !value
          ? "Course Category is required"
          : value.length > 50
          ? "Course Category must not exceed 50 characters"
          : "",
      amount: (value) =>
        value && !isNaN(value) ? "" : "Invalid Amount (must be a number)",
      noofseats: (value) =>
        value > 0 ? "" : "Number of Seats must be greater than 0",
      duration: (value) => (value > 0 ? "" : "Duration must be greater than 0"),
    };
    return validations[fieldName](fieldValue);
  };


  // Function to convert file to Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    // Update formData with the new file
    const file = e.target.files[0];
    if (file && file.size > 50 * 1024) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        courseImage: "Image size must be 50kb or smaller",
      }));
      return;
    }
    // Convert the file to base64

    // Update formData with the new file
    setCourseEdit((courseEdit) => ({ ...courseEdit, courseImage: file }));
    convertImageToBase64(file)
      .then((base64Data) => {
        // Set the base64 encoded image in the state
        setimg(base64Data);
      })
      .catch((error) => {
        console.error("Error converting image to base64:", error);
      });
      setErrors((prevErrors) => ({
        ...prevErrors,
        courseImage: "",
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const key in errors) {
      if (errors[key]) {
        // Scroll to the first field with an error (optional)
        document
          .getElementById(key)
          .scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
          });
        return; // Exit function if there are errors
      }
    }

    const formData = new FormData();
    if (courseEdit.courseName) {
      formData.append("courseName", courseEdit.courseName.trim());
    }
    if (courseEdit.courseDescription) {
      formData.append("courseDescription", courseEdit.courseDescription);
    }
    if (courseEdit.amount) {
      formData.append("courseAmount", courseEdit.amount);
    }
    if (courseEdit.courseCategory) {
      formData.append("courseCategory", courseEdit.courseCategory);
    }
    if (courseEdit.courseImage) {
      formData.append("courseImage", courseEdit.courseImage);
    }
    if (courseEdit.duration) {
      formData.append("Duration", courseEdit.duration);
    }
    if (courseEdit.noofseats) {
      formData.append("Noofseats", courseEdit.noofseats);
    }

    try {
      const response = await axios.patch(
        `${baseUrl}/course/edit/${courseId}`,
        formData,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.status === 200) {
        MySwal.fire({
          title: "Course Updated",
          text: " course have Updated successfully you can check by refreshing !",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/dashboard/course");
          }
        });
      }
    } catch (error) {
      // Handle network errors or other exceptions
      // MySwal.fire({
      //   title: "Error!",
      //   text: "An error occurred . Please try again later.",
      //   icon: "error",
      //   confirmButtonText: "OK",
      // });
      throw error
    }
  };
  return (
    <div>
    <div className="page-header"></div>
    <div className="card">
      <div className=" card-body">
      <div className="row">
      <div className="col-12">
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
        <form onSubmit={handleSubmit} >
        
              <h4>Update Course</h4>
              <hr />
<div className="col-10"> 
              <div className="form-group row">
                <label htmlFor="courseName"  className="col-sm-3 col-form-label">
                  Course Title <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="courseName"
                    id="courseName"
                    className={`form-control   ${
                      errors.courseName && "is-invalid"
                    }`}
                    placeholder="Enter the Course Name"
                    value={courseEdit.courseName}
                    onChange={handleChange}
                    autoFocus
                  />
                  <div className="invalid-feedback">{errors.courseName}</div>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="courseDescription" className="col-sm-3 col-form-label">
                  Course Description <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                  type="text"
                    name="courseDescription"
                    id="courseDescription"
                    className={`form-control   ${
                      errors.courseDescription && "is-invalid"
                    }`}
                    placeholder="Description about the Course"
                    value={courseEdit.courseDescription}
                    onChange={handleChange}
                  />
                  <div className="invalid-feedback">
                    {errors.courseDescription}
                  </div>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="courseCategory" className="col-sm-3 col-form-label">
                  Course Category <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="courseCategory"
                    id="courseCategory"
                    className={`form-control    ${
                      errors.courseCategory && "is-invalid"
                    }`}
                    placeholder="Category"
                    value={courseEdit.courseCategory}
                    onChange={handleChange}
                  />{" "}
                  <div className="invalid-feedback">
                    {errors.courseCategory}
                  </div>
                </div>
              </div>
            
              <div className="form-group row">
                <label htmlFor="courseImage" className="col-sm-3 col-form-label">
                 
                    Course Image<span className="text-danger">*</span>
               
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
                </div></div>
              </div>
                <div className="form-group row pt-1" >
                      <label className="col-sm-3 col-form-label"></label>
                      <div className="col-sm-9">
                <img
                  src={img}
                  onError={(e) => {
                    e.target.src = errorimg; // Use the imported error image
                  }}
                  alt="selected pic of course"
                  style={{
                    width: "100px",
                    height: "100px",
                  }}
                />
                </div>
                </div>
            <div className="form-group row p-3">
            <div className="col-sm-7">
                  <div className="row">
                  <label htmlFor="duration" 
                  className=" col-form-label  col-sm-5 p-0 pt-2">
                     Duration (Hours) <span className="text-danger">*</span>
                  </label>
                  <div className="col">
                    <input
                      name="duration"
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      id="duration"
                      className={`form-control   mt-1 ${
                        errors.duration && "is-invalid"
                      }`}
                      value={courseEdit.duration}
                      onChange={handleChange}
                    />
                    <div className="invalid-feedback">{errors.duration}</div>
                    </div>
                    </div>
                </div>
                
                <div className="col-sm-5">
                <div className="row">
                <label htmlFor="noofseats " 
                className=" col-form-label col-sm-5">
                  Number of Seats <span className="text-danger">*</span>
                </label>
              <div className="col">
                  <input
                    name="noofseats"
                    type="number"
                    onWheel={(e) => e.currentTarget.blur()}
                    id="noofseats"
                    value={courseEdit.noofseats}
                    className={`form-control    ${
                      errors.noofseats && "is-invalid"
                    }`}
                    onChange={handleChange}
                  />
                  <div className="invalid-feedback">{errors.noofseats}</div>
                  </div>
               </div>
              </div>
             
               
                </div>
                <div className="form-group row">
                  <label htmlFor="courseAmount"
                   className=" col-sm-3 col-form-label">
                     Course Amount  <span className="text-danger">*</span>
                  </label>
                 <div className="col-sm-9">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      name="amount"
                      id="amount"
                      className={`form-control   mt-1 ${
                        errors.courseAmount && "is-invalid"
                      }`}
                      placeholder="Amount"
                      value={courseEdit.amount}
                      onChange={handleChange}
                    />
                    <div className="invalid-feedback">
                      {errors.courseAmount}
                    </div>
                    </div>
                    </div>
                   
                  </div>
                <div className="cornerbtn">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    navigate(-1);
                  }}
                >
                  Cancel
                </button>
                
                  <button type="submit" className="btn btn-primary ">
                    Update 
                  </button>
                </div>
              
        
        </form>
        </div>
        </div>
        </div>
      </div>
      </div>
  );
};

export default EditCourseForm;
