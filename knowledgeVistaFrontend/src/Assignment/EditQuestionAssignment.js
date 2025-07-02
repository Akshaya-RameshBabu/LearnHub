import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from '../api/utils';
import axios from 'axios';
import EditQuizzAssignment from './EditQuizzAssignment';
const EditQuestionAssignment = ({ AssignmentQuestion, setAssignmentQuestion, setShowAddQuestion, handleSaveQuestions,getAssignment ,Assignment}) => {
  
      const navigate=useNavigate();
      const token=sessionStorage.getItem("token");
        const MySwal = withReactContent(Swal);
     const [errors, setErrors] = useState({});
 
     const handleAddMore = () => {
         setAssignmentQuestion([...AssignmentQuestion, { questionText: "" }]);
     };
 
     const handleChange = (index, value) => {
        let newErrors = { ...errors };
    
        if (!value.trim()) {
            newErrors[index] = "Question cannot be empty.";
        } else if (value.length > 255) {
            newErrors[index] = "Question must not exceed 255 characters.";
        } else {
            delete newErrors[index];
        }
    
        setErrors(newErrors);
    
        setAssignmentQuestion((prevQuestions) =>
            prevQuestions.map((question, i) =>
                i === index ? { ...question, questionText: value } : question
            )
        );
    };
    
 
     const handleDelete = (index) => {
         setAssignmentQuestion((prevQuestions) =>
             prevQuestions.filter((_, i) => i !== index)
         );
 
         let newErrors = { ...errors };
         delete newErrors[index];
         setErrors(newErrors);

      
     };
     const handleDeleteApi = async (questionId) => {
        MySwal.fire({
          title: "Delete ?",
          text: "Are you sure you want to delete this Question?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
      
              const response = await axios.delete(`${baseUrl}/Assignment/Delete/Question`, {
                headers: {
                  Authorization: token,
                },
                params: {
                    questionId: questionId,
                },
              });
      if(response?.status===200){
      
              MySwal.fire({
                icon: "success",
                title: "Deleted!",
                text: "Question has been deleted.",
              });
              getAssignment();
            }else if (response?.status === 204) {
                MySwal.fire({
                  title: "Not Found!",
                  text: "Assignment Not Found",
                  icon: "warning",
                  confirmButtonText: "OK",
                }).then((result) => {
                    navigate(-1);
                });
              }
          
            } catch (error) {
                if(error?.response?.status===401){
                    navigate("/unauthorized")
                }else if (error?.response?.status===403){
                    MySwal.fire({
                        title: " Forbitten!",
                        text: error?.response?.data,
                        icon: "warning",
                        confirmButtonText: "OK",
                      }).then((result) => {
                          navigate(-1);
                      });
                }else{
              console.error("Delete error:", error);
              throw error;
                }
            }
          }
        });
      };
      if(Assignment?.type==="QUIZ"){
        return <EditQuizzAssignment Assignment={Assignment} getAssignment={getAssignment}/>
      }else{
     return (
         <div className="row">
             <div className="col-sm-12">
                 <div className="card">
                     <div className="card-body">
                         <div className="navigateheaders">
                             <div onClick={() => navigate(-1)}>
                                 <i className="fa-solid fa-arrow-left"></i>
                             </div>
                             <div></div>
                             <div onClick={() => navigate(-1)}>
                                 <i className="fa-solid fa-xmark"></i>
                             </div>
                         </div>
                         <div className='tableheader2 mb-2'>
                             <h4>Add Question to Assignment</h4>
                             <button className="btn btn-primary" onClick={handleAddMore}>
                                 Add More
                             </button>
                         </div>
                         <div className='vh-50-overflow'>
                             {AssignmentQuestion.map((question, index) => (
                                 <div className="form-group col-sm-11 pb-2 row d-flex align-items-center" key={index}>
                                     <label className="col-auto" style={{ minWidth: "50px", fontWeight: "bold" }}>
                                         {index + 1}.
                                     </label>
                                     <div className="col">
                                         <input
                                             type="text"
                                             placeholder={`Enter Question ${index + 1}`}
                                             className="form-control"
                                             value={question.questionText}
                                             onChange={(e) => handleChange(index, e.target.value)}
                                         />
                                         {errors[index] && <small className="text-danger">{errors[index]}</small>}
                                     </div>
                                     <div className="col-auto">



                                     <button
  className={`hidebtn text-danger ${AssignmentQuestion.length === 1 ? "disabled" : ""}`}
  onClick={() =>
    question.id ? handleDeleteApi(question.id) : handleDelete(index)
  }
  disabled={AssignmentQuestion.length === 1}
  title={AssignmentQuestion.length === 1 ? "At least one question is required" : ""}
>
  <i className="fa-solid fa-trash"></i>
</button>

                                     </div>
                                 </div>
                             ))}
                         </div>
 
                         <div className="cornerbtn">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowAddQuestion(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveQuestions} disabled={Object.keys(errors).length > 0}>
                                Save All
                            </button>
                        </div>
                        
                     </div>
                 </div>
             </div>
         </div>
     )
    }
}

export default EditQuestionAssignment