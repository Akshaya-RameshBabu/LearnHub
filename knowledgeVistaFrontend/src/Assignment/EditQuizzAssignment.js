import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import EditQuizzQuestioninAssignment from './EditQuizzQuestioninAssignment';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from '../api/utils';
import axios from 'axios';
import AddmoreQuizzQuestion from './AddmoreQuizzQuestion';

const EditQuizzAssignment = ({Assignment,getAssignment}) => {
  
    const MySwal = withReactContent(Swal);
  const [editMode, setEditMode] = useState(null);
const [selectedQuestion, setSelectedQuestion] = useState(null);

   const navigate=useNavigate();
   const token=sessionStorage.getItem("token");
   
     const [selectedIds, setselectedIds] = useState([]);
   const handleQuestionselect = (id) => {
    setselectedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        // If the ID is already present, remove it
        return prevSelectedIds.filter((selectedId) => selectedId !== id);
      } else {
        // If the ID is not present, add it
        return [...prevSelectedIds, id];
      }
    });
  };
  const handleSelectAll = () => {
    if (selectedIds.length === Assignment?.questions.length) {
      // If all are selected, deselect all
      setselectedIds([]);
    } else {
      // Select all question IDs
      const allQuestionIds = Assignment?.questions.map((q) => q.id);
      setselectedIds(allQuestionIds);
    }
  };

   const DeleteQuestion = async () => {
      if (selectedIds.length <= 0) {
        return;
      }
      MySwal.fire({
        title: "Delete Test?",
        text: "Are you sure you want to delete this Questions?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            if (Assignment.id != null) {
              const response = await axios.delete(
                `${baseUrl}/Assignment/Delete/${Assignment.id}`,
                {
                  data: selectedIds,
                  headers: {
                    Authorization: token,
                  },
                }
              );
  
              if (response.status === 200) {
                getAssignment()
              }
            }
          } catch (error) {
            setselectedIds([]);
            console.error("Error deleting test:", error);
            throw error;
          }
        }
        setselectedIds([]);
      });
      getAssignment();
    };
  
  
    const handleDelete = async (questid) => {
     
      MySwal.fire({
        title: "Delete Questions?",
        text: "Are you sure you want to delete this Questions?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            if (Assignment.id != null) {
              const arr = [];
  arr.push(questid);
              const response = await axios.delete(
                `${baseUrl}/Assignment/Delete/${Assignment.id}`,
                {
                  data: arr,
                  headers: {
                    Authorization: token,
                  },
                }
              );
  
              if (response.status === 200) {
                getAssignment()
              }
            }
          } catch (error) {
            console.error("Error deleting question:", error);
            throw error;
          }
        }
        setselectedIds([]);
      });
    };
  
  return (
    <div className="row">
    <div className="col-sm-12">
        <div className="card">
       { editMode==="EDIT" ? (
                  <EditQuizzQuestioninAssignment
                  getAssignment={getAssignment}
                    question={selectedQuestion}
                    onClose={() => setEditMode(null)} // Optional: for cancel/back button
                  />
                ) : editMode==="ADDMORE"?
                (<AddmoreQuizzQuestion  getAssignment={getAssignment}
                  Assignment={Assignment} onClose={() => setEditMode(null)}/>): 
                (
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
                    <h4> Questions In Assignment</h4>
                    <div style={{ width: "200px", display: "flex", gap: "10px" }}>
                    <button className="hidebtn" onClick={DeleteQuestion} disabled={selectedIds.length <= 0}
                     style={{
                      opacity: selectedIds.length > 0 ? 1 : 0.5, // Dim when disabled
                      cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", // Show disabled cursor
                    }}>
                      {" "}
                      <i
                        className="fa-solid fa-trash text-danger"
                        style={{ fontSize: "20px", paddingTop: "20px" }}
                      ></i>
                    </button>
                    <button className="btn btn-primary" onClick={()=>{ setEditMode("ADDMORE");}}>
                        Add More
                    </button>
                    </div>
                </div>
                {Assignment?.questions && 
               
                 <div className="table-container mt-2">
                                  <table className="table table-hover  table-bordered table-sm">
                                    <thead className="thead-dark">
                                      <tr>
                                        <th scope="col" style={{ width: "50px" }}>
                                          <input
                                            type="checkbox"
                                            checked={selectedIds?.length===Assignment?.questions?.length}
                                            title="Select All"
                                            onChange={handleSelectAll}
                                          />
                                        </th>
                                        <th scope="col" style={{ width: "50px" }}>
                                          S.no
                                        </th>
                                        <th scope="col">Question</th>
                                        <th scope="col">Option 1</th>
                                        <th scope="col">Option 2</th>
                                        <th scope="col">Option 3</th>
                                        <th scope="col">Option 4</th>
                                        <th scope="col">Answer</th>
                                        <th scope="col" colSpan={2} style={{ width: "50px" }}>
                                          Action
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Assignment?.questions?.map((question, index) => (
                                        <tr key={index}>
                                          <td>
                                            <input
                                              type="checkbox"
                                              title="Select"
                                              checked={selectedIds.includes(
                                                question.id
                                              )} // Check if the ID is in selectedIds
                                              onChange={() =>
                                                handleQuestionselect(question.id)
                                              } // Prevents default event propagation
                                            />
                                          </td>
                                          <td>{index + 1}</td>
                                          <td>{question.questionText}</td>
                                          <td>{question.option1}</td>
                                          <td>{question.option2}</td>
                                          <td>{question.option3}</td>
                                          <td>{question.option4}</td>
                                          <td>{question.answer}</td>
                                          <td>
                                            <button className='hidebtn'
                                             onClick={() => {
                                              setSelectedQuestion(question);
                                              setEditMode("EDIT");
                                            }}
                                           >
                                              {" "}
                                              <i className="fas fa-edit text-primary"></i>
                                            </button>
                                          </td>
                                          <td className='text-center'>
                                          <i className='fa fa-trash text-danger' onClick={() => handleDelete(question.id)}></i>
                                          </td>
                                          
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
}
                </div>)}
                </div>
                </div>
                </div>

  )
}

export default EditQuizzAssignment