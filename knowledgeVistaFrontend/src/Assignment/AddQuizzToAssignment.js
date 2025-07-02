import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const AddQuizzToAssignment = ({savedQuestions, setSavedQuestions, setShowAddQuestion,handleSubmit}) => {
      const navigate=useNavigate();
         const MySwal = withReactContent(Swal);
              const [questionText, setQuestionText] = useState("");
              const [options, setOptions] = useState(["", "", "", ""]);
              const [answer, setAnswer] = useState('');
                const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
                   const token=sessionStorage.getItem("token")
                   const [errors,setErrors]=useState({
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
                           option4:"",
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
                    const handleFinalSubmit = () => {
                      const isQuestionTextEmpty = questionText.trim() === '';
                      const areOptionsEmpty = options.every(opt => opt.trim() === '');
                      const isAnswerEmpty = !answer;
                    
                      // ✅ If all fields are empty, skip the question and call handleSubmit
                      if (isQuestionTextEmpty && areOptionsEmpty && isAnswerEmpty) {
                        handleSubmit();
                        return;
                      }
                    
                      let hasError = false;
                    
                      const trimmedQuestionText = questionText.trim();
                      if (!trimmedQuestionText) {
                        setErrors(prev => ({ ...prev, questionText: 'This field is required.' }));
                        hasError = true;
                      } else if (trimmedQuestionText.length > 1000) {
                        setErrors(prev => ({ ...prev, questionText: 'Question text cannot be more than 1000 characters.' }));
                        hasError = true;
                      }
                    
                      const newOptionErrors = {};
                      options.forEach((option, index) => {
                        const trimmed = option.trim();
                        if (!trimmed) {
                          newOptionErrors[index] = `Option ${index + 1} cannot be empty.`;
                          hasError = true;
                        } else if (trimmed.length > 255) {
                          newOptionErrors[index] = `Option ${index + 1} cannot be more than 255 characters.`;
                          hasError = true;
                        }
                      });
                    
                      if (!answer) {
                        setErrors(prev => ({ ...prev, selectedOption: 'Please select the correct answer.' }));
                        hasError = true;
                      } else if (answer.length > 255) {
                        setErrors(prev => ({ ...prev, selectedOption: 'Answer option cannot be more than 255 characters.' }));
                        hasError = true;
                      }
                    
                      if (Object.keys(newOptionErrors).length > 0) {
                        setErrors(prevErrors => ({
                          ...prevErrors,
                          options: {
                            ...prevErrors.options,
                            ...newOptionErrors,
                          },
                        }));
                      }
                    
                      if (hasError) return;
                    
                      // Add/update current question
                      const newQuestion = {
                        questionText: questionText,
                        option1: options[0],
                        option2: options[1],
                        option3: options[2],
                        option4: options[3],
                        answer: answer
                      };
                    
                      const updatedQuestions = [...savedQuestions];
                      updatedQuestions[selectedQuestionIndex] = newQuestion;
                      setSavedQuestions(updatedQuestions);
                    
                      // Call parent submit handler
                      handleSubmit();
                    };
                    
                    
                
  return (
    <div>
      <div className="card">
        <div className="card-body">
        <div className='navigateheaders'>
      <div  onClick={() => {
                      setShowAddQuestion(false)
                    }}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
      </div>
          <div className="row">
            <div className="col-12">
              <div className="atgrid ">
              <div  className="flexWithPadding">
                <h4>Add Quizz To Assignment</h4>
                </div>
                <div>
                  {errors.selectedOption && (
                    <div className="text-danger">{errors.selectedOption}</div>
                  )}
                   
                  {selectedQuestionIndex < savedQuestions.length && (
                    <i
                      className="fas fa-trash text-danger  "
                      style={{
                        float: "right",
                        fontSize: "20px",
                        padding: "10px",
                      }}
                      onClick={() => handleDelete(selectedQuestionIndex)}
                    ></i>
                  )}
                  <div className="formgroup row">
                    <input
                      className={`form-control   ${
                        errors.questionText && "is-invalid"
                      }`}
                      type="text"
                      value={questionText}
                      onChange={handleQuestionTextChange}
                      placeholder="Add Question here"
                      rows={2}
                      required
                    />
                    {errors.questionText && (
                      <div className="invalid-feedback">
                        {errors.questionText}
                      </div>
                    )}
                  </div>
                  <ul className="listgroup">
                    {options.map((option, index) => (
                      <li className="choice" key={index}>
                        <input
                          className="mt-2"
                          type="radio"
                          name="answer"
                          value={option}
                          onChange={handleselectanswer}
                          checked={option !== "" && answer === option}
                          required
                        />
                        <div>
                          <input
                            className={`form-control   ${
                              errors.options[index] && "is-invalid"
                            }`}
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(e, index)}
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {errors.options[index] && (
                            <div className="invalid-feedback">
                              {errors.options[index]}
                            </div>
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
                    {selectedQuestionIndex === savedQuestions.length
                      ? "Add"
                      : "update "}
                  </button>
                 
                </div>
                <div className="atbtndiv">
                  <div>
                    {selectedQuestionIndex !== 0 && (
                      <button
                        className="btn btn-primary mt-4"
                        onClick={showprevious}
                        disabled={selectedQuestionIndex === 0}
                      >
                        &lt;
                      </button>
                    )}
                  </div>
                  <div></div>
                  {selectedQuestionIndex < savedQuestions.length - 1 && (
                    <button
                      className="btn btn-primary mt-4"
                      onClick={shownext}
                      disabled={selectedQuestionIndex > savedQuestions.length}
                    >
                      &gt;
                    </button>
                  )}
                </div>

                <div>
                  <button
                  onClick={handleFinalSubmit}
                  disabled={savedQuestions.length<=0}
                    className="btn btn-success mt-4"
                  >
                   Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddQuizzToAssignment;
