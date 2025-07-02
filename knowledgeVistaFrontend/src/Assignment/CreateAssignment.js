import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate, useParams } from "react-router-dom";
import AddQuestionToAssignment from "./AddQuestionToAssignment";
import baseUrl from "../api/utils.js";
import axios from "axios";
import AddQuizzToAssignment from "./AddQuizzToAssignment.js";

const CreateAssignment = () => {
  const { courseName, courseId } = useParams();
  const token = sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [AssignmentQuestion, setAssignmentQuestion] = useState(
    Array(5).fill({ questionText: "" })
  );
  const [savedQuestions, setSavedQuestions] = useState([]);// holds the questions for Quizz
  const [Assignment, setAssignment] = useState({
    title: "",
    description: "",
    totalMarks: 10,
    type: "QA",
    maxFileSize: ""
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    totalMarks: "",
  });

  const validate = (name, value, formData = {}) => {
    let newErrors = { ...errors };

    const numericValue = Number(value);

    if (name === "title") {
      if (value.trim() === "") {
        newErrors.title = "Title is required";
      } else if (value.length > 255) {
        newErrors.title = "Title cannot exceed 255 characters";
      } else if(value.includes("/")||value.includes("\\")){
        newErrors.title = "Title cannot have '/' or '\\'  characters";
      }
      else {
        newErrors.title = "";
      }
    }

    if (name === "description") {
      if (value.trim() === "") {
        newErrors.description = "Description is required";
      } else if (value.length > 1000) {
        newErrors.description = "Description cannot exceed 1000 characters";
      } else {
        newErrors.description = "";
      }
    }

    if (name === "totalMarks") {
      if (numericValue <= 0) {
        newErrors.totalMarks = "Total marks must be greater than 0";
      } else {
        newErrors.totalMarks = "";
      }
    }
    setErrors(newErrors);
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;

    setAssignment((prev) => {
      const updatedAssignment = {
        ...prev,
        [name]: value,
      };

      // Pass the full form data to validate (with the latest updated value)
      validate(name, value, updatedAssignment);

      return updatedAssignment;
    });
  };

  const handleQuestionButtonClick = () => {
    if (Assignment.type === "FILE_UPLOAD") {
      handleSubmit();
    } else {
      setShowAddQuestion(true);
    }
  };
  const isFormInvalid = 
  errors.title ||
  errors.description ||
  errors.totalMarks ||
  Assignment.title.trim() === "" ||
  Assignment.description.trim() === "" ||
  Assignment.totalMarks <= 0 ||
  (Assignment.type === "FILE_UPLOAD" && Assignment.maxFileSize === "");

const buildAssignmentPayload = () => {
  const basePayload = { ...Assignment };

  switch (Assignment.type) {
    case "QA":
      return {
        ...basePayload,
        questions: AssignmentQuestion.filter((q) => q.questionText.trim() !== ""),
      };
    case "QUIZ":
      return {
        ...basePayload,
        totalMarks: savedQuestions.length,
        questions: savedQuestions,
      };
    default:
      return basePayload;
  }
};

const handleSubmit = async () => {
  if (isFormInvalid) {
    return MySwal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please fill all required fields correctly.",
    });
  }

  const payload = buildAssignmentPayload();

  try {
    const response = await axios.post(
      `${baseUrl}/Assignment/save?courseId=${courseId}`,
      payload,
      {
        headers: { Authorization: token },
      }
    );

    if (response.status === 200) {
      await MySwal.fire({
        icon: "success",
        title: "Assignment Created",
        text: "The assignment has been successfully created!",
      });
      setAssignment({ title: "", description: "", totalMarks: 10 });
      setAssignmentQuestion(Array(5).fill({ questionText: "" }));
      navigate(`/Assignment/getAll/${courseName}/${courseId}`);
    } else if (response?.status === 204) {
      await MySwal.fire({
        icon: "warning",
        title: "Not Found",
        text: "Course Not Found",
      });
      navigate("/dashboard/course");
    }
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) {
      return navigate("/unauthorized");
    }

    if (status === 403) {
      return MySwal.fire({
        icon: "error",
        title: "Forbidden",
        text: error?.response?.data || "You can't access this course",
      }).then((result) => {
        if (result.isConfirmed) navigate(-1);
      });
    }

    MySwal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "Failed to create assignment",
    });
  }
};


  return (
    <div>
      <div className="page-header">
        <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Assignment</h5>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="#" onClick={() => navigate("/dashboard/course")}>
                    <i className="feather icon-layout"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={() => navigate("/dashboard/course")}>
                    {courseName}
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Create Assignment</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {!showAddQuestion ? (
        <div className="row">
          <div className="col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="navigateheaders">
                  <div onClick={() => navigate(-1)}>
                    <i className="fa-solid fa-arrow-left"></i>
                  </div>
                  <div></div>
                  <div onClick={() => navigate(-1)}>
                    <i className="fa-solid fa-xmark"></i>
                  </div>
                </div>
                <h4>Create Assignment</h4>

                <div className="vh-50-overflow mt-4">
                  <div className="form-group row">
                    <label htmlFor="title" className="col-sm-3 col-form-label">
                      Assignment Title <span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={Assignment.title}
                        className={`form-control ${
                          errors.title && "is-invalid"
                        }`}
                        placeholder="Assignment Title"
                        onChange={handleAssignmentChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.title}</div>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="description"
                      className="col-sm-3 col-form-label"
                    >
                      Assignment Description{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-6">
                      <textarea
                        id="description"
                        rows={3}
                        name="description"
                        value={Assignment.description}
                        maxLength="1000"
                        className={`form-control ${
                          errors.description && "is-invalid"
                        }`}
                        placeholder="Assignment description"
                        onChange={handleAssignmentChange}
                      />
                      <div className="invalid-feedback">
                        {errors.description}
                      </div>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-sm-3 col-form-label">
                      Assignment Type <span className="text-danger">*</span>
                    </label>

                    <div
                      className={`row ${
                        Assignment.type === "FILE_UPLOAD"
                          ? "col-sm-9"
                          : "col-sm-6"
                      }`}
                    >
                      {/* Assignment Type Dropdown */}
                      <select
                        style={{ height: "40px" }}
                        className=" col ml-3 btn  btn-primary"
                        value={Assignment.type}
                        onChange={(e) =>
                          setAssignment({
                            ...Assignment,
                            type: e.target.value,
                            maxFileSize:
                              e.target.value === "FILE_UPLOAD"
                                ? Assignment.maxFileSize
                                : "", // reset
                          })
                        }
                      >
                        <option value="QA">Written Response</option>
                        <option value="QUIZ">Multiple Choice Quiz</option>
                        <option value="FILE_UPLOAD">Document Submission</option>
                      </select>

                      {/* Max File Size Input (only for FILE_UPLOAD) */}
                      {Assignment.type === "FILE_UPLOAD" && (
                        <div className="mt-2 col row">
                          <label className="form-label col-sm-4">
                            Max File Size (MB)
                          </label>
                          <input
                            type="number"
                            className="form-control col"
                            placeholder="Enter max file size"
                            min="1"
                            value={Assignment.maxFileSize}
                            onChange={(e) =>
                              setAssignment({
                                ...Assignment,
                                maxFileSize: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                 

            {Assignment?.type!="QUIZ" && 
            
             <div className="form-group row">
                    <label
                      htmlFor="totalMarks"
                      className="col-sm-3 col-form-label"
                    >
                      Total Marks <span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="number"
                        id="totalMarks"
                        name="totalMarks"
                        maxLength={100}
                        value={Assignment.totalMarks}
                        className={`form-control ${
                          errors.totalMarks && "is-invalid"
                        }`}
                        placeholder="Total Marks"
                        onChange={handleAssignmentChange}
                      />
                      <div className="invalid-feedback">
                        {errors.totalMarks}
                      </div>
                    </div>
                  </div>
                  

                  }

                  {Assignment?.type === "FILE_UPLOAD" && (
  <p>
    <strong>📄 Viewable on site:</strong> .txt, .csv, application/json, .pdf, .jpg, .jpeg, .png, .gif, .bmp, .tiff, .mp4, .mov, .avi, .webm.<br />
    <strong>📁 Upload only (cannot be viewed on site):</strong> .doc, .docx, .ppt, .pptx, .xls, .xlsx, .zip — please download and open with appropriate software.
  
  </p>
)}



                </div>

                <div className="cornerbtn">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleQuestionButtonClick}
                    disabled={isFormInvalid}
                  >
                    {Assignment.type === "FILE_UPLOAD" ? "Submit" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        Assignment.type === "QA" ? (
          <AddQuestionToAssignment
            AssignmentQuestion={AssignmentQuestion}
            setAssignmentQuestion={setAssignmentQuestion}
            setShowAddQuestion={setShowAddQuestion}
            handleSubmit={handleSubmit}
          />
        ) : Assignment.type === "QUIZ" ? (
          <AddQuizzToAssignment
            savedQuestions={savedQuestions}
            setSavedQuestions={setSavedQuestions}
            setShowAddQuestion={setShowAddQuestion}
            handleSubmit={handleSubmit}
          />
        ) : (
          <div>Unsupported assignment type</div>
        )  )}
    </div>
  );
};

export default CreateAssignment;
