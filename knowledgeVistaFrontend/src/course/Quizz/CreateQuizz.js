import axios from 'axios';
import React, { useState } from 'react'
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate, useParams } from 'react-router-dom';
import baseUrl from '../../api/utils';
import DurationPicker from './DurationPicker';

const CreateQuizz = () => {
      const navigate=useNavigate();
       const [examDuration, setExamDuration] = useState({ hours: "", minutes: "" });
        const MySwal = withReactContent(Swal);
        const [questionText, setQuestionText] = useState("");
        const [options, setOptions] = useState(["", "", "", ""]);
        const [answer, setAnswer] = useState('');
        const [savedQuestions, setSavedQuestions] = useState([]);
          const [showCriteria, setShowCriteria] = useState(false);
        const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
     const token=sessionStorage.getItem("token")
       const [quizzName, setquizzName] = useState("");
        const [duration, setDuration] = useState({ hours: "", minutes: "" });
  const [durationInMinutes, setDurationInMinutes] = useState(0);
      const { courseName,courseId,Lessontitle,lessonId} = useParams();
      const [errors,setErrors]=useState({
        quizzName:"",
        questionText: '',
        options: {
            option1: '',
            option2: '',
            option3: '',
            option4: ''
        },
      });
      const[question,setQuestion]=useState([{
        questionText:"",
        option1:"",
        option2:"",
        option3:"",
        option4:""
      }])
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
     const handleselectanswer=(e)=>{
        const { value } = e.target;
        setAnswer(value)
        setErrors((prevErrors) => ({
          ...prevErrors,
          selectedOption: '',
        }));
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
   
     const handlequizzNameChange =(e)=>{
        const { value } = e.target;
        setquizzName(value)
        if (value.trim() === '') {
          setErrors(prevErrors => ({
              ...prevErrors,
              quizzName  : 'This field is required'
          }));
      }else if (quizzName.length > 50) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          quizzName: 'Test name cannot be more than 50 characters.',
        }));
        return;
      }else 
      if(value.includes("/")||  value.includes("\\")){
        setErrors((prevErrors) => ({
          ...prevErrors,
          quizzName:  "Quizz Title should not contain the '/' or '\' character",
        }));
        return;
         
      }
       else {
          setErrors(prevErrors => ({
              ...prevErrors,
              quizzName: ''
          }));
      }
      }
     const addQuestion = () => {
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
          questionText: '',
          options: {
            option1: '',
            option2: '',
            option3: '',
            option4: ''
        },
        });
      };
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

    
    const saveQuizz = async () => {
      try {
        const updatedQuestions = [...savedQuestions];
        if(questionText!=''&& answer!=""&&options[0]!="" &&options[1]!="" &&options[2]!="" &&options[3]!="" ){
          const newQuestion = {
            questionText: questionText,
            option1: options[0],
            option2: options[1],
            option3: options[2],
            option4: options[3],
            answer: answer
          };
        
          if (selectedQuestionIndex !== null) {
           
            updatedQuestions[selectedQuestionIndex] = newQuestion;
            setSavedQuestions(updatedQuestions);
            setSelectedQuestionIndex(prevIndex => prevIndex + 1);
          }
        }
        if(durationInMinutes===0){
          return;
        }
        const requestData = {
          quizzName: quizzName,
          durationInMinutes:durationInMinutes,
          quizzquestions: updatedQuestions
        };
      
        const response = await axios.post(
          `${baseUrl}/Quizz/Save/${lessonId}`,
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );
        setSavedQuestions([]);
        setAnswer("")
        setQuestionText("")
        setOptions(["", "", "", ""])
        setquizzName("");
        setShowCriteria(false)
        if(response.status==200){

          const data=response.data
MySwal.fire({
        title: "Created .!",
        text: "Quizz Created SuccessFully.!",
        icon: "success",
        confirmButtonText: "OK"
      }).then((result) => {
        if (result.isConfirmed) {
          if(data.quizzId && data.quizname){
          navigate(`/ViewQuizz/${courseName}/${courseId}/${Lessontitle}/${lessonId}/${data.quizname}/${data.quizzId}`)
          }else{
navigate(`/lessonList/${courseName}/${courseId}`)
          }
        }
      });
        } if(response.status==204){
          MySwal.fire({
            title: "Not FOund .!",
            text: "Lesson Not  Found.!",
            icon: "warning",
            confirmButtonText: "OK"
          })
        }
      } catch (err) {
        if(err.response && err.response.status===409){
          MySwal.fire({
            title: "Duplicate Entry .!",
            text: `${err.response.data}`,
            icon: "error",
            confirmButtonText: "OK"
          })
        }else  if(err.response && err.response.status===401){
          navigate("/unaithorized")
        }else{
        console.error("Error saving quiz:", err);
        throw err
        }
      }
    };
    
  return (
    <div>
    <div className="page-header"></div>
    {showCriteria ? (
         <div className="card">
        <div className="card-header">
       
          <div className='navigateheaders'>
      <div onClick={()=>{setShowCriteria(false)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
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
            <input className="form-control" style={{width:"250px"}} value={savedQuestions.length} readOnly />
            </div>
          </div>

        <div className="form-group row">
               <label className="col-sm-3 col-form-label">Number of Questions</label>
               <div className="col-sm-9">
      <DurationPicker onChange={setExamDuration} durationInMinutes={durationInMinutes} setDurationInMinutes={setDurationInMinutes}  />
      <p className="mt-2 text-gray-500">
        Selected Duration: {examDuration.hours || 0} hr {examDuration.minutes || 0} min
      </p>
      </div>
    </div>
         
         

          <div className="atbtndiv mt-5">
            <div>
            <button  className="btn btn-primary" onClick={()=>{setShowCriteria(false)}}>Back</button>
           </div> <div></div>
           <div>
            {savedQuestions.length > 0 && (
                            <button
                            className="btn btn-primary mt-4"
                            onClick={saveQuizz}
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
      ) : (
    <div className="card">
            <div className="card-body">
                {}
          <div className='navigateheaders'>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
      </div>
      <h4 > Create Quizz For {Lessontitle}</h4>  
      <div className="row">
      <div className="col-12">
      <div className='atgrid ' >
        <div>
        {errors.selectedOption && (
              <div className="text-danger">{errors.selectedOption}</div>
            )}
        <div className="formgroup row" > 
              <input
                className={`form-control    ${errors.quizzName && 'is-invalid'}`}
                value={quizzName}
                placeholder="Quizz Name"
                onChange={handlequizzNameChange}
              />
              {errors.quizzName && <div className="invalid-feedback">{errors.quizzName}</div>}
              
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
              onChange={handleQuestionTextChange}
                placeholder="Add Question here"
                rows={2}
                required
              />
               {errors.questionText && <div className="invalid-feedback">{errors.questionText}</div>}
               </div>
               <ul className='listgroup' >                

{options.map((option, index) => (
  <li className='choice' key={index} >
    <input
   className='mt-2'
      type="radio"
      name="answer"
      value={option}
      onChange={handleselectanswer}
      checked={option !== "" && answer === option}
      required
    /> 
    <div>
    <input
    className={`form-control   ${errors.options[index] && 'is-invalid'}`}
    type="text"
    value={option}
    onChange={(e) => handleOptionChange(e, index)}
    placeholder={`Option ${index + 1}`}
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
                            onClick={()=>{setShowCriteria(true)}}
                            >
                            Next
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
  )
}

export default CreateQuizz