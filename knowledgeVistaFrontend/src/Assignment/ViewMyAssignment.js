import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import baseUrl from '../api/utils';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const ViewMyAssignment = () => {
    const location=useLocation();
    const[Shedules,setShedules]=useState([]);
    const token=sessionStorage.getItem('token')
    const navigate=useNavigate()
      const MySwal = withReactContent(Swal);
     const[batchId,setbatchId]=useState(null);
       const[batches,setbatches]=useState([{
          id:"",
          name:"",
          type:""
        }])
     const fetchBatches = async (page = 0) => {
        try {
          const email=sessionStorage.getItem("email")
          const response = await axios.get(`${baseUrl}/view/batch/${email}`, {
            headers: {
              Authorization: token,
            }
          });
          if (response?.status == 200) {
           setbatches(response.data)
           if (response.data.length > 0) {
            setbatchId(response.data[0].id);
            fetchMyAssignments();
          }
          }
        } catch (err) {
          console.log(err);
        }
      };
    const fetchMyAssignments=async()=>{

        try{
            if(!batchId){
                return
              }
         const response=await axios.get(`${baseUrl}/Assignments/get`,{
            headers:{
                Authorization:token
            },
            params:{
                batchId,
            }
         })
if(response?.status===200){
        setShedules(response?.data)
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
      useEffect(() => {
          fetchBatches(); 
        }, [location]);
         useEffect(() => {
            fetchMyAssignments()
          }, [batchId]); 
    
  return (
    <div>
    <div className="page-header"></div>
    <div className="row">
      <div className="col-sm-12">
        <div className="card">
          <div className="card-header">
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
            <div className="tableheader2 ">
              <h4>Assignments </h4>
              <select  className="selectstyle btn btn-success text-left has-ripple "
               value={batchId} onChange={(e) => setbatchId(Number(e.target.value))}>
      {batches.map((batch) => (
        <option className="bg-light text-dark " key={batch.id} value={batch.id}>
          {batch.name}
        </option>
      ))}
    </select>
            </div>
            </div>
            <div className="card-body">
            <div className="table-container mt-2">
                <table className="table table-hover  table-bordered table-sm">
                  <thead className="thead-dark">
                    <tr>
                      <th scope="col" style={{ width: "50px" }}>
                        #
                      </th>
                      <th scope="col">Title</th>
                      <th scope="col">Submission Date </th>
                      <th scope='col'>Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
  {Array.isArray(Shedules) && Shedules.map((item, index) => (
    <tr key={index}>
      <th scope="row">{index + 1}</th>
      <td>{item.assignmenttitle}</td>
      <td>{item.assignmentdate}</td>
      <td>
  <span
    className={
      item?.submissionstatus === "SUBMITTED"
        ? "submitted"
        : item?.submissionstatus === "NOT_SUBMITTED"
        ? "NotSubmitted":item?.submissionstatus==="VALIDATED"?"submitted"
        : item?.submissionstatus === "LATE_SUBMISSION"
        ? "LateSubmitted"
        : ""
    }
  >
    <i className="fa-solid fa-circle pr-2"></i>
    {item?.submissionstatus?.replace("_", " ") || "Not Submitted"}
  </span>
</td>
      <td>
        <button className="btn btn-primary btn-sm"
        onClick={()=>{
            navigate(`/submitAssignment/${batchId}/${item.assignmentid}`)
        }}>View / Submit</button>
      </td>
   

    </tr>
  ))}
</tbody>

                    </table>
                    </div>
                </div>
                </div>
                </div>
                </div>
                </div>

  )
}

export default ViewMyAssignment