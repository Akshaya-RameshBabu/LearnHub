import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import baseUrl from '../api/utils';

const EditQuizzQuestioninAssignment = ({question,onClose,getAssignment}) => {
     const token = sessionStorage.getItem("token");
      const MySwal = withReactContent(Swal);
      const navigate =useNavigate();
      const [questionText, setQuestionText] = useState(question?.questionText);
  const [options, setOptions] = useState({
    option1: question?.option1,
    option2: question?.option2,
    option3: question?.option3,
    option4: question?.option4
  });
  const [selectedOption, setSelectedOption] = useState(() => {
    return Object.keys(question).find(
      key => question[key] === question?.answer && key.startsWith("option")
    );
  });
  
      const [saveEnabled, setSaveEnabled] = useState(false); // Initially disable save button
      const [errors, setErrors] = useState({
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        questionText: '',
        selectedOption: ''
      });
      useEffect(() => {
        validateForm(); // Validate the form whenever any state changes
      }, [questionText, options, selectedOption]);
    
      const handleOptionChange = (option) => {
        setSelectedOption(option);
      };
    
      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOptions(prevOptions => ({
          ...prevOptions,
          [name]: value
        }));
        
        const newErrors = { ...errors };
        if (options[name].trim() === '') {
          newErrors[name] = 'This field is required.';
        }else if(options[name].length>255){
          newErrors[name] = 'Option Cannot be more than 255 characters';
        } else {
          newErrors[name] = '';
        }
        setErrors(newErrors);
      };
    
      const handleQuestionTextChange = (e) => {
        const { value } = e.target;
        setQuestionText(value);
        const newErrors = { ...errors };
        if ( questionText.trim() === '') {
          newErrors.questionText = 'This field is required.';
        }else if(questionText.length>1000){
          newErrors.questionText = 'Question Cannot be more than 1000 characters';
        } else {
          newErrors.questionText = '';
        }
        setErrors(newErrors);
      };
    const validateForm = () => {
        let isValid = true;
        const newErrors = { ...errors };
    
        // Check if question text is empty
        if ( questionText.trim() === '') {
          newErrors.questionText = 'This field is required.';
          isValid = false;
        }else if(questionText.length>1000){
          newErrors.questionText = 'Question Cannot be more than 1000 characters';
          isValid = false;
        } else {
          newErrors.questionText = '';
        }
    
        // Check if any option is empty
        Object.keys(options).forEach(option => {
          if ( options[option].trim() === '') {
            newErrors[option] = 'This field is required.';
            isValid = false;
          }else if(options[option].length>255){
            newErrors[option] = 'Option Cannot be more than 255 characters';
            isValid = false;
          } else {
            newErrors[option] = '';
          }
        });
    
        // Check if an answer is selected
        if (selectedOption === '') {
          newErrors.selectedOption = 'Please select an answer.';
          isValid = false;
        } else {
          newErrors.selectedOption = '';
        }
    
        setErrors(newErrors);
        setSaveEnabled(isValid);
      };
    
      const handleSave = async () => {
        try {
          
    const formresponse={
      questionText:questionText,
      option1:options.option1,
      option2:options.option2,
      option3 :options.option3,
      option4 :options.option4,
      answer :options[selectedOption]
    
    }
          const response = await axios.patch(`${baseUrl}/Assignment/UpdateQuestion/${question?.id}`, formresponse,{
            headers: {
              "Authorization": token
            }
          });
          if (response.status===200) {
         
            MySwal.fire({
              title: "Success",
              text: "Question updated successfully",
              icon: "success",
              confirmButtonText: "OK"
            });
            getAssignment()
          } 
        } catch (error) {
          if(error.response && error.response.status===401){
            MySwal.fire({
              title: "Error",
              text: "You are unauthorized to access this page",
              icon: "error",
              confirmButtonText: "OK"
            });
            navigate("/unauthorized")
          } else {
            throw error
          }}
      };
  return (
    <div className="card-body">
    <div className="navigateheaders">
        <div onClick={onClose}>
            <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div></div>
        <div onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
        </div>
    </div>
    <div>            
              <input 
              className={`form-control   ${errors.questionText && 'is-invalid'}`}
              autoFocus
              value={questionText}
              onChange={handleQuestionTextChange}
            />
            {errors.questionText && <div className="invalid-feedback">{errors.questionText}</div>}
            </div>

            <ul className='listgroup'>
              {Object.keys(options).map((optionKey, index) => (
                <li className='choice' key={index}>
                  <input
                    className={`mt-2 ${errors[optionKey] && 'is-invalid'}`}
                    type="radio"
                    value={optionKey} 
                    checked={selectedOption === optionKey} 
                    onChange={() => handleOptionChange(optionKey)} 
                  />
                  <div>
                  <input
                    type='text'
                    value={options[optionKey]}
                    name={optionKey}
                    className={`form-control   ${errors[optionKey] && 'is-invalid'}`}
                    onChange={handleInputChange}
                  />
                  {errors[optionKey] && <div className="invalid-feedback">{errors[optionKey]}</div>}
                  </div>
                </li>
              ))}
            </ul>
        
          <div className='atbtndiv'>
            <div>
            <button className='btn btn-secondary' onClick={onClose}>Cancel</button>
            </div>
            <div></div>
            <div>
            <button
              className='btn btn-primary'
              onClick={handleSave}
              disabled={!saveEnabled}
            >
              update
            </button>
            </div>
          </div>
    </div>

  )
}

export default EditQuizzQuestioninAssignment