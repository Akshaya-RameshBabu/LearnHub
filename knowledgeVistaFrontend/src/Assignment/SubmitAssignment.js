import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate, useParams } from "react-router-dom";
import baseUrl from "../api/utils";
import FileViewer from "./FileViewer";
import SubmitAssignmentQuizz from "./SubmitAssignmentQuizz";
import ValidateQuizz from "./ValidateQuizz";

const SubmitAssignment = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const {  batchId, AssignmentId } = useParams();
  const MySwal = withReactContent(Swal);
  const [Assignment, setAssignment] = useState();
  const token = sessionStorage.getItem("token");
  const [answers, setAnswers] = useState({});
  const [existingSubmission, setexistingSubmission] = useState({});
  const [loading, setLoading] = useState();
  const [data, setdata] = useState(null);
  const [errors, setErrors] = useState("");
  const handleInputChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };
  const maxSizeInBytes = Assignment?.maxFileSize * 1024 * 1024; // convert MB to bytes

  const handleSubmit = async () => {
    try {
      if (Assignment?.type === "FILE_UPLOAD" && !selectedFile) {
        MySwal.fire({
          title: "Missing File",
          text: "Please select a file before submitting.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }
  
      const formData = new FormData();
      formData.append("assignmentId", AssignmentId);
      formData.append("batchId", batchId);
  
      if (Assignment?.type === "QA" || Assignment?.type === "QUIZ") {
        formData.append("answers", JSON.stringify(answers));
      }
  
      if (Assignment?.type === "FILE_UPLOAD") {
        formData.append("file", selectedFile);
      }
  
      const response = await axios.post(`${baseUrl}/Assignment/Submit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      });
  
      if (response?.status === 200) {
        MySwal.fire({
          title: "Success!",
          text: "Assignment submitted successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/view/MyAssignments");
        });
      }
    } catch (err) {
      if (err?.response?.status === 403 || err?.response?.status === 400) {
        MySwal.fire({
          title: "Submission Failed",
          text: err?.response?.data,
          icon: "warning",
          confirmButtonText: "OK",
        });
      } else if (err?.response?.status === 401) {
        navigate("/unauthorized");
      } else {
        MySwal.fire({
          title: "Error",
          text: "Something went wrong while submitting the assignment.",
          icon: "error",
          confirmButtonText: "OK",
        });
        console.error(err);
      }
    }
  };
  
  

  const getAssignment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseUrl}/Assignment/getSubmission?assignmentId=${AssignmentId}&batchId=${batchId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 200) {
        setdata(response?.data);
        setAssignment(response?.data?.assignment);
        if (response?.data?.existingSubmission) {
          setexistingSubmission(response?.data?.existingSubmission);
        }
        if (response?.data?.existingSubmission?.answers) {
          setAnswers(response?.data?.existingSubmission?.answers);
        }
      } else if (response.status === 204) {
        MySwal.fire({
          title: " Not Found!",
          text: "Assignment Not Found",
          icon: "warning",
          confirmButtonText: "OK",
        }).then((result) => {
          navigate(-1);
        });
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/unauthorized");
      } else if (err?.response?.status === 403) {
        MySwal.fire({
          title: " Forbitten!",
          text: err?.response?.data,
          icon: "warning",
          confirmButtonText: "OK",
        }).then((result) => {
          navigate(-1);
        });
      } else {
        console.log(err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getAssignment();
  }, []);

  // Drag-over: Prevent default to allow drop
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // On Drop
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.size <= maxSizeInBytes) {
        setSelectedFile(file);
        setErrors("");
      } else {
        setErrors(`File size should not exceed ${Assignment.maxFileSize} MB.`);
      }
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size <= maxSizeInBytes) {
        setSelectedFile(file);
        setErrors("");
      } else {
        setErrors(`File size should not exceed ${Assignment.maxFileSize} MB.`);
      }
    }
  };
  const isSubmitDisabled =
  errors || // your existing validation errors
 (Assignment?.type === "QA" ||Assignment?.type==="QUIZ") &&
  Assignment?.questions?.some((q) => !answers[q.id] || answers[q.id].trim() === "");

  return (
    <div>
      <div className="page-header"></div>
      <div className="row">
        <div className="col-sm-12">
          <div className="card min-vh-80">
            <div className="card-body">
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
                    navigate(-1);
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </div>
              </div>
              {loading ? (
                <div className="outerspinner active">
                  <div className="spinner"></div>
                </div>
              ) : Object.keys(existingSubmission).length === 0 ? (
                <div>
                  <div className="mb-4">
                    <h4 className="text-primary">{Assignment?.title}</h4>
                    <p className="text-muted text-indend-2em">
                      {Assignment?.description}
                    </p>
                    <p>
                      <strong>Total Marks:</strong> {Assignment?.totalMarks}
                    </p>
                  </div>
                  {Assignment?.type === "QA" ? (
                    <div>
                      {Assignment?.questions.map((q, idx) => (
                        <div className="mb-3" key={q.id}>
                          <label className="form-label">
                            {idx + 1}. {q?.questionText}
                          </label>
                          <textarea
                            rows={3}
                            className="form-control"
                            placeholder="Type your answer here..."
                            value={answers[q?.id] || ""}
                            maxLength={5000}
                            onChange={(e) =>
                              handleInputChange(q?.id, e.target.value)
                            }
                          />
                          <div className="text-end">
                            <small className="text-muted">
                              {answers[q?.id]?.length || 0}/5000 characters
                            </small>
                          </div>
                        </div>
                      ))}
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
                    <button
                      className="btn btn-primary"
                      disabled={isSubmitDisabled}
                      onClick={handleSubmit}
                    >
                      Submit
                    </button>
                  </div>
                    </div>
                  ) : Assignment?.type === "QUIZ" ? (
                    <SubmitAssignmentQuizz questions={Assignment?.questions} handleInputChange={handleInputChange} handleSubmit={handleSubmit} answers={answers}/>
                  ) :  Assignment?.type === "FILE_UPLOAD"?(
                    <div>
                      <div
                        className="dropzone"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                          border: "2px dashed #ccc",
                          padding: "20px",
                          textAlign: "center",
                          borderRadius: "10px",
                        }}
                      >
                        <p>Drag and drop a file here</p>
                        <p>or</p>
                        <label
                          htmlFor="fileupload"
                          className="file-upload-btn "
                          style={{
                            cursor: "pointer",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "5px",
                          }}
                        >
                          Upload File
                        </label>
                        <input
                          type="file"
                          className="file-upload"
                          id="fileupload"
                          name="file"
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp4,.mov,.avi,.webm,.zip"
                          style={{ display: "none" }}
                          onChange={handleFileInputChange}
                        />
                        {errors && (
                          <p style={{ color: "red", marginTop: "10px" }}>
                            {errors}
                          </p>
                        )}
                        <p>
                          {" "}
                          <small
                            style={{
                              fontSize: "0.9rem",
                              color: "#555",
                              marginTop: "4px",
                            }}
                          >
                            Supported file types: .pdf, .doc, .docx, .txt, .ppt,
                            .pptx, .xls, .xlsx, .csv, .jpg, .jpeg, .png, .gif,
                            .bmp, .tiff, .mp4, .mov, .avi, .webm, .zip
                            <br />
                            Max file size: {Assignment?.maxFileSize} MB
                          </small>
                        </p>

                        {selectedFile && (
                          <p>
                            <strong>Selected:</strong> {selectedFile.name}
                          </p>
                        )}
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
                    <button
                      className="btn btn-primary"
                      disabled={errors}
                      onClick={handleSubmit}
                    >
                      Submit
                    </button>
                  </div></div>
                  ):<div><p>Some Error Occured .... Try again later</p>
                  <small>Unknown Assignment Type </small>
                   </div>}

                  
                </div>
              ) : (
                <div>
                  <div className="mb-4 ">
                    <h4 className="text-primary">{Assignment?.title}</h4>
                    <div className="mt-4 p-3 border rounded bg-light mb-3">
                      {existingSubmission ? (
                        <>
                          <p>
                            <strong>Status:</strong>{" "}
                            <span
                              className={
                                existingSubmission.submissionStatus ===
                                "SUBMITTED"
                                  ? "text-success"
                                  : existingSubmission?.submissionStatus ===
                                    "NOT_SUBMITTED"
                                  ? "text-danger"
                                  : existingSubmission?.submissionStatus ===
                                    "VALIDATED"
                                  ? "text-success"
                                  : existingSubmission?.submissionStatus ===
                                    "LATE_SUBMISSION"
                                  ? "text-warning"
                                  : ""
                              }
                            >
                              {existingSubmission?.submissionStatus?.replace(
                                "_",
                                " "
                              )}
                            </span>
                          </p>
                          <p>
                            <strong>Submitted At:</strong>{" "}
                            {new Date(
                              existingSubmission?.submittedAt
                            )?.toLocaleString()}
                          </p>
                          {existingSubmission.graded ? (
                            <>
                              <p>
                                <strong>Marks Obtained:</strong>{" "}
                                {existingSubmission?.totalMarksObtained} /{" "}
                                {Assignment?.totalMarks}
                              </p>
                              <p>
                                <strong>Trainer Feedback:</strong>{" "}
                                {existingSubmission?.feedback ||
                                  "No feedback provided"}
                              </p>
                            </>
                          ) : (
                            <p className="text-primary">
                              Your assignment has been submitted successfully
                              and is awaiting validation by the trainers.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-danger">
                          You have not submitted this assignment yet.
                        </p>
                      )}
                    </div>
                    <p className="text-muted text-indend-2em">
                      {Assignment?.description}
                    </p>
                    <p>
                      <strong>Total Marks:</strong> {Assignment?.totalMarks}
                    </p>
                  </div>

                  {Assignment.type === "QA" ? (
                    <div>
                      {Assignment?.questions.map((q, idx) => (
                        <div className="mb-3" key={q.id}>
                          <label className="form-label">
                            {idx + 1}. {q?.questionText}
                          </label>
                          <textarea
                            rows={3}
                            className="form-control"
                            value={answers[q?.id] || ""}
                            maxLength={5000}
                            readOnly
                          />
                          <div className="text-end">
                            <small className="text-muted">
                              {answers[q?.id]?.length || 0}/5000 characters
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : Assignment.type === "FILE_UPLOAD" ? (
                    <div className="submission-info">
                      <div className="submission-row">
                        <span className="label">📁 File Name :</span>
                        <p className="text-blue">
                          {existingSubmission?.fileName?.split("_")[1]}
                        </p>
                        {data?.fileBase64 && data?.fileMimeType && (
                          <div
                            className="file-preview"
                            style={{ marginTop: "1rem" }}
                          >
                            <FileViewer
                              mimeType={data?.fileMimeType}
                              base64={data?.fileBase64}
                              fileName={
                                existingSubmission?.fileName?.split("_")[1]
                              }
                            />
                          </div>
                        )}
                      </div>

                      <div className="submission-row">
                        <span className="label">🕒 Submitted At :</span>
                        <span>
                          {new Date(
                            existingSubmission.submittedAt
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : Assignment.type === "QUIZ" ? (
                    <ValidateQuizz answers={answers} Assignment={Assignment}/>
                 ):<div><p>Some Error Occured .... Try again later</p>
                  <small>Unknown Assignment Type </small>
                   </div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
