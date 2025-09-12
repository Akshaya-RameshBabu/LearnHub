import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Link, useNavigate, useParams } from 'react-router-dom';
import baseUrl from '../../api/utils';
import axios from 'axios';
import useGlobalNavigation from '../../AuthenticationPages/useGlobalNavigation';

const TestList = () => {
  const {courseName, courseId } = useParams();
  const navigate=useNavigate();
  const MySwal = withReactContent(Swal);
  const [test, setTest] = useState(null); // Change to single test instead of array
  const [editedTest, setEditedTest] = useState({}); 
  const [errors, setErrors] = useState({
    noofattempt: "",
    passPercentage: "",
    testName :""
  });
  const[loading,setloading]=useState(false)
  const token = sessionStorage.getItem("token");
  const [editingField, setEditingField] = useState(null); // State to track which field is being edited
const [selectedIds,setselectedIds]=useState([]);
  const fetchData = async () => {
      try {
           setloading(true)
        const response = await axios.get(`${baseUrl}/test/getall/${courseId}`, {
          headers: {
            Authorization: token,
          }
        });
          if (response.status===200) {
          const data =  response.data;
          setTest(data);
          setEditedTest(data)
        }
      } catch (error) {
        if(error.response && error.response.status===401)
          {
            navigate("/unauthorized")
          }else if(error.response && error.response.status===404){
          navigate(`/course/AddTest/${courseName}/${courseId}`)
        }else{
        // MySwal.fire({
        //   title: "Error",
        //   text: error.response,
        //   icon: "error",
        //   confirmButtonText: "OK"
        // });
        throw error
      }
      }finally{
       setloading(false)
      }
    };
  useEffect(() => {
    fetchData();
  }, [courseId]);

  // Function to toggle between edit and check icons
  const toggleEditingField = (field) => {
    if (editingField === field) {
      setEditingField(null); // Reset if the same field is clicked again
    } else {
      setEditingField(field);
    }
  };

  const handleSaveTest = async (name, value) => {
    try {
      // Check if9 there are errors

     
      if (!errors[name] && value !== null) {
        const formData = new FormData();
        formData.append(name, value);
        const response = await axios.patch(`${baseUrl}/test/update/${test.testId}`, formData,{
          headers: {
            "Authorization": token
          }
        });
        if (response.status===200) {
          setEditingField(null)
            fetchData();
        }
      }
    } catch (error) {
      console.error('Error updating test:', error);
      throw error
    }
  };



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
          if (test.testId != null) {
            const response = await axios.delete(`${baseUrl}/test/questions`, {
              params: { 
                testId: test.testId,
              },
              paramsSerializer: (params) => {
                const queryString = new URLSearchParams();
                selectedIds.forEach(id => queryString.append("questionIds", id)); // Append IDs correctly
                queryString.append("testId", test.testId);
                return queryString.toString();
              },
              headers: {
                "Authorization": token
              }
            });
            
            if (response.status===200) {
            fetchData();
            }
          }
        } catch (error) {
          console.error('Error deleting test:', error);
          throw error
        }
      } 
    });
  };
  const handleSelectAll = () => {
    if (selectedIds.length === test.questions.length) {
      // If all are selected, deselect all
      setselectedIds([]);
    } else {
      // Select all question IDs
      const allQuestionIds = test.questions.map(q => q.questionId);
      setselectedIds(allQuestionIds);
    }
  };

  const handleCriteriaChange = (e) => {
    const { name, value } = e.target;
    let error = "";
    
    // Convert value to a number if it is an attempt count or percentage
    const numericValue = name === "noofattempt" || name === "passPercentage" ? parseFloat(value) : value;
    
    switch (name) {
      case "testName":
        
      error = value.length < 1 ? 'Test name Cannot be Empty' : '';
      setEditedTest({ ...editedTest, testName: value });
      break;
      case "noofattempt":
        error = !numericValue || numericValue < 1 ? "Number of attempts must be at least 1." : "";
        setEditedTest({ ...editedTest, noofattempt: numericValue }); // Use numericValue here
        break;
      case "passPercentage":
        error = !numericValue || numericValue < 1 || numericValue > 100 ? "Pass percentage must be between 1 and 100." : "";
        setEditedTest({ ...editedTest, passPercentage: numericValue }); // Use numericValue here
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
        if (test.testId != null) {
          const response = await axios.delete(`${baseUrl}/test/questions`, {
            params: { 
              testId: test.testId,
            },
            paramsSerializer: (params) => {
              const queryString = new URLSearchParams();
              queryString.append("questionIds", questID); // Use questID instead of selectedIds
              queryString.append("testId", test.testId);
              return queryString.toString();
            },
            headers: {
              "Authorization": token
            }
          });
          
          if (response.status === 200) {
             fetchData();
          }
        }
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    } 
  });
};
 const handleNavigation = useGlobalNavigation();
  return (
    <div>
      <div className="page-header">
    <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10"> Test</h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#"onClick={handleNavigation} ><i className="feather icon-layout"></i></a></li>
                            <li className="breadcrumb-item"><a href="#"> Test</a></li>
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
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
      <div className='headingandbutton'>
      <h4 className='text-center 'style={{margin:"0px"}}>{courseName}</h4>
      <div style={{ width: "200px", display: "flex", gap: "10px" }}>
                 
      {test &&     <button className="hidebtn" onClick={DeleteQuestion} disabled={selectedIds.length <= 0}
                  style={{
                   opacity: selectedIds.length > 0 ? 1 : 0.5, // Dim when disabled
                   cursor: selectedIds.length > 0 ? "pointer" : "not-allowed", // Show disabled cursor
                 }}>
                   {" "}
                   <i
                     className="fa-solid fa-trash text-danger"
                     style={{ fontSize: "20px", paddingTop: "20px" }}
                   ></i>
                 </button>}
      {test &&   <Link to={`/test/AddMore/${courseName}/${test.testId}`} className='btn btn-primary' style={{width:"150px"}}><i className='fa fa-plus mr-2'></i> Add more </Link>
  }  
  </div>      
                </div>
     </div>
     {loading && (
              <div className="outerspinner active">
                <div className="spinner"></div>
              </div>
            )}
         { test && (
            <div className='card-body'>
              <div className='singletest'>
                <span className='edititems'>
                  <b>Test Name:</b>
                  {editingField === 'testName' ? (
                    <>
                     <div> <input
                        type="text"
                        name='testName'
                        className={`form-control .form-control-sm  smalltextbox ${errors.testName && 'is-invalid'}`}
                        value={editedTest && editedTest.testName !== undefined ? editedTest.testName : test.testName}
                        onChange={handleCriteriaChange}
                        />
                        {errors.testName && (
                          <div className="invalid-feedback">{errors.testName}</div>
                        )}</div>
                      <i className="fa-solid fa-check text-success " onClick={() => handleSaveTest("testName", editedTest.testName)}></i>
                    </>
                  ) : (
                    <>
                      <h5 onDoubleClick={() => toggleEditingField('testName')}>{test.testName}</h5>
                    </>
                  )}
                </span>
                <span className='edititems'>
                  <b>Pass Mark:</b>
                  {editingField === 'passPercentage' ? (
                    <>
                      <div>
                        <input
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          name='passPercentage'
                          className={`form-control .form-control-sm  smalltextbox ${errors.passPercentage && 'is-invalid'}`}
                          value={editedTest && editedTest.passPercentage !== undefined ? editedTest.passPercentage : test.passPercentage}
                          onChange={handleCriteriaChange}
                        />
                        {errors.passPercentage && (
                          <div className="invalid-feedback">{errors.passPercentage}</div>
                        )}
                      </div>
                      <i className={`fa-solid fa-check text-success   ${errors.passPercentage || editedTest.passPercentage === null ? 'disabled' : ''}`} id='passPercentage' onClick={() => handleSaveTest("passPercentage", editedTest.passPercentage)}></i>
                    </>
                  ) : (
                    <>
                     <h5 onDoubleClick={() => toggleEditingField('passPercentage')}> {test.passPercentage}</h5>
                       </>
                  )}
                </span>
                <span className='edititems'>
                  <b>No Of Attempt:</b>
                  {editingField === 'noofattempt' ? (
                    <>
                      <div>
                        <input
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          name='noofattempt'
                          className={`form-control .form-control-sm   smalltextbox ${errors.noofattempt && 'is-invalid'}`}
                          value={editedTest && editedTest.noofattempt !== undefined ? editedTest.noofattempt : test.noofattempt}
                          onChange={handleCriteriaChange}
                        />
                        {errors.noofattempt && (
                          <div className="invalid-feedback">{errors.noofattempt}</div>
                        )}
                      </div>
                      <i className={`fa-solid fa-check text-success ${errors.noofattempt || editedTest.noofattempt === null ? 'disabled' : ''}`} onClick={() => handleSaveTest("noofattempt", editedTest.noofattempt)}></i>
                    </>
                  ) : (
                    <>
                    <h5 onDoubleClick={() => toggleEditingField('noofattempt')}>  {test.noofattempt}</h5>
                       </>
                  )}
                </span>
                <span>
                  <b>No of Questions:</b> {test.noOfQuestions}
                </span>
              
              </div>
               
              {test.questions && (
                <div className="table-container mt-2">
                  <table className='table table-hover  table-bordered table-sm'>
                    <thead className='thead-dark'>
                      <tr>
                      <th scope="col" style={{ width: "50px" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds?.length===test?.questions?.length}
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
                      {test.questions.map((question, index) => (
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
                          <Link
  to={{
    pathname: `/test/Edit/${question.questionId}`,
  }}
  state={{
    sno: index + 1,
    courseName: courseName,
    courseId: courseId,
  }}
>
  <i className="fa text-primary fa-edit"></i>
</Link>

                          </td>
                          <td className='text-center'>
                          <i className='fa fa-trash text-danger' onClick={() => handleDelete(question.questionId)}></i>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
          )}
        </div>
        </div>
        </div>
        </div>
  );
}

export default TestList;
