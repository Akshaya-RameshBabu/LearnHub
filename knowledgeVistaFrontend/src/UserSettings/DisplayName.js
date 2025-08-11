import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";
const DisplayName = () => {
  const [initialsave, setinitialsave] = useState(false);
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const [isnotFound, setisnotFound] = useState(false);
  const navigate = useNavigate();
  const[loading,setLoading]=useState(false)
  const[errors,seterrors]=useState({
    admin_name:"",
    trainer_name: "",
     student_name: "",
  })
  const [displayname,setdisplayname]=useState({
  admin_name:"",
  trainer_name: "",
   student_name: "",
   isActive:true
  })
  const[defaultname,setdefaultname]=useState({
    id:"",
    insitution:"",
    admin_name:"",
    trainer_name: "",
     student_name: "",
     isActive:true
  })
    const fetchDisplayNameSettings = async () => {
        try {
          setLoading(true)
          const response = await axios.get(`${baseUrl}/get/displayName`, {
            headers: {
              "Authorization": token
            }
          });
          if (response.status === 200) {
            const data = response.data;
            setdisplayname(data);
            setdefaultname(data);
            
        } else if (response.status === 204) {
          setisnotFound(true);
          setinitialsave(true);
          
      } 
        } catch (error) {
          if (error.response) {
            if (error.response.status === 404) {
              setisnotFound(true);
              setinitialsave(true);
            } else if (error.response.status === 401) {
              navigate("/unauthorized")
            }else{
              throw error
            }
          }
        }finally{
          setLoading(false)
        }
      };
  useEffect(() => {
    if(token){
      fetchDisplayNameSettings();
    }
    }, []); 
  const save =async (e) => {
    e.preventDefault();
    if(initialsave){
try{
    const response=await axios.post(`${baseUrl}/post/displayname`, displayname, {
        headers: {
          'Authorization': token
        }
      })
      if (response.status === 200) {
        sessionStorage.setItem("displayname", JSON.stringify(displayname));
        MySwal.fire({
          title: "Saved !",
          text: "Role Details Saved Sucessfully" ,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
              fetchDisplayNameSettings();
          }   });
        setisnotFound(false)
      } 
}catch(error){
  // MySwal.fire({
  //   icon: 'error',
  //   title: 'Some Error Occurred',
  //   text: "error occured"
  // });
  if (error.response.status === 404) {
    console.log("notfound")
  } else if (error.response.status === 401) {
    navigate("/unauthorized")
  }else{
    throw error
  }
}  
  }else{ 
    if(displayname.id){
    axios.patch(`${baseUrl}/edit/displayname`,displayname ,{
    headers:{
      "Authorization":token
      }
  })
  .then(response => {
    if (response.status=== 200) {
      sessionStorage.setItem("displayname", JSON.stringify(displayname));
      MySwal.fire({
        title: "Updated",
        text: "Role Details Saved Sucessfully" ,
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
            fetchDisplayNameSettings();
        }   });
      setisnotFound(false)
    } 
  })
  .catch(error => {
  //  if(error.response.status===401){
  //   window.location.href="/unauthorized"
  //  } else{
    // MySwal.fire({
    //   icon: 'error',
    //   title: 'Some Error Occurred',
    //   text: error.data
    // });
    if (error.response.status === 404) {
      console.log("notfound")
    } else if (error.response.status === 401) {
      navigate("/unauthorized")
    }else{
      throw error
    }
  });
    
  }

}
    
  };
const handleInputsChange=(e)=>{
const{name,value}=e.target
setdisplayname((prev)=>({
  ...prev,
  [name]:value
}))
}

const getinputs=(
<div>

 <div className='form-group row'>
           <label htmlFor='admin_name'className="col-sm-3 col-form-label"> Admin Name<span className="text-danger">*</span></label>
           <div className="col-sm-9">
           <input
             id='admin_name'
             name='admin_name'
             placeholder='Admin Name'
             value={displayname.admin_name}
             className={`form-control   ${errors.admin_name && 'is-invalid'}`}
             onChange={handleInputsChange}
           />
           <div className="invalid-feedback">
             {errors.admin_name}
           </div>
           </div>
         </div>

         <div className='form-group row'>
           <label htmlFor='trainer_name'className="col-sm-3 col-form-label"> Trainer Name<span className="text-danger">*</span></label>
           <div className="col-sm-9">
           <input
             id='trainer_name'
             name='trainer_name'
             placeholder='Trainer Name'
             value={displayname.trainer_name}
             className={`form-control   ${errors.trainer_name && 'is-invalid'}`}
             onChange={handleInputsChange}
           />
           <div className="invalid-feedback">
             {errors.trainer_name}
           </div>
           </div>
         </div>

         <div className='form-group row'>
           <label htmlFor='student_name'className="col-sm-3 col-form-label"> Student Name<span className="text-danger">*</span></label>
           <div className="col-sm-9">
           <input
             id='student_name'
             name='student_name'
             placeholder='Student Name'
             value={displayname.student_name}
             className={`form-control   ${errors.student_name && 'is-invalid'}`}
             onChange={handleInputsChange}
           />
           <div className="invalid-feedback">
             {errors.student_name}
           </div>
           </div>
         </div>
 
 <div className='btngrp'>
       <button className='btn btn-primary' 
       onClick={save}
        >
         Save</button>
     </div>
     </div>
    );
    const Edit=(e)=>{
      e.preventDefault();
      setisnotFound(true);
    }
  const defaultinputs=( 
    <div>
     <div className='formgroup pt-4' >
         <div className='form-group row'>
           <label htmlFor='admin_name' className="col-sm-3 col-form-label">Admin Name <span className="text-danger">*</span></label>
           <div className="col-sm-9">
           <input
             id='admin_name'
             placeholder='Admin Name'
             value={defaultname.admin_name}
             readOnly
            className='form-control'
           />
           </div>
         </div>
         <div className='form-group row'>
           <label htmlFor='trainer_name' className="col-sm-3 col-form-label">Trainer Name <span className="text-danger">*</span></label>
           <div className="col-sm-9">         
           <input
             id='trainer_name'
             placeholder='Trainer Name'
             value={defaultname.trainer_name}
             readOnly
            className='form-control'
           />
           </div>
         </div>
         <div className='form-group row'>
           <label htmlFor='student_name' className="col-sm-3 col-form-label">Student Name<span className="text-danger">*</span></label>
           <div className="col-sm-9">
            <input
             id='student_name'
             placeholder='Student Name'
             className='form-control'
             readOnly
             value={defaultname.student_name}
           />
           </div>
         </div> 
     </div>
     <div className='btngrp' >
       <button className='btn btn-success' onClick={Edit}>Edit</button>
     </div>
     
 </div>
 )

 const Skeleton = (
  <div className="skeleton-wrapper">

    <div className="form-group row">
      <label htmlFor="admin_name" className="col-sm-3 col-form-label">
        Admin Name <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="trainer_name" className="col-sm-3 col-form-label">
        Trainer Name <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="student_name" className="col-sm-3 col-form-label">
        Student Name <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="btngrp">
      <div className="skeleton skeleton-button"></div>
    </div>

  </div>
);

  return (
    <div>
    <div className="page-header">
    <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">Settings </h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{ navigate("/admin/dashboard")}} title="dashboard"><i className="feather icon-home"></i></a></li>
                            <li className="breadcrumb-item"><a href="#">Role Display Name </a></li>
                        </ul>
                        
                    </div>
                </div>
            </div>
    </div>
    <div className="card">
      <div className=" card-body">
        <div className="row">
           <div className="col-12">
    <div className='navigateheaders'>
     <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
     <div></div>
     <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
     </div>
     
     <h4>Role Display Name</h4>
      {loading? Skeleton: isnotFound ? getinputs :defaultinputs }
      </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default DisplayName;
