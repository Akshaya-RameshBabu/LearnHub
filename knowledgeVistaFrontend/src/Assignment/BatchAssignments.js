import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import baseUrl from '../api/utils';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { GlobalStateContext } from '../Context/GlobalStateProvider';

const BatchAssignments = () => {
  const{batchTitle,batchId,userId}=useParams();
   const { displayname } = useContext(GlobalStateContext);
     const token=sessionStorage.getItem('token')
     const navigate=useNavigate()
       const MySwal = withReactContent(Swal);
       const[responsedata,setResponsedata]=useState({});
const[submissions,setSubmissions]=useState([])
 const [expandedId, setExpandedId] = useState(null); // holds the currently expanded assignment's ID

    const toggleDescription = (id) => {
      setExpandedId((prevId) => (prevId === id ? null : id)); // toggle logic
    };
  const fetchAssignmentsByUserId=async()=>{
    try{
     const response=await axios.get(`${baseUrl}/Assignments/getByStudent`,{
        headers:{
            Authorization:token
        },
        params:{
            batchId,
            userId
        }
     })
if(response?.status===200){
    setResponsedata(response?.data)
    setSubmissions(response?.data?.assignments)
}else if (response?.status === 204) {
MySwal.fire({
  title: "Not Found!",
  text: "Batch Not Found",
  icon: "warning",
  confirmButtonText: "OK",
}).then((result) => {
    navigate(-1);
});
}

    }catch(err){
        if(err?.response?.status===401){
            navigate("/unauthorized")
        }else if (err?.response?.status===403){
            MySwal.fire({
                title: " Forbitten!",
                text: err?.response?.data,
                icon: "warning",
                confirmButtonText: "OK",
              }).then((result) => {
                  navigate(-1);
              });
        }else{
        console.log(err)
        throw err
        }
    }
}
useEffect(()=>{
  fetchAssignmentsByUserId()
},[])
  return (
    <div>
    <div className="page-header">
    <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Assignments</h5>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a
                    href="#"
                    onClick={()=>{navigate("/batch/viewall")}}
                    title="dashboard"
                  >
                    <i className="fa-solid fa-object-group"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a
                    href="#"
                    onClick={() => {
                      navigate(`/batch/viewcourse/${batchTitle}/${batchId}`);
                    }}
                  >
                    {batchTitle}
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#"
                    onClick={() => {
                      navigate(`/batch/ViewStudents/${batchTitle}/${batchId}`);
                    }}>
                   {displayname && displayname.student_name
                      ? displayname.student_name
                      : "Student"}
                    Details
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#"
                  onClick={()=>{navigate(`/view/Student/Dashboard/${responsedata?.email}/${responsedata?.userId}/${responsedata?.batchId}/${responsedata?.batchName}`)}}
                   >
                 {responsedata.userName}
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#"
                   >
                  Assigmnents
                  </a>
                </li>
              
              </ul>
            </div>
          </div>
        </div>
    </div>
    <div className="row">
      <div className="col-sm-12">
        <div className="card min-vh-80">
        <div className="card-body">
          <div className="navigateheaders">
            <div
              onClick={() => {
                navigate(-1);
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
            </div>
            <div></div>
            <div
              onClick={() => {
                navigate(-1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </div>
          </div>
          <div className="tableheader mb-2">
              <h4>Assignments </h4>
              <div class="selectandadd"> <p><b class="text-blue">Name : </b>
              {responsedata.userName}</p><p><b class="text-blue">Batch Name : </b>{responsedata.batchName}</p></div>
              </div>
              {submissions.map((assignment) => (
        <div key={assignment.assignmentid} className="bg-white  border mb-4 rounded-50rem shadow-sm p-3">
          {/* Title */}
          <div className='assignment-title-status mb-2'>
          <h2 className="assignment-title"> <span>{assignment.assignmenttitle}</span></h2>
          <span
    className={
      assignment?.submissionstatus === "SUBMITTED"
        ? "submitted"
        : assignment?.submissionstatus === "NOT_SUBMITTED"
        ? "NotSubmitted":assignment?.submissionstatus==="VALIDATED"?"submitted"
        : assignment?.submissionstatus === "LATE_SUBMISSION"
        ? "LateSubmitted"
        : ""
    }
  >
    <i className="fa-solid fa-circle pr-2"></i>
    {assignment?.submissionstatus?.replace("_", " ") || "Not Submitted"}
  </span>
  </div>

          {/* Expandable Description */}
          <div className="pl-2 Assigmnent-Description position-relative mb-2">
  <p
    style={{
      display: "-webkit-box",
      WebkitLineClamp: expandedId === assignment.assignmentid ? "unset" : "1",
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      transition: "all 0.3s ease",
      paddingRight: "25px", // to prevent text from going under the icon
      marginBottom:"5px"
    }}
  >
    {assignment.assignmentdescription}
  </p>

  
</div>
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  }}
  
>
  <p
    style={{
      margin: 0,
      visibility: assignment?.submissionstatus === "NOT_SUBMITTED" ? "hidden" : "visible",
    }}
  >
    {assignment.submittedat && (
      <>
        Submitted At:{" "}
        <b>
          {new Date(assignment.submittedat).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </b>
      </>
    )}
  </p>

  <div
    style={{
      visibility: assignment?.submissionstatus === "NOT_SUBMITTED" ? "hidden" : "visible",
    }}
  >
    <button className="btn btn-primary" onClick={()=>{navigate(`/Assignment/Validate/${batchTitle}/${batchId}/${responsedata?.userId}/${assignment?.assignmentid}`)}}>Validate</button>
  </div>
</div>




        </div>
      ))}
           
          </div>
          </div>
          </div>
          </div>
          </div>
  )
}

export default BatchAssignments