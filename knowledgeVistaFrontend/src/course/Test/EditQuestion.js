import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import baseUrl from '../../api/utils';
import axios from 'axios';
import useGlobalNavigation from '../../AuthenticationPages/useGlobalNavigation';

const EditQuestion = () => {
  const MySwal = withReactContent(Swal);
  const { questionId } = useParams();
    const location = useLocation();
  const { sno, courseName, courseId } = location.state || {};
  const token = sessionStorage.getItem("token");
  const[loading,setloading]=useState(false);
  const navigate =useNavigate();
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({
    option1: '',
    option2: '',
    option3: '',
    option4: ''
  });
  const [selectedOption, setSelectedOption] = useState('');
  const [saveEnabled, setSaveEnabled] = useState(false); // Initially disable save button
  const [errors, setErrors] = useState({
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    questionText: '',
    selectedOption: ''
  });
  const fetchData = async () => {
      try {
        setloading(true)
        const response = await axios.get(`${baseUrl}/test/getQuestion/${questionId}`, {
       
          headers: {
            "Authorization": token
          }
        });
       
          const data =  response.data;
          setQuestionText(data.questionText);
          setOptions({
            option1: data.option1,
            option2: data.option2,
            option3: data.option3,
            option4: data.option4
          });
          const selectedOption = Object.keys(data).find(optionKey => data[optionKey] === data.answer);
          setSelectedOption(selectedOption); 
        
      } catch (error) {
      
        throw error.then((result) => {
          if (result.isConfirmed) {
            navigate(-1);
          }
      })
      }finally{
        setloading(false)
      }
    };
  useEffect(() => {
    fetchData();
  }, [questionId, token]);
  

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
    if (questionText.trim() === '') {
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
    if (questionText.trim() === '') {
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
      if (options[option].trim() === '') {
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
      const formData = new FormData();
      formData.append("questionText", questionText);
      formData.append("option1", options.option1);
      formData.append("option2", options.option2);
      formData.append("option3", options.option3);
      formData.append("option4", options.option4);
      formData.append("answer", options[selectedOption]);

      const response = await axios.patch(`${baseUrl}/test/edit/${questionId}`, formData,{
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
        window.history.back();
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
        // MySwal.fire({
        //   title: "Error",
        //   text: error,
        //   icon: "error",
        //   confirmButtonText: "OK"
        // });
        throw error
      }}
  };
 const handleNavigation = useGlobalNavigation();
  return (
  <div>
    <div className="page-header">
       <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">Edit Question</h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#"onClick={handleNavigation} ><i className="feather icon-layout"></i></a></li>
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{navigate(`/course/testlist/${courseName}/${courseId}`)}}>{courseName}Test</a></li>
                            <li className="breadcrumb-item text-light">Edit</li>
                        </ul>
                       
                    </div>
                </div>
            </div>
    </div>
    <div className="card">
      <div className="card-body">
        <div className="row">
          <div className="col-12">
            <div className='navigateheaders'>
              <div onClick={() => { navigate(-1) }}><i className="fa-solid fa-arrow-left"></i></div>
              <div></div>
              <div onClick={() => { navigate(-1) }}><i className="fa-solid fa-xmark"></i></div>
            </div>

            {loading ? (
              <div className="skeleton-wrapper" >
               
                <div className="skeleton skeleton-input"></div>
                <ul className="listgroup">
                  {[1, 2, 3, 4].map((_, idx) => (
                    <li className="choice" key={idx} >
                      <div className="skeleton skeleton-radio"></div>
                      <div className="skeleton skeleton-input"></div>
                    </li>
                  ))}
                </ul>
                <div className="atbtndiv" >
                  <div>
                    <div className="skeleton skeleton-button"></div>
                  </div>
                  <div></div>
                  <div>
                    <div className="skeleton skeleton-button"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className='spanAndInputgrid'>
                  <span>{sno}.</span>
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
                    <button className='btn btn-secondary' onClick={() => window.history.back()}>Cancel</button>
                  </div>
                  <div></div>
                  <div>
                    <button
                      className='btn btn-primary'
                      onClick={handleSave}
                      disabled={!saveEnabled}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>

  );
}

export default EditQuestion;
