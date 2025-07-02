import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils.js";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import EditQuestionAssignment from "./EditQuestionAssignment.js";

const EditAssignment = () => {
  const { courseName, courseId, assignmentId } = useParams();
  const token = sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [AssignmentQuestion, setAssignmentQuestion] = useState(
    Array(5).fill({ questionText: "" })
  );
  const [Assignment, setAssignment] = useState({
    title: "",
    description: "",
    totalMarks: 10,
    type: "",
    maxFileSize: ""
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    totalMarks: "",
    type: "",
    maxFileSize: "",
  });
  const getAssignment = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/Assignment/get?assignmentId=${assignmentId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 200) {
        setAssignment(response?.data);
        setAssignmentQuestion(response?.data?.questions);
      }else if(response.status === 204){
        MySwal.fire({
          title: " Not Found!",
          text:"Assignment Not Found",
          icon: "warning",
          confirmButtonText: "OK",
        }).then((result) => {
            navigate(-1);
        });
      }
    } catch (err) {
      if(err?.response?.status===401){
        navigate("/unauthorized")
    }else if (err?.response?.status===403){
        MySwal.fire({
            title: " Forbitten!",
            text: err?.response?.data,
            icon: "warning",
            confirmButtonText: "OK",
          }).then((result) => {
              navigate(-1);
          });
    }else{
    console.log(err)
    throw err
    }
    }
  };
  useEffect(() => {
    getAssignment();
  }, []);
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
      } else {
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

  const isFormInvalid =
    errors.title ||
    errors.description ||
    errors.totalMarks ||
    Assignment.title.trim() === "" ||
    Assignment.description.trim() === "" ||
    Assignment.type==="FILE_UPLOAD" && Assignment.maxFileSize===""||
    Assignment.totalMarks <= 0 ;
  const handleSubmit = async () => {
    if (isFormInvalid) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill all required fields correctly.",
      });
      return;
    }


    try {
      const response = await axios.patch(
        `${baseUrl}/Assignment/Edit?AssignmentId=${assignmentId}`,
        Assignment,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.status === 200) {
        MySwal.fire({
          icon: "success",
          title: "Assignment Updated",
          text: "The assignment has been successfully Updated!",
        }).then(() => {
          getAssignment();
        });
      } else if (response?.status === 204) {
        MySwal.fire({
          icon: "warning",
          title: " Not Found",
          text: "Course Not Found",
        }).then(() => getAssignment());
      }
    } catch (error) {
      if (error?.response.status === 401) {
        navigate("/unauthorized");
      } else if (error?.response.status === 403) {
        MySwal.fire({
          icon: "error",
          title: "Forbidden",
          text: error?.response?.data || "You Can't Access This Course",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(-1);
          }
        });
      } else {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to create assignment",
        });
      }
    }
  };
  const handleSaveQuestions = async () => {
    try {
      const cleanedQuestions = AssignmentQuestion.filter(
        (q) => q.questionText.trim() !== ""
      );
      
      if (cleanedQuestions.length === 0) {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Please add at least one valid question before submitting.",
        });
        return; // Stop further execution
      }
      const response = await axios.patch(
        `${baseUrl}/Assignment/EditQuestion?AssignmentId=${assignmentId}`,
        cleanedQuestions,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.status === 200) {
        MySwal.fire({
          icon: "success",
          title: "Questions Updated",
          text: "The Questions has been successfully Updated!",
        }).then(() => {
          getAssignment();
        });
      } else if (response?.status === 204) {
        MySwal.fire({
          icon: "warning",
          title: " Not Found",
          text: "Course Not Found",
        }).then(() => getAssignment());
      }
    } catch (error) {
      if (error?.response.status === 401) {
        navigate("/unauthorized");
      } else if (error?.response.status === 403) {
        MySwal.fire({
          icon: "error",
          title: "Forbidden",
          text: error?.response?.data || "You Can't Access This Course",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(-1);
          }
        });
      } else {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to create assignment",
        });
      }
    }
  };
  return (
    <div>
      <div className="page-header">
        <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Update Assignment</h5>
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
                  <a href="#">{Assignment?.title}</a>
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
                <div className="headingandbutton">
                  <h4>Update Assignment</h4>
                  {Assignment.type != "FILE_UPLOAD" && (
  <button
    className="btn btn-primary"
    style={{ width: "150px" }}
    onClick={() => setShowAddQuestion(true)}
  >
   Questions
  </button>
)}

                </div>

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

  <div className={`row ${
        Assignment.type === "FILE_UPLOAD" ? "col-sm-9" : "col-sm-6"
      }`} >
    {/* Assignment Type Dropdown */}
    <select
    style={{height:"40px"}}
      className=" col ml-3 btn  btn-primary"
      value={Assignment.type}
      // onChange={(e) =>
      //   setAssignment({
      //     ...Assignment,
      //     type: e.target.value,
      //     maxFileSize: e.target.value === "FILE_UPLOAD" ? Assignment.maxFileSize : "", // reset
      //   })
      // }
      disabled
    >
      <option value="QA">Written Response</option>
      <option value="QUIZ">Multiple Choice Quiz</option>
      <option value="FILE_UPLOAD">Document Submission</option>
    </select>

    {/* Max File Size Input (only for FILE_UPLOAD) */}
    {Assignment.type === "FILE_UPLOAD" && (
      <div className="mt-2 col row" >
        <label className="form-label col-sm-4">Max File Size (MB)</label>
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
                  </div>}
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
                    onClick={handleSubmit}
                    disabled={isFormInvalid}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EditQuestionAssignment
          AssignmentQuestion={AssignmentQuestion}
          setAssignmentQuestion={setAssignmentQuestion}
          setShowAddQuestion={setShowAddQuestion}
          handleSaveQuestions={handleSaveQuestions}
          getAssignment={getAssignment}
          Assignment={Assignment}
        />
      )}
    </div>
  );
};

export default EditAssignment;
