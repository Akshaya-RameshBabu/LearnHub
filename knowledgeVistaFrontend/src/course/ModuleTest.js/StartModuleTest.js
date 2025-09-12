import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import baseUrl from '../../api/utils';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ModuleTestInstruction from './ModuleTestInstruction';

const StartModuleTest = () => {
    const{mtestName,mtestId,batchName,batchId}=useParams()
 const [questions, setQuestions] = useState([]);
     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
     const [selectedAnswers, setSelectedAnswers] = useState([]);
     const token = sessionStorage.getItem("token");
     const MySwal = withReactContent(Swal);
     const navigate = useNavigate();
     const [proceedClicked, setProceedClicked] = useState(false);
 
     const handleProceedClick = () => {
         setProceedClicked(true);
     };
 
     useEffect(() => {
         const fetchQuestions = async () => {
             try {
                 const response = await axios.get(`${baseUrl}/ModuleTest/Start`, {
                     params: { mtestId, batchId },
                     headers: { Authorization: token }
                 });
 
                 if (response.status === 200) {
                     if (Array.isArray(response?.data?.questions)) {
                         setQuestions(response?.data?.questions);
                     }
                 } else if (response.status === 204) {
                     navigate("/notFound");
                 }
             } catch (err) {
                 console.log(err);
                 if (err?.response?.status === 401) {
                     navigate("/unauthorized");
                 } else if (err?.response?.status === 403) {
                     MySwal.fire({
                         icon: "warning",
                         title: "Forbidden",
                         text: err?.response?.data || "Access Denied",
                     });
                     navigate(-1);
                 }
             }
         };
 
         fetchQuestions();
     }, []); 
     const handleSelectAnswer = (questionId, answerText) => {
         setSelectedAnswers((prevAnswers) => {
             const existingAnswerIndex = prevAnswers.findIndex(ans => ans.questionId === questionId);
 
             if (existingAnswerIndex !== -1) {
                 const updatedAnswers = [...prevAnswers];
                 updatedAnswers[existingAnswerIndex] = { questionId, selected: answerText };
                 return updatedAnswers;
             } else {
                 return [...prevAnswers, { questionId, selected: answerText }];
             }
         });
     };
 
     const handleNextQuestion = () => {
         setCurrentQuestionIndex(currentQuestionIndex + 1);
     };
 
     const handlePrevQuestion = () => {
         setCurrentQuestionIndex(currentQuestionIndex - 1);
     };
 
     const handleSubmit = async () => {
         
         try {
             const response = await axios.post(`${baseUrl}/ModuleTest/submit`, selectedAnswers, {
                 params: {
                    mtestId: mtestId,
                 },
                 headers: {
                     Authorization: token
                 }
             });
             if (response?.status === 200) {
                 MySwal.fire({
                     icon: "success",
                     title: response?.data,
                     confirmButtonText: "OK", // Button text
                     // allowOutsideClick: false, // Prevent closing by clicking outside
                 }).then(() => {
                     // Redirect only after closing the popup
                     navigate("/user/ProgramCalender");
                 });
             }
         } catch (err) {
             if (err?.response && err?.response?.status === 401) {
                 MySwal.fire({
                     icon: "warning",
                     title: "Unauthorized",
                     text: err?.response.data
                 });
                 navigate("/unauthorized");
             }
             console.log(err);
         }
     };
 
     return (
         <div>
             <div className="page-header"></div>
             {!proceedClicked ? (
                 <ModuleTestInstruction handleProceedClick={handleProceedClick} mtestName={mtestName} noofQuestion={questions?.length} />
             ) : (
                 <div className="card">
                     <div className="card-body">
                         <div className="row">
                             <div className="col-12">
                                 {questions.length === 0 ? (
                                     <div className="centerflex">
                                         <div className="enroll">
                                             <h2>Quiz Not Found</h2>
                                             <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
                                         </div>
                                     </div>
                                 ) : (
                                     <div>
       
 
 
                                     <div className="atgrid">
                                         <h3><span>{currentQuestionIndex+1}.</span> {questions[currentQuestionIndex].questionText}</h3>
                                         <ul className="listgroup">
                                             {[1, 2, 3, 4].map((num) => {
                                                 const optionValue = questions[currentQuestionIndex][`option${num}`];
                                                 return (
                                                     <li className="lielement" key={num}>
                                                         <input
                                                             type="radio"
                                                             id={`option${num}-${questions[currentQuestionIndex].questionId}`}
                                                             name={`answer-${questions[currentQuestionIndex].questionId}`}
                                                             value={optionValue}
                                                             checked={selectedAnswers.some(
                                                                 ans => ans.questionId === questions[currentQuestionIndex].questionId && ans.selected === optionValue
                                                             )}
                                                             onChange={() => handleSelectAnswer(questions[currentQuestionIndex].questionId, optionValue)}
                                                         />
                                                         <label htmlFor={`option${num}-${questions[currentQuestionIndex].questionId}`}>
                                                             {optionValue}
                                                         </label>
                                                     </li>
                                                 );
                                             })}
                                         </ul>
 
                                         <div className="cornerbtns">
                                             {currentQuestionIndex > 0 && (
                                                 <button className="btn btn-primary" onClick={handlePrevQuestion}>
                                                     Previous
                                                 </button>
                                             )}
 
                                             <div style={{ flex: 1 }}></div>
 
                                             {currentQuestionIndex < questions.length - 1 ? (
                                                 <button
                                                     onClick={handleNextQuestion}
                                                     disabled={!selectedAnswers.some(ans => ans.questionId === questions[currentQuestionIndex].questionId)}
                                                     className="btn btn-primary"
                                                 >
                                                     Next
                                                 </button>
                                             ) : (
                                                 <button onClick={handleSubmit} className="btn btn-success">
                                                     Submit
                                                 </button>
                                             )}
                                         </div>
 
                                     </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>)}
         </div>
     );
}

export default StartModuleTest