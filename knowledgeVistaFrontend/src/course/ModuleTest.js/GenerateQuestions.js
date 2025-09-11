import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
import Swal from "sweetalert2";
import useGlobalNavigation from "../../AuthenticationPages/useGlobalNavigation";

const GenerateQuestions = () => {
  const navigate = useNavigate();
  const { courseName, courseId } = useParams();
  const [testName, setTestName] = useState(`${courseName} Test`);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [lessonId, setLessonId] = useState(null);
  const [QuestionCount, setQuestionCount] = useState(2);
  const [showPreview, setshowPreview] = useState(false);
  const [noofattempt, setNoOfAttempt] = useState(1);
  const [passPercentage, setPassPercentage] = useState(40);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState({
    option1: "",
    option2: "",
    option3: "",
    option4: ""
  });
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState({
    noofattempt: "",
    passPercentage: "",
    testName: '',
    questionText: '',
    options: {
      option1: '',
      option2: '',
      option3: '',
      option4: ''
    },
    answer: ''
  });
  const token = sessionStorage.getItem('token');
  const [isManualMode, setIsManualMode] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const fetchLessonId = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get/lessonIdBycourseID/${courseId}`, {
        headers: {
          Authorization: token,
        }
      });
      if (response?.status === 200) {
        const lessons = response?.data;
        setLessonsList(lessons);
        if (lessons?.length > 0) {
          setLessonId(lessons[0].lessonId);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchLessonId();
  }, []);

  const generateQuestions = async () => {
    setLoading(true);
    setIsManualMode(false);
    try {
      const response = await fetch(`${baseUrl}/generate/stream/${lessonId}/${QuestionCount}`, {
        headers: {
          Authorization: token
        }
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
      const newQuestions = parseQuestions(result);
      // Add isSelected property to each question
      setQuestions(prev => [
        ...prev,
        ...newQuestions.map(q => ({ ...q, isSelected: false }))
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseQuestions = (text) => {
    try {
      const parsed = JSON.parse(text);
      return parsed.map((q) => {
        const optionsObj = {};
        if (Array.isArray(q.options)) {
          q.options.forEach((opt, idx) => {
            optionsObj[`option${idx + 1}`] = opt.trim();
          });
        }
        return {
          questionText: q.questionText?.trim() ?? "",
          options: optionsObj,
          answer: q.answer?.trim() ?? "",
        };
      });
    } catch (e) {
      console.error("❌ Failed to parse questions JSON:", e);
      return [];
    }
  };

  const handleSelect = (index) => {
    setSelectedIndex(index);
  };

  useEffect(() => {
    if (selectedIndex !== null && questions[selectedIndex]) {
      setQuestionText(questions[selectedIndex].questionText || "");
      setOptions(questions[selectedIndex].options ? { ...questions[selectedIndex].options } : {
        option1: "",
        option2: "",
        option3: "",
        option4: ""
      });
      setAnswer(questions[selectedIndex].answer || "");
      setErrors({ questionText: '', options: { option1: '', option2: '', option3: '', option4: '' }, answer: '' });
    }
  }, [selectedIndex]);

  const handleQuestionTextChange = (e) => {
    setQuestionText(e.target.value);
    setErrors((prev) => ({ ...prev, questionText: e.target.value.trim() === '' ? 'This field is required' : '' }));
  };
  const handleOptionChange = (e, key) => {
    const newOptions = { ...options, [key]: e.target.value };
    setOptions(newOptions);
    setErrors((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: e.target.value.trim() === '' ? 'Option cannot be empty' : '' }
    }));
  };

  const handleApprove = () => {
    let hasError = false;
    const newErrors = {
      questionText: '',
      options: { option1: '', option2: '', option3: '', option4: '' },
      answer: ''
    };

    if (!questionText.trim()) {
      newErrors.questionText = 'This field is required.';
      hasError = true;
    }
    Object.keys(options).forEach((key) => {
      if (!options[key].trim()) {
        newErrors.options[key] = 'Option cannot be empty.';
        hasError = true;
      }
    });
    if (!answer.trim()) {
      newErrors.answer = 'Please select the correct answer.';
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    const approved = {
      questionText,
      options: { ...options },
      answer,
      isSelected: true
    };

    if (!isManualMode && selectedIndex !== null) {
      // Approve current question
      setQuestions((prev) => {
        const updated = [...prev];
        updated[selectedIndex] = { ...approved };
        return updated;
      });

      setSelectedQuestions((prev) => {
        // If already present, update; else add
        const existsIdx = prev.findIndex(q => q.questionText === questionText);
        if (existsIdx !== -1) {
          const updated = [...prev];
          updated[existsIdx] = approved;
          return updated;
        }
        return [...prev, approved];
      });

      // Find next unapproved question
      const total = questions.length;
      const nextUnapprovedIdx = questions.findIndex((q, i) =>
        i !== selectedIndex && !q.isSelected
      );

      if (nextUnapprovedIdx !== -1) {
        setSelectedIndex(nextUnapprovedIdx);
      } else {
        // No more AI questions left, switch to manual mode
        setSelectedIndex(null);
        setIsManualMode(true);
        setQuestionText('');
        setOptions({ option1: '', option2: '', option3: '', option4: '' });
        setAnswer('');
      }
    } else {
      // Manual mode approve flow
      setQuestions((prev) => [
        ...prev,
        approved
      ]);
      setSelectedQuestions((prev) => [...prev, approved]);
      setSelectedIndex(null);
      setIsManualMode(true);
      setQuestionText('');
      setOptions({ option1: '', option2: '', option3: '', option4: '' });
      setAnswer('');
    }
  };

  const handleReject = () => {
    if (selectedIndex !== null) {
      setQuestions((prevQuestions) => prevQuestions.filter((_, idx) => idx !== selectedIndex));
      setSelectedQuestions((prevQuestions) => prevQuestions.filter((_, idx) => idx !== selectedIndex));
      setSelectedIndex(null);
      setQuestionText("");
      setOptions({
        option1: "",
        option2: "",
        option3: "",
        option4: ""
      });
      setAnswer("");
    }
  };

  const handleTestNameChange = (e) => {
    const { value } = e.target;
    setTestName(value);
    if (value.trim() === '') {
      setErrors(prevErrors => ({
        ...prevErrors,
        testName: 'This field is required'
      }));
    }
    if (testName.length > 50) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        testName: 'Test name cannot be more than 50 characters.',
      }));
      return;
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        testName: ''
      }));
    }
  };

  const handleUnselect = (index) => {
    setSelectedQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setshowPreview(false);
      return updated;
    });
    setQuestions((prev) => {
      
      const updated = prev.filter((_, i) => i !== index);
      return updated;
     
    });
  };

  const handleCriteriaChange = (e) => {
    const { name, value } = e.target;
    let error = "";

    const numericValue = name === "noofattempt" || name === "passPercentage" ? parseFloat(value) : value;

    switch (name) {
      case "noofattempt":
        error = numericValue < 1 ? "Number of attempt must be at least 1." : "";
        setNoOfAttempt(numericValue);
        break;
      case "passPercentage":
        error = numericValue < 1 || numericValue > 100 ? "Pass percentage must be between 1 and 100." : "";
        setPassPercentage(numericValue);
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const questionsToSend = selectedQuestions.map(q => ({
        questionText: q.questionText,
        option1: q.options.option1,
        option2: q.options.option2,
        option3: q.options.option3,
        option4: q.options.option4,
        answer: q.answer
      }));

      const noOfQuestions = questionsToSend.length;
      const requestBody = {
        testName,
        questions: questionsToSend,
        noOfQuestions,
        noofattempt,
        passPercentage
      };
      const res = JSON.stringify(requestBody);

      const response = await axios.post(`${baseUrl}/test/create/${courseId}`, res, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        }
      });

      setSelectedQuestions([]);
      setTestName("");

      Swal.fire({
        title: "Created .!",
        text: "Test Created SuccessFully.!",
        icon: "success",
        confirmButtonText: "OK"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/course/testlist/${courseName}/${courseId}`);
        }
      });

    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/unauthorized");
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    if (!isManualMode && questions.length > 0) {
      const firstUnapprovedIdx = questions.findIndex((q) => !q.isSelected);
      if (firstUnapprovedIdx !== -1) {
        setSelectedIndex(firstUnapprovedIdx);
      }
    }
  }, [questions, isManualMode]);

  const handleManualMode = () => {
    setIsManualMode(true);
    setQuestionText("");
    setOptions({
      option1: "",
      option2: "",
      option3: "",
      option4: ""
    });
    setAnswer("");
    setErrors({ questionText: '', options: { option1: '', option2: '', option3: '', option4: '' }, answer: '' });
  };

  const getSortedQuestionIndexes = () => {
    const total = questions.length;
    const pending = [];
    const approved = [];
    for (let i = 0; i < total; i++) {
      if (questions[i].isSelected) {
        approved.push(i);
      } else {
        pending.push(i);
      }
    }
    return [...pending, ...approved];
  };

  const handleNavigation = useGlobalNavigation();

  return (
    <div>
      <div className="page-header"></div>
      <div className="card">
        <div className="card-body">
          <div className='navigateheaders'>
            <div onClick={handleNavigation}><i className="fa-solid fa-arrow-left"></i></div>
            <div></div>
            <div onClick={() => { navigate(-1) }}><i className="fa-solid fa-xmark"></i></div>
          </div>
          {showPreview ? (
            <>
              {selectedQuestions.length > 0 && (
                <>
                  <h4>Test Name : {testName}</h4>
                  <h6 className=" text-primary">Approved Questions</h6>
                  <div className="space-y-4">
                    {selectedQuestions.map((q, idx) => (
                      <div key={idx} className="rounded-xl p-4 border  relative">
                        <div className="alignright">
                          <button className="hidebtn " onClick={() => handleUnselect(idx)}>
                            <i className="fa-solid fa-trash text-danger"></i>
                          </button>
                        </div>
                        <h4 className="font-bold text-dark mb-2">{q.questionText}</h4>
                        <ol className="list-decimal pl-4 text-dark text-sm space-y-1">
                          {["option1", "option2", "option3", "option4"].map((key, i) => (
                            <li key={i}>{q.options[key]}</li>
                          ))}
                        </ol>
                        <div className="text-success text-sm mt-2">Answer: {q.answer}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Number of Attempt</label>
                <div className="col-sm-9">
                  <input
                    type="number"
                    value={noofattempt}
                    name="noofattempt"
                    className={`form-control ${errors.noofattempt && "is-invalid"}`}
                    onChange={handleCriteriaChange}
                  />
                  {errors.noofattempt && (
                    <div className="invalid-feedback">{errors.noofattempt}</div>
                  )}
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Pass Percentage</label>
                <div className="col-sm-9">
                  <input
                    type="number"
                    value={passPercentage}
                    name="passPercentage"
                    className={`form-control ${errors.passPercentage && "is-invalid"}`}
                    onChange={handleCriteriaChange}
                  />
                  {errors.passPercentage && (
                    <div className="invalid-feedback">{errors.passPercentage}</div>
                  )}
                </div>
              </div>
              <div className="cornerbtn">
                <button className="btn btn-secondary" onClick={() => { setshowPreview(false); }}>
                  back
                </button>
                <button onClick={handleSave} className="btn btn-primary" disabled={selectedQuestions.length <= 0 || !!errors.noofattempt ||
                  !!errors.passPercentage || !noofattempt ||
                  !passPercentage}>
                  <i className="fa-solid fa-floppy-disk mr-2"></i>Save Test
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="splitpart">
                <div className="splitpart1">
                  <div>
                    <h4>{isManualMode ? 'Add Question Manually' : 'Review AI-Generated Question'}</h4>
                    <div className="formgroup row p-2" >
                      <input
                        className={`form-control    ${errors.testName && 'is-invalid'}`}
                        value={testName}
                        placeholder="Test Name"
                        onChange={handleTestNameChange}
                      />
                      {errors.testName && <div className="invalid-feedback">{errors.testName}</div>}
                    </div>
                    <div className="formgroup row p-2 spanAndInputgrid" >
                      <span className="numberspan">
                        {isManualMode
                          ? `${questions.length + 1}.`
                          : `${selectedIndex !== null ? selectedIndex + 1 : questions.length + 1}.`}
                      </span>
                      <textarea
                        rows={3}
                        className={`form-control ${errors.questionText && 'is-invalid'}`}
                        type="text"
                        value={questionText}
                        placeholder="Add Question here"
                        onChange={handleQuestionTextChange}
                        required
                      />
                      {errors.questionText && <div className="invalid-feedback">{errors.questionText}</div>}
                    </div>
                    {/* Options with radio for answer selection */}
                    <ul className='listgroup'>
                      {["option1", "option2", "option3", "option4"].map((key, index) => (
                        <li className='choice' key={key}>
                          <input
                            className='mt-2'
                            type="radio"
                            name="answer"
                            value={options[key]}
                            checked={options[key] !== "" && answer === options[key]}
                            onChange={() => {
                              setAnswer(options[key]);
                              setErrors((err) => ({
                                ...err,
                                answer: "",
                              }));
                            }}
                            required
                          />
                          <div>
                            <input
                              className={`form-control   ${errors.options[key] && 'is-invalid'}`}
                              type="text"
                              value={options[key]}
                              placeholder={`Option ${index + 1}`}
                              onChange={(e) => handleOptionChange(e, key)}
                              required
                            />
                            {errors.options[key] && (
                              <div className="invalid-feedback">{errors.options[key]}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {errors.answer && <div className="text-danger mt-2 mb-1">{errors.answer}</div>}
                    <div className="atbtndiv">
                      <div>
                        <button onClick={handleApprove} className="btn btn-primary" style={{ width: "150px" }}>
                          <i className="fa-solid fa-check mr-2 "></i>Add
                        </button>
                      </div>
                      <div></div>
                      {!isManualMode && (
                        <button onClick={handleReject} className="btn btn-danger" style={{ width: "150px" }}>
                          <i className="fa-solid fa-trash mr-2 "></i>Reject
                        </button>
                      )}
                      {isManualMode && (
                        <button onClick={() => {
                          setQuestionText("");
                          setOptions({
                            option1: "",
                            option2: "",
                            option3: "",
                            option4: ""
                          });
                          setAnswer("");
                          setErrors({ questionText: '', options: { option1: '', option2: '', option3: '', option4: '' }, answer: '' });
                        }} className="btn btn-secondary" style={{ width: "150px" }}>
                          <i className="fa-solid fa-xmark mr-2 "></i>Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="splitpart2">
                  <div className="Questlist">
                    <div
                      style={{
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 0px",
                        borderBottom: "1px solid #e0e0e0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <select
                        title="select Lesson"
                        className="form-select me-3"
                        style={{
                          maxWidth: "250px",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          border: "1px solid #ced4da",
                        }}
                        value={lessonId}
                        onChange={e => setLessonId(e.target.value)}
                      >
                        {lessonsList.map((les) => (
                          <option key={les.lessonId} value={les.lessonId}>
                            {les.lessonTitle}
                          </option>
                        ))}
                      </select>
                      <select
                        title="select number of Questions to Generate "
                        className="form-select me-3"
                        style={{
                          width: "120px",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          border: "1px solid #ced4da",
                        }}
                        value={QuestionCount}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary d-flex align-items-center"
                        style={{
                          borderRadius: "8px",
                          padding: "8px 16px",
                          display: "flex",
                          gap: "8px",
                          fontWeight: "500",
                        }}
                        title="Generate Questions"
                        onClick={generateQuestions} disabled={!lessonId || loading}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Generate
                      </button>
                    </div>
                    <div className="QuestContent" >
                      {loading && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "40px",
                            color: "var(-primary)",
                            textAlign: "center",
                            animation: "fadeIn 0.5s ease-in-out",
                          }}
                        >
                          <div className="robot-spinner mb-4 mr-5"></div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 500 }} className="text-primary">
                            Generating questions with AI...
                          </div>
                          <div className="dots mt-2">
                            Thinking
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                          </div>
                        </div>
                      )}
                      {getSortedQuestionIndexes().map((idx) => {
                        const q = questions[idx];
                        const isApproved = q.isSelected;
                        return (
                          <div
                            key={idx}
                            onClick={() => { setIsManualMode(false); handleSelect(idx); }}
                            className={`p-2 pointer quest ${selectedIndex === idx ? "current-Quest" : ""}`}
                            style={{ position: "relative", background: isApproved ? '#e6ffe6' : '#fff' }}
                          >
                            <p>{q.questionText}</p>
                            {isApproved && (
                              <span style={{
                                position: "absolute",
                                top: 4,
                                right: 8,
                                color: "green",
                                fontSize: "1.2em"
                              }}>
                                <i className="fa-solid fa-check-circle"></i>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button className="btn btn-primary" onClick={handleManualMode}>
                      <i className="fa-solid fa-plus mr-2"></i>Add Manual Question
                    </button>
                  </div>
                </div>
              </div>
              <div className="cornerbtn">
                <div></div>
                <button className="btn btn-primary" onClick={() => {
                  setshowPreview(true);
                }} disabled={selectedQuestions.length <= 0 || !testName || errors.testName}>
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestions;