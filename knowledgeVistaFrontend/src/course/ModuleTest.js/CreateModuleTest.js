import { useEffect, useState } from "react";
import React from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate, useParams } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
import useGlobalNavigation from "../../AuthenticationPages/useGlobalNavigation";
const CreateModuleTest = () => {
    const navigate=useNavigate();
    const { courseName,courseId} = useParams();
    const MySwal = withReactContent(Swal);
    const [query, setQuery] = useState("");
    const [mtestName, setmtestName] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [answer, setAnswer] = useState('');
    const [savedQuestions, setSavedQuestions] = useState([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [mnoofattempt, setmnoofattempt] = useState(1);
    const [mpassPercentage, setmpassPercentage] = useState(100);
    const [showCriteria, setShowCriteria] = useState(false);
    const token=sessionStorage.getItem("token")
    const[Lessons,setLessons]=useState([])
    const[selectedLessons,setselectedLessons]=useState([])
    const [errors, setErrors] = useState({
      mnoofattempt: "",
      mpassPercentage: "",
      mtestName:'',
      questionText: '',
      options: {
          option1: '',
          option2: '',
          option3: '',
          option4: ''
      },
      selectedOption: ''
    });
  
  
  
   const showprevious=(e)=>{
      const index=selectedQuestionIndex-1;
      if(index >=0){
      const { questionText, option1, option2, option3, option4, answer } = savedQuestions[index];
      setQuestionText(questionText);
      setOptions([option1, option2, option3, option4]);
      setAnswer(answer);
      setSelectedQuestionIndex(index)
      }
   }
   const shownext=(e)=>{
      const nextindex=selectedQuestionIndex+1;
      
      if(nextindex<savedQuestions.length){
          const { questionText, option1, option2, option3, option4, answer } = savedQuestions[nextindex];
      setQuestionText(questionText);
      setOptions([option1, option2, option3, option4]);
      setAnswer(answer);
      setSelectedQuestionIndex(nextindex)
  
      }
   }
    // Function to handle changes in mnoofattempt and mpassPercentage fields
    const handleCriteriaChange = (e) => {
      const { name, value } = e.target;
      let error = "";
  
      // Convert value to a number if it is an attempt count or percentage
      const numericValue = name === "mnoofattempt" || name === "mpassPercentage" ? parseFloat(value) : value;
  
      switch (name) {
        case "mnoofattempt":
          error = numericValue < 1 ? "Number of attempt must be at least 1." : "";
          setmnoofattempt(numericValue);
          break;
        case "mpassPercentage":
          error = numericValue < 1 || numericValue > 100 ? "Pass percentage must be between 1 and 100." : "";
          setmpassPercentage(numericValue);
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
  
    // Other functions such as handleDelete, handleEditQuestion, addQuestion, and submitTest remain unchanged
  
    const handleDelete = (index) => {
      const newSavedQuestions = savedQuestions.filter((ques, i) => i !== index);
      setSavedQuestions(newSavedQuestions);
      if(index!==0){
      setSelectedQuestionIndex(index-1)
      const { questionText, option1, option2, option3, option4, answer } = savedQuestions[index-1];
      setQuestionText(questionText);
      setOptions([option1, option2, option3, option4]);
      setAnswer(answer);
      }else{
          setSelectedQuestionIndex(0)
          setQuestionText("");
      setOptions(["", "", "", ""]);
      setAnswer("");
      }
    };
  
  
  
    const addQuestion = () => {
      // Check for errors in mtestName field
      if (!mtestName) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mtestName: 'This field is required.',
        }));
        return;
      } else if (mtestName.length > 50) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mtestName: 'Test name cannot be more than 50 characters.',
        }));
        return;
      }
    
      // Check for errors in questionText field
      if (!questionText) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          questionText: 'This field is required.',
        }));
        return;
      } else if (questionText.length > 1000) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          questionText: 'Question text cannot be more than 1000 characters.',
        }));
        return;
      }
      const optionErrors = {};
      options.forEach((option, index) => {
        if (!option.trim()) {
          optionErrors[index] = `Option ${index + 1} cannot be empty.`;
        } else if (option.length > 255) {
          optionErrors[index] = `Option ${index + 1} cannot be more than 255 characters.`;
        }
      });
    
      // If there are any option errors, set them and return
      if (Object.keys(optionErrors).length > 0) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          options: {
            ...prevErrors.options,
            ...optionErrors,
          },
        }));
        return;
      }
          if (!answer) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          selectedOption: 'Please select the correct answer.',
        }));
        return;
      } else if (answer.length > 255) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          selectedOption: 'Answer option cannot be more than 255 characters.',
        }));
        return;
      }
      // If no errors, proceed to add or update the question
      const newQuestion = {
        questionText: questionText,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        answer: answer
      };
    
      if (selectedQuestionIndex !== null) {
        const updatedQuestions = [...savedQuestions];
        updatedQuestions[selectedQuestionIndex] = newQuestion;
        setSavedQuestions(updatedQuestions);
        setSelectedQuestionIndex(prevIndex => prevIndex + 1);
      }
    
      // Clear input fields after adding or updating a question
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setAnswer("");
    
      // Reset the error state for all fields
      setErrors({
        ...errors,
        mtestName: '',
        questionText: '',
        selectedOption: '',
        options: {
          option1: '',
          option2: '',
          option3: '',
          option4: ''
      },
      });
    };
    
   
    const submitTest = async (e) => {
      e.preventDefault(); // Prevent page reload on form submission
  
      // Validation
      if (!mtestName.trim()) {
          setErrors((prevErrors) => ({ ...prevErrors, mtestName: "Test name is required" }));
          return;
      }
      if (savedQuestions.length === 0) {
          MySwal.fire("Error", "At least one question is required", "error");
          return;
      }
      if (selectedLessons.length === 0) {
          MySwal.fire("Error", "Select at least one lesson", "error");
          return;
      }
      if (mpassPercentage < 0 || mpassPercentage > 100) {
          MySwal.fire("Error", "Pass percentage must be between 0 and 100", "error");
          return;
      }
      
      const token = sessionStorage.getItem("token");
  
      // Prepare request payload
      const requestData = {
        moduleTest: {
            mtestName: mtestName,
            mnoOfAttempt: mnoofattempt,
            mpassPercentage: mpassPercentage,
            questions: savedQuestions,
        },
        lessonIds: selectedLessons.map(lesson => lesson.lessonId),  // Now sent in request body
        courseId: courseId,
    };
    
    try {
        const response = await axios.post(`${baseUrl}/ModuleTest/save`, requestData, {
          headers: {
                  Authorization: token,
              },
          });
  
          if (response.status===200) {
            setQuestionText("");
      setOptions(["", "", "", ""]);
      setAnswer("");
      setmpassPercentage(0)
      setmnoofattempt(0)
      setLessons([])
              MySwal.fire("Success", "Module test saved successfully!", "success");
              navigate(`/course/moduleTest/${courseName}/${courseId}`)
          } else if(response.status===204) {
              navigate("/dashboard/course")
          }
      } catch (error) {
          console.error("Error saving module test:", error);
          MySwal.fire("Error", "Something went wrong", "error");
      }
  };
  
    
  const handlemtestNameChange =(e)=>{
      const { value } = e.target;
      setmtestName(value)
      if (value.trim() === '') {
        setErrors(prevErrors => ({
            ...prevErrors,
            mtestName  : 'This field is required'
        }));
    }if (mtestName.length > 50) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        mtestName: 'Test name cannot be more than 50 characters.',
      }));
      return;
    }else if (e.target.value.includes("/") || e.target.value.includes("\\")){
      setErrors((prevErrors) => ({
        ...prevErrors,
        mtestName: " Title should not contain the '/' or '\' character"
      }));
      return;
      
     }  else {
        setErrors(prevErrors => ({
            ...prevErrors,
            mtestName: ''
        }));
    }
    }
    const handleQuestionTextChange = (e) => {
  
      setQuestionText(e.target.value)
  
      // Validate question text
      if (e.target.value.trim() === '') {
          setErrors(prevErrors => ({
              ...prevErrors,
              questionText: 'This field is required'
          }));
      }else if (questionText.length > 1000) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          questionText: 'Question text cannot be more than 1000 characters.',
        }));
        return;
      }else {
          setErrors(prevErrors => ({
              ...prevErrors,
              questionText: ''
          }));
      }
  };
  const handleselectanswer=(e)=>{
    const { value } = e.target;
    setAnswer(value)
    setErrors((prevErrors) => ({
      ...prevErrors,
      selectedOption: '',
    }));
  }
  const handleOptionChange = (e, index) => {
      const { value } = e.target;
  
      // Update the option value
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
  
      // Clear any previous error message for the current option
      const newErrors = { ...errors };
      newErrors.options[index] = '';
  
      // Perform validation for the current option
      if (!value.trim()) {
          newErrors.options[index] = 'Option cannot be empty';
      }else if (value.length > 255) {
        
          newErrors.options[index] = ' option cannot be more than 255 characters.';
     
      }
  
      // Update the state with new errors
      setErrors(newErrors);
  };
  
  const fetchLessons = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setLessons([]); // Clear suggestions if empty query
      return;
    }
    
    try {
      const response = await axios.get(`${baseUrl}/search/lesson/${courseId}`, {
        params: { query: searchQuery },
        headers: { Authorization: token },
      });
      setLessons(response.data); // Update Lessons list
    } catch (error) {
      console.error("Error fetching Lessons:", error);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchLessons(value); // Fetch search results
  };

  // Select a lesson
  const selectLesson = (lesson) => {
    if (!selectedLessons.some((l) => l.lessonId === lesson.lessonId)) {
      setselectedLessons([...selectedLessons, lesson]); // Add to selected list
    }
    setQuery(""); // Clear input
    setLessons([]); // Hide suggestions
  };

  // Remove selected lesson
  const removeLesson = (lessonId) => {
    setselectedLessons(selectedLessons.filter((l) => l.lessonId !== lessonId));
  };
  const handleNavigation = useGlobalNavigation();
    return (
      <div>
      <div className="page-header">
      <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">Create Test</h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#"onClick={handleNavigation} ><i className="feather icon-layout"></i></a></li>
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{navigate(`/course/moduleTest/${courseName}/${courseId}`)}}>Module Tests</a></li>
                            <li className="breadcrumb-item"><a href="#">Create </a></li>
                        </ul>
                       
                    </div>
                </div>
            </div>
      </div>
        {showCriteria ? (
           <div className="card">
          <div className="card-header">
         
            <div className='navigateheaders'>
        <div onClick={()=>{setShowCriteria(false)}}><i className="fa-solid fa-arrow-left"></i></div>
        <div></div>
        <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
        </div>
        <h4>Module Test Criteria</h4>
        </div>
        <div className="card-body">
            <div className="row">
            <div className="col-12">
          
            <p className="text-danger"><span>*</span> By default, each question carries one mark</p>
            
            <div className="form-group row">
                 <label className="col-sm-3 col-form-label">Number of Questions</label>
                 <div className="col-sm-9">
              <input className="form-control" value={savedQuestions.length} readOnly />
              </div>
            </div>
            
            <div className="form-group row">
                 <label className="col-sm-3 col-form-label">Number of Attempt</label>
                 <div className="col-sm-9">
              <input
                type="number"
                value={mnoofattempt}
                name="mnoofattempt"
                className={`form-control ${errors.mnoofattempt && "is-invalid"}`}
                onChange={handleCriteriaChange}
              />
              {errors.mnoofattempt && (
                <div className="invalid-feedback">{errors.mnoofattempt}</div>
              )}</div>
            </div>
            
            <div className="form-group row">
                 <label className="col-sm-3 col-form-label">Pass Percentage</label>
                 <div className="col-sm-9">
              <input
                type="number"
                value={mpassPercentage}
                name="mpassPercentage"
                className={`form-control ${errors.mpassPercentage && "is-invalid"}`}
                onChange={handleCriteriaChange}
              />
              {errors.mpassPercentage && (
                <div className="invalid-feedback">{errors.mpassPercentage}</div>
              )}
              </div>
            </div>
            <div className="form-group row">
      <label  className="col-sm-3 col-form-label">
        Lessons <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="inputlike">
          {/* Display selected Lessons */}
          {selectedLessons.length > 0 && (
            <div className="listemail">
              {selectedLessons.map((lesson) => (
                <div key={lesson.lessonId} className="selectedemail">
                  {lesson?.lessonTitle}{" "}
                  <i
                    className="fa-solid fa-xmark"
                    onClick={() => removeLesson(lesson.lessonId)}
                  ></i>
                </div>
              ))}
            </div>
          )}

          {/* Search input field */}
          <input
            type="text"
            id="customeinpu"
            className="form-control"
            placeholder="Search Lesson..."
            value={query}
            onChange={handleInputChange}
          />
        </div>

        {/* Search results dropdown */}
        {Lessons.length > 0 && (
          <div className="user-list">
            {Lessons.map((lesson) => (
              <div
                key={lesson.lessonId}
                className="usersingle"
                onClick={() => selectLesson(lesson)}
              >
                <label id="must" className="p-1">
                  {lesson?.lessonTitle}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  
            <div className="atbtndiv mt-5">
              <div>
              <button  className="btn btn-primary" onClick={()=>{setShowCriteria(false)}}>Back</button>
             </div> <div></div>
             <div>
              <button
                className="btn btn-primary"
                onClick={submitTest}
                disabled={
                  !!errors.mnoofattempt ||
                  !!errors.mpassPercentage ||
                  !mnoofattempt ||
                  !mpassPercentage
                }
              >
                Save
              </button>
              </div>
            </div>
            </div>
            </div>
          </div>
          </div>
        ) : (
          <div className="card">
              <div className="card-body">
            <div className='navigateheaders'>
        <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
        <div></div>
        <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
        </div>
        <h4 > Create Module Test For {courseName}</h4>  
      
      
          <div className="row">
          <div className="col-12">
                
                <div className='atgrid ' >
               <div>
              {errors.selectedOption && (
                <div className="text-danger">{errors.selectedOption}</div>
              )}
                <div className="formgroup row" > 
                <input
                  className={`form-control    ${errors.mtestName && 'is-invalid'}`}
                  value={mtestName}
                  placeholder="Module Test Name"
                  onChange={handlemtestNameChange}
                />
                {errors.mtestName && <div className="invalid-feedback">{errors.mtestName}</div>}
                
    </div>
    {selectedQuestionIndex < savedQuestions.length &&(
     
                <i className="fas fa-trash text-danger  "
                  style={{ float: "right" ,fontSize:"20px",padding:"10px"}}
                          onClick={() => handleDelete(selectedQuestionIndex)}
                        ></i>)}
        <div className="formgroup row" > 
                <input 
                className={`form-control   ${errors.questionText && 'is-invalid'}`}       
                type="text"  
                value={questionText}
                  placeholder="Add Question here"
                  onChange={handleQuestionTextChange}
                  rows={2}
                  required
                />
                 {errors.questionText && <div className="invalid-feedback">{errors.questionText}</div>}
                 </div>
            </div>    
        <div>        
  <ul className='listgroup' >                
  
  {options.map((option, index) => (
    <li className='choice' key={index} >
      <input
     className='mt-2'
        type="radio"
        name="answer"
        value={option}
        checked={option !== "" && answer === option}
        onChange={handleselectanswer}
        required
      /> 
      <div>
      <input
      className={`form-control   ${errors.options[index] && 'is-invalid'}`}
      type="text"
      value={option}
      placeholder={`Option ${index + 1}`}
      onChange={(e) => handleOptionChange(e, index)}
      required
  />
  {errors.options[index] && (
      <div className="invalid-feedback">{errors.options[index]}</div>
  )}
  
      </div>
    </li>
  ))}
  </ul>
  
                      </div>
  
                 
                      </div>            
  <div className="atbtndiv">
    <div>
                <button
                  onClick={addQuestion}
                  className="btn btn-primary mt-4"
                >
                  {selectedQuestionIndex === savedQuestions.length ? "Add " : "update "}
                </button>
             
  </div>
              <div className="atbtndiv">
              <div>
              {selectedQuestionIndex !==0 &&(    <button 
                  className="btn btn-primary mt-4" 
                  onClick={showprevious}
                  disabled={selectedQuestionIndex===0}
                  >
                  &lt;
                  </button>)}
              </div>
                         <div></div>
              {selectedQuestionIndex < savedQuestions.length-1 &&(
              <button 
                  className="btn btn-primary mt-4" 
                  onClick={shownext}
                  disabled={selectedQuestionIndex > savedQuestions.length}
                  >
                  &gt;
                  </button>)}
              
              </div>
            
              <div>
              {savedQuestions.length > 0 && (
                              <button
                              className="btn btn-primary mt-4"
                              onClick={() => setShowCriteria(true)}
                              >
                              Save
                              </button>
                          )} 
                          </div>
        </div>  
       
                       
                      </div>
                      </div>
                      </div>
              </div>
        
        )}
      </div>
    );
  };

export default CreateModuleTest