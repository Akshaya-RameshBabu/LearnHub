import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import baseUrl from '../../api/utils';
import useGlobalNavigation from "../../AuthenticationPages/useGlobalNavigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const ViewModuleTest = () => {
    const{courseName,courseId,mtestname,mtestId}=useParams();
    const[mtest,setmtest]=useState();
    const MySwal = withReactContent(Swal);
    const navigate=useNavigate();
    const token=sessionStorage.getItem("token");
    const [editedTest, setEditedTest] = useState({}); 
    const [errors, setErrors] = useState({
        mnoOfAttempt: "",
        mpassPercentage: "",
        mtestName :""
      });
      const [editingField, setEditingField] = useState(null);
      const [selectedIds,setselectedIds]=useState([]);
    const fetchmoduleTesById=async()=>{
        try{
const response= await axios.get(`${baseUrl}/get/moduleTest/${mtestId}`,{
    headers:{
        Authorization:token
    }
})
if(response?.status===200){
    setmtest(response.data)
}else if(response?.status===204){
    navigate(`/course/moduleTest/${courseName}/${courseId}`)
}
        }catch(err){
            console.log(err)
            if(err?.response?.status===401){
                navigate("/unauthorized")
            }
        }
    }
    useEffect(()=>{
        fetchmoduleTesById()
    },[])
    const handleCriteriaChange = (e) => {
        const { name, value } = e.target;
        let error = "";
        // Convert value to a number if it is an attempt count or percentage
        const numericValue = name === "mnoofattempt" || name === "mpassPercentage" ? parseFloat(value) : value;
        
        switch (name) {
          case "mtestName":
          error = value.length < 1 ? 'Test name Cannot be Empty' : value.includes("/")||value.includes("\\")?"test name cannot have '/' or '\\'":""
      
          setEditedTest({ ...editedTest, mtestName: value });
          break;
          case "mnoOfAttempt":
            console.log(value)
            error = !numericValue || numericValue < 1 ? "Number of attempts must be at least 1." : "";
            setEditedTest({ ...editedTest, mnoOfAttempt: numericValue }); // Use numericValue here
            break;
          case "mpassPercentage":
            error = !numericValue || numericValue < 1 || numericValue > 100 ? "Pass percentage must be between 1 and 100." : "";
            setEditedTest({ ...editedTest, mpassPercentage: numericValue }); // Use numericValue here
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
      const handleSelectAll = () => {
        if (selectedIds.length ===mtest.questions.length) {
          // If all are selected, deselect all
          setselectedIds([]);
        } else {
          // Select all question IDs
          const allQuestionIds = mtest.questions.map(q => q.questionId);
          setselectedIds(allQuestionIds);
        }
      };
      const handleQuestionselect=(id)=>{
        setselectedIds((prevSelectedIds) => {
          if (prevSelectedIds.includes(id)) {
            // If the ID is already present, remove it
            return prevSelectedIds.filter((selectedId) => selectedId !== id);
          } else {
            // If the ID is not present, add it
            return [...prevSelectedIds, id];
          }
        });
        
      }
      const DeleteQuestion = async () => {
        if(selectedIds.length<=0){
          return
        }
        MySwal.fire({
          title: "Delete Test?",
          text: "Are you sure you want to delete Selected Questions?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              if (mtest?.mtestId != null) {
                const response = await axios.delete(`${baseUrl}/ModuleTest/questions`, {
                  params: { 
                    testId: mtest?.mtestId,
                  },
                  paramsSerializer: (params) => {
                    const queryString = new URLSearchParams();
                    selectedIds.forEach(id => queryString.append("questionIds", id)); // Append IDs correctly
                    queryString.append("testId", mtest?.mtestId);
                    return queryString.toString();
                  },
                  headers: {
                    "Authorization": token
                  }
                });
                
                if (response.status===200) {
                  window.location.reload();
                }
              }
            } catch (error) {
              console.error('Error deleting test:', error);
              throw error
            }
          } 
        });
      };
      const handleDelete = async (questID) => { 
        MySwal.fire({
          title: "Delete Question?",
          text: "Are you sure you want to delete this question?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              if (mtest?.mtestId != null) {
                const response = await axios.delete(`${baseUrl}/ModuleTest/questions`, {
                  params: { 
                    testId: mtest?.mtestId,
                  },
                  paramsSerializer: (params) => {
                    const queryString = new URLSearchParams();
                    queryString.append("questionIds", questID); // Use questID instead of selectedIds
                    queryString.append("testId", mtest?.mtestId);
                    return queryString.toString();
                  },
                  headers: {
                    "Authorization": token
                  }
                });
                
                if (response.status === 200) {
                  window.location.reload();
                }
              }
            } catch (error) {
              console.error("Error deleting question:", error);
            }
          } 
        });
      };
      const handleSaveTest = async (name, value) => {
        try {
          if (!errors[name] && value !== null) {
            const formData = new FormData();
            formData.append(name, value);
            const response = await axios.patch(`${baseUrl}/ModuleTest/update/${mtest?.mtestId}`, formData,{
              headers: {
                "Authorization": token
              }
            });

            if (response.status===200) {
              setEditingField(null)
              fetchmoduleTesById();
            }
          }
        } catch (error) {
          console.error('Error updating test:', error);
          throw error
        }
      };

      const toggleEditingField = (field) => {
        if (editingField === field) {
          setEditingField(null); // Reset if the same field is clicked again
        } else {
          setEditingField(field);
        }
      };
      const handleNavigation = useGlobalNavigation();
  return (
    <div>
    <div className="page-header">
    <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">{mtest?.mtestName}</h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#"onClick={handleNavigation} ><i className="feather icon-layout"></i></a></li>
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{
                                navigate(`/course/moduleTest/${courseName}/${courseId}`)
                            }}>Module Tests</a></li>
                             <li className="breadcrumb-item"><a href="#">{mtest?.mtestName}</a></li>
                        </ul>
                       
                    </div>
                </div>
            </div>
    </div>
    <div className='row'>
      <div className='col-sm-12'>
        <div className='card'>
          <div className='card-header'>
      <div className='navigateheaders' style={{margin:"2px"}}>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate("/dashboard/course")}}><i className="fa-solid fa-xmark"></i></div>
      </div>
        <div className='headingandbutton'>
            <h4 className='text-center 'style={{margin:"0px"}}>{courseName}</h4>
            <div style={{ width: "200px", display: "flex", gap: "10px" }}>
                       
            {mtest &&     <button className="hidebtn" 
            onClick={DeleteQuestion}
             disabled={selectedIds.length <= 0}
                        style={{
                         opacity: selectedIds.length > 0 ? 1 : 0.5, // Dim when disabled
                         cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", // Show disabled cursor
                       }}
                       >
                         {" "}
                         <i
                           className="fa-solid fa-trash text-danger"
                           style={{ fontSize: "20px", paddingTop: "20px" }}
                         ></i>
                       </button>}
            {mtest &&   <Link to={`/moduleTest/AddmoreQuestion/${courseName}/${courseId}/${mtest?.mtestName}/${mtest?.mtestId}`} 
            className='btn btn-primary ' style={{width:"150px"}}>
                <i className='fa fa-plus mr-2'></i>
                 Add more 
                 </Link>
        }  
        </div>      
                      </div>
    {mtest && <div className='card-body'>
        <div className='singletest'>
                <span className='edititems'>
                  <b>Test Name:</b>
                  {editingField === 'mtestName' ? (
                    <>
                     <div> <input
                        type="text"
                        name='mtestName'
                        className={`form-control .form-control-sm  smalltextbox ${errors.mtestName && 'is-invalid'}`}
                        value={editedTest && editedTest.mtestName !== undefined ? editedTest.mtestName : mtest?.mtestName}
                        onChange={handleCriteriaChange}
                        />
                        {errors.mtestName && (
                          <div className="invalid-feedback">{errors.mtestName}</div>
                        )}</div>
                      <i className="fa-solid fa-check text-success " onClick={() => handleSaveTest("mtestName", editedTest.mtestName)}></i>
                    </>
                  ) : (
                    <>
                      <h5 onDoubleClick={() => toggleEditingField('mtestName')}>{mtest?.mtestName}</h5>
                    </>
                  )}
                </span>
                <span className='edititems'>
                  <b>Pass Mark:</b>
                  {editingField === 'mpassPercentage' ? (
                    <>
                      <div>
                        <input
                          type="number"
                          name='mpassPercentage'
                          className={`form-control .form-control-sm  smalltextbox ${errors.mpassPercentage && 'is-invalid'}`}
                          value={editedTest && editedTest.mpassPercentage !== undefined ? editedTest.mpassPercentage : mtest.mpassPercentage}
                          onChange={handleCriteriaChange}
                        />
                        {errors.mpassPercentage && (
                          <div className="invalid-feedback">{errors.mpassPercentage}</div>
                        )}
                      </div>
                      <i className={`fa-solid fa-check text-success   ${errors.mpassPercentage || editedTest.mpassPercentage === null ? 'disabled' : ''}`} id='passPercentage' onClick={() => handleSaveTest("mpassPercentage", editedTest.mpassPercentage)}></i>
                    </>
                  ) : (
                    <>
                     <h5 onDoubleClick={() => toggleEditingField('mpassPercentage')}> {mtest.mpassPercentage}</h5>
                       </>
                  )}
                </span>
                <span className='edititems'>
                  <b>No Of Attempt:</b>
                  {editingField === 'mnoOfAttempt' ? (
                    <>
                      <div>
                        <input
                          type="number"
                          name='mnoOfAttempt'
                          className={`form-control .form-control-sm   smalltextbox ${errors.mnoOfAttempt && 'is-invalid'}`}
                          value={editedTest && editedTest.mnoOfAttempt !== undefined ? editedTest.mnoOfAttempt : mtest.mnoOfAttempt}
                          onChange={handleCriteriaChange}
                        />
                        {errors.mnoOfAttempt && (
                          <div className="invalid-feedback">{errors.mnoOfAttempt}</div>
                        )}
                      </div>
                      <i className={`fa-solid fa-check text-success ${errors.mnoOfAttempt || editedTest.mnoOfAttempt === null ? 'disabled' : ''}`} onClick={() => handleSaveTest("mnoOfAttempt", editedTest.mnoOfAttempt)}></i>
                    </>
                  ) : (
                    <>
                    <h5 onDoubleClick={() => toggleEditingField('mnoOfAttempt')}>  {mtest.mnoOfAttempt}</h5>
                       </>
                  )}
                </span>
                <span className="edititems">
                  <b>No of Questions:</b> 
                  <h5>{mtest.mnoOfQuestions}</h5>
                </span>
              
              </div>
 <div className="table-container mt-2">
                  <table className='table table-hover  table-bordered table-sm'>
                    <thead className='thead-dark'>
                      <tr>
                      <th scope="col" style={{ width: "50px" }}>
                          <input
                            type="checkbox"
                           checked={selectedIds?.length===mtest?.questions?.length}
                            title="Select All"
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th scope="col" style={{width:"50px"}}>S.no</th>
                        <th scope="col">Question</th>
                        <th scope="col">Option 1</th>
                        <th scope="col">Option 2</th>
                        <th scope="col">Option 3</th>
                        <th scope="col">Option 4</th>
                        <th scope="col">Answer</th>
                        <th scope="col" colSpan={2}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mtest.questions.map((question, index) => (
                        <tr key={index}>
                       <td><input type='checkbox' title='Select'
                        checked={selectedIds.includes(question.questionId)} // Check if the ID is in selectedIds
                        onChange={() => handleQuestionselect(question.questionId)} // Prevents default event propagation
                      /></td>
                          <td>{index + 1}</td>
                          <td>{question.questionText}</td>
                          <td>{question.option1}</td>
                          <td>{question.option2}</td>
                          <td>{question.option3}</td>
                          <td>{question.option4}</td>
                          <td>{question.answer}</td>
                          <td className='text-center'>
                            <Link to={`/moduleTest/EditQuestion/${courseName}/${courseId}/${mtest?.mtestName}/${mtest?.mtestId}/${question.questionId}`}>
                              <i className='fa text-primary fa-edit'></i>
                            </Link>
                          </td>
                          <td className='text-center'>
                          <i className='fa fa-trash text-danger' 
                          onClick={() => handleDelete(question.questionId)}
                          ></i>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
      </div>}
      </div>
      </div>
      </div>
      </div>
      </div>
  )
}

export default ViewModuleTest