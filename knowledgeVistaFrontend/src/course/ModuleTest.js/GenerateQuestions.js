import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

function sanitizeAIOutput(text) {
  // Replace encoded tags with real tags
  text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // Fix common mismatched tags (e.g., <opt1>...</opt2> becomes <opt1>...</opt1>)
  text = text.replace(/(<opt1>.*?)(<\/opt[2-4]>)/gs, '$1</opt1>');
  text = text.replace(/(<opt2>.*?)(<\/opt[13-4]>)/gs, '$1</opt2>');
  text = text.replace(/(<opt3>.*?)(<\/opt[124]>)/gs, '$1</opt3>');
  text = text.replace(/(<opt4>.*?)(<\/opt[123]>)/gs, '$1</opt4>');

  // Optionally, remove any question blocks that are still malformed
  // (You can use a DOMParser or regex to only keep well-formed <question>...</question> blocks)

  return text;
}

const GenerateQuestions = () => {
  const navigate = useNavigate();
  const { courseName,courseId} = useParams();
  const [testName, setTestName] = useState(`${courseName} Test`);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [lessonsList,setLessonsList]=useState([]);
  const[lessonId,setLessonId]=useState(null);
  const[QuestionCount,setQuestionCount]=useState(2);
  const[showPreview,setshowPreview]=useState(false);
  const [noofattempt, setNoOfAttempt] = useState(1);
  const [passPercentage, setPassPercentage] = useState(40);
  const MySwal = withReactContent(Swal);
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
    testName:'',
    questionText: '',
    options: {
      option1: '',
      option2: '',
      option3: '',
      option4: ''
    },
    answer: ''
  });
const token=sessionStorage.getItem('token')
  const [isManualMode, setIsManualMode] = useState(true);

  const [selectedIndex, setSelectedIndex] = useState(null);

  // Instead of removing questions, track their status by index
  const [approvedIndexes, setApprovedIndexes] = useState([]);
  const fetchLessonId=async()=>{
    try{
    const response=await axios.get(`${baseUrl}/get/lessonIdBycourseID/${courseId}`,{
      headers:{
        Authorization:token,
      }
    });
    if(response?.status===200){
      const lessons = response?.data;
     setLessonsList(lessons);
      if (lessons?.length > 0) {
      setLessonId(lessons[0].lessonId); 
    }
    
    }
  }catch(error){
    console.error(error);
  }
}
useEffect(()=>{
fetchLessonId();
},[])

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/generate/stream/${lessonId}/${QuestionCount}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
      // Sanitize the AI output before parsing
      const sanitized = sanitizeAIOutput(result);
      const newQuestions = parseQuestions(sanitized);
      setQuestions(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseQuestions = (text) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(`<root>${text}</root>`, "text/xml");
    const questionNodes = xml.getElementsByTagName("question");
    const parsed = [];
    for (let q of questionNodes) {
      const options = {
        option1: q.getElementsByTagName("opt1")[0]?.textContent.trim() ?? "",
        option2: q.getElementsByTagName("opt2")[0]?.textContent.trim() ?? "",
        option3: q.getElementsByTagName("opt3")[0]?.textContent.trim() ?? "",
        option4: q.getElementsByTagName("opt4")[0]?.textContent.trim() ?? "",
      };
      let answer = q.getElementsByTagName("answer")[0]?.textContent.trim() ?? "";
      // Normalize answer if it's Option A/B/C/D
      if (/^Option [A-D]$/i.test(answer)) {
        const idx = "ABCD".indexOf(answer.slice(-1).toUpperCase());
        if (idx !== -1) {
          answer = options[`option${idx + 1}`];
        }
      }
      parsed.push({
        questionText: q.getElementsByTagName("questiontext")[0]?.textContent.trim() ?? "",
        options,
        answer,
      });
    }
    return parsed;
  };

  const handleSelect = (index) => {
    setSelectedIndex(index);
    setSelectedQuestion(questions[index]);
  };

  // When a question is selected, load its data into the controlled state
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

  // Handlers for controlled fields
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
 

  // Approve logic: validate and add to approved list (works for both generated and manual)
  const handleApprove = () => {
    let hasError = false;
    const newErrors = { questionText: '', options: { option1: '', option2: '', option3: '', option4: '' }, answer: '' };
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
      answer
    };
    if (!isManualMode && selectedIndex !== null) {
      setApprovedIndexes((prev) => prev.includes(selectedIndex) ? prev : [...prev, selectedIndex]);
      setSelectedQuestions((prevSelectedQuestions) => {
        const updatedSelected = [...prevSelectedQuestions];
        updatedSelected[selectedIndex] = approved;
        return updatedSelected;
      });
      // Move to next unapproved question
      setTimeout(() => {
        setSelectedIndex((prevIdx) => {
          const total = questions.length;
          let found = false;
          for (let i = (selectedIndex + 1) % total, count = 0; count < total; i = (i + 1) % total, count++) {
            if (!approvedIndexes.includes(i) && i !== selectedIndex) {
              setSelectedQuestion(questions[i]);
              found = true;
              return i;
            }
          }
          setSelectedQuestion(null);
          // If no more pending questions, enable manual mode
          setIsManualMode(true);
          return null;
        });
      }, 0);
    }
    if (isManualMode) {
      setQuestions((prevQuestions) => [...prevQuestions, approved]);
      setApprovedIndexes((prev) => [...prev, questions.length]);
      setSelectedQuestions((prevSelectedQuestions) => [...prevSelectedQuestions, approved]);
    }
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

  const handleReject = () => {
    if (selectedIndex !== null) {
      setQuestions((prevQuestions) => prevQuestions.filter((_, idx) => idx !== selectedIndex));
      setSelectedIndex(null);
      setSelectedQuestion(null);
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
  const handleTestNameChange =(e)=>{
    const { value } = e.target;
    setTestName(value)
    if (value.trim() === '') {
      setErrors(prevErrors => ({
          ...prevErrors,
          testName  : 'This field is required'
      }));
  }if (testName.length > 50) {
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
  }
  const handleUnselect = (index) => {
    // Remove from selectedQuestions
    setSelectedQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If no more selected questions, close preview
      if (updated.length === 0) setshowPreview(false);
      return updated;
    });
    // Remove from approvedIndexes
    setApprovedIndexes((prev) => prev.filter((i) => i !== index));
  };
  const handleCriteriaChange = (e) => {
    const { name, value } = e.target;
    let error = "";

    // Convert value to a number if it is an attempt count or percentage
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

    // Update error state
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error
    }));
  };

  

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
      const questionsToSend = selectedQuestions.map(q => ({
        questionText: q.questionText,
        option1: q.options.option1,
        option2: q.options.option2,
        option3: q.options.option3,
        option4: q.options.option4,
        answer: q.answer
      }));
  
   
      const noOfQuestions = questionsToSend.length; // Count the number of questions
      const requestBody = {
        testName,
        questions: questionsToSend,
        noOfQuestions,
        noofattempt,
        passPercentage
      };
  const res=JSON.stringify(requestBody)

      const response = await axios.post(`${baseUrl}/test/create/${courseId}`,res, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        }
      });

     
      // Reset state after successful submission
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
       if(error.response && error.response.status===401)
          {
            navigate("/unauthorized")
          }else{
            // MySwal.fire({
            //   title: "Error!",
            //   text: error.response,
            //   icon: "error",
            //   confirmButtonText: "OK",
            // });
            throw error
          }
    }
  };

  // Whenever questions, selectedQuestions, or rejectedQuestions change, set the first available question as selected
  useEffect(() => {
    if (questions.length > 0) {
      setSelectedIndex(0);
      setSelectedQuestion(questions[0]);
      setIsManualMode(false);
    } else {
      setSelectedIndex(null);
      setSelectedQuestion(null);
    }
  }, [questions, selectedQuestions]);

  // Handler for manual mode
  const handleManualMode = () => {
    setIsManualMode(true);
    setSelectedQuestion(null);
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

  // For rendering: sort questions by status: pending, approved
  const getSortedQuestionIndexes = () => {
    const total = questions.length;
    const pending = [];
    const approved = [];
    for (let i = 0; i < total; i++) {
      if (approvedIndexes.includes(i)) {
        approved.push(i);
      } else {
        pending.push(i);
      }
    }
    return [...pending, ...approved];
  };

  return (
    <div>
      <div className="page-header">
      </div>
<div className="card">
 
  <div className="card-body">
  <div className='navigateheaders'>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
     <div></div>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
      {showPreview ?
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
                    <i className="fa-solid fa-trash text-danger"  ></i>
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
            )}</div>
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
              <button className="btn btn-secondary" onClick={()=>{setshowPreview(false)}}>
                back
              </button>
              <button onClick={handleSave} className="btn btn-primary" disabled={selectedQuestions.length <= 0 || !!errors.noofattempt ||
                !!errors.passPercentage || !noofattempt ||
                !passPercentage}>
                <i className="fa-solid fa-floppy-disk mr-2"></i>Save Test
              </button>
            </div>
        </>: 
      <div>
    <div className="splitpart">
        <div className="splitpart1">
        {(selectedQuestion || isManualMode || questions.length === 0) ? (
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
            <div className="formgroup row p-2">
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
            {errors.answer && <div className="text-danger mt-2">{errors.answer}</div>}
            <div className="atbtndiv">
              <div>
              <button onClick={handleApprove} className="btn btn-primary" style={{width:"150px"}}>
                <i className="fa-solid fa-check mr-2 "></i>Approve
              </button>
              </div>
              <div></div>
              {!isManualMode && (
                <button onClick={handleReject} className="btn btn-danger" style={{width:"150px"}}>
                  <i className="fa-solid fa-trash mr-2 "></i>Reject
                </button>
              )}
              {isManualMode && (
                <button onClick={() => {
                  setSelectedQuestion(null);
                  setQuestionText("");
                  setOptions({
                    option1: "",
                    option2: "",
                    option3: "",
                    option4: ""
                  });
                  setAnswer("");
                  setErrors({ questionText: '', options: { option1: '', option2: '', option3: '', option4: '' }, answer: '' });
                }} className="btn btn-secondary" style={{width:"150px"}}>
                  <i className="fa-solid fa-xmark mr-2 "></i>Cancel
                </button>
              )}
            </div>
          </div>
        ) : null}

       
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
      color: "var(-primary)", // Uses your Bootstrap primary color
      textAlign: "center",
      animation: "fadeIn 0.5s ease-in-out",
    }}
  >
    {/* Robot-themed dual ring spinner */}
    <div className="robot-spinner mb-4 mr-5"></div>

    {/* AI generation text */}
    <div style={{ fontSize: "1.25rem", fontWeight: 500 }} className="text-primary">
      Generating questions with AI...
    </div>

    {/* Animated "Thinking..." dots */}
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
            const isApproved = approvedIndexes.includes(idx);
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
                            <button className="btn btn-primary" onClick={()=>{
                              setshowPreview(true);
                            }} disabled={selectedQuestions.length <= 0 || !testName ||errors.testName}>
                                Preview
                            </button>
                        </div>
                        </div>}
    </div>
    </div>
    </div>
  );
};

export default GenerateQuestions;
