import { useEffect, useState } from "react";
import React from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate, useParams } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
import useGlobalNavigation from "../../AuthenticationPages/useGlobalNavigation";

const CreateTest = () => {
  const navigate=useNavigate();
  const { courseName,courseId} = useParams();
  const MySwal = withReactContent(Swal);
  const [testName, setTestName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState('');
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [noofattempt, setNoOfAttempt] = useState(1);
  const [passPercentage, setPassPercentage] = useState(0);
  const [showCriteria, setShowCriteria] = useState(false);
  const token=sessionStorage.getItem("token")
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
  // Function to handle changes in noofattempt and passPercentage fields
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
    // Check for errors in testName field
    if (!testName) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        testName: 'This field is required.',
      }));
      return;
    } else if (testName.length > 50) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        testName: 'Test name cannot be more than 50 characters.',
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
      testName: '',
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
    e.preventDefault(); // Prevent default form submission behavior

    try {
      const noOfQuestions = savedQuestions.length; // Count the number of questions
      const requestBody = {
        testName,
        questions: savedQuestions,
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
      setSavedQuestions([]);
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
    } else {
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
 const handleNavigation = useGlobalNavigation();

  return (
    <div>
    <div className="page-header"></div>
   
      
      {showCriteria ? (
         <div className="card">
        <div className="card-header">
       
          <div className='navigateheaders'>
      <div onClick={()=>{setShowCriteria(false)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{setShowCriteria(false)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
      <h4>Test Criteria</h4>
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

          <div className="atbtndiv mt-5">
            <div>
            <button  className="btn btn-primary" onClick={()=>{setShowCriteria(false)}}>Back</button>
           </div> <div></div>
           <div>
            <button
              className="btn btn-primary"
              onClick={submitTest}
              disabled={
                !!errors.noofattempt ||
                !!errors.passPercentage ||
                !noofattempt ||
                !passPercentage
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
      <div onClick={handleNavigation}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={handleNavigation}><i className="fa-solid fa-xmark"></i></div>
      </div>
      <h4 > Create Test For {courseName}</h4>  
    
    
        <div className="row">
        <div className="col-12">
              
              <div className='atgrid ' >
             <div>
            {errors.selectedOption && (
              <div className="text-danger">{errors.selectedOption}</div>
            )}
              <div className="formgroup row" > 
              <input
                className={`form-control    ${errors.testName && 'is-invalid'}`}
                value={testName}
                placeholder="Test Name"
                onChange={handleTestNameChange}
              />
              {errors.testName && <div className="invalid-feedback">{errors.testName}</div>}
              
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
export default CreateTest;
