import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from 'axios';
import baseUrl from '../api/utils';
import googleicon from "../images/google-25x25.png"
const SocialLoginKeysAdmin = () => {
    const MySwal = withReactContent(Swal); 
    const token=sessionStorage.getItem("token")
    const [isnotFound,setisnotFound]=useState(false);
    const navigate=useNavigate();
  const[defaultkeys,setdefaultkeys]=useState({
    clientid:"",
    clientSecret:"",
    redirectUrl:"",
    provider:"",
  })

  const[errors,seterrors]=useState({
    clientid:"",
    clientSecret:"",
    redirectUrl:""
  })
  const[loginkeys,setloginkeys]=useState({
    clientid:"",
    clientSecret:"",
    redirectUrl:"",
    provider:"GOOGLE",
  })
     const fetchSocialLoginKeys = async () => {
        try {
          const response = await axios.get(`${baseUrl}/sysadmin/get/socialLoginKeys`, {
            headers:{
                "Authorization":token
            },
            params: {
             "Provider":"GOOGLE"
            }
          });
    
          if (response.status === 200) {
            const data = response.data;
            setdefaultkeys(data);
            setloginkeys(data)
          }else if(response.status === 204){
            setisnotFound(true);
          }
        } catch (error) {
          if (error.response) {
            if (error.response.status === 404) {
              setisnotFound(true);
            } else if (error.response.status === 401) {
              navigate("/unauthorized")
            }else{
              throw error
            }
          }
        }
      };
  useEffect(() => {
    if(token){
      fetchSocialLoginKeys();
    }
    }, []);
    const handleInputsChange=(e)=>{
      e.preventDefault();
      
      const{name,value}=e.target;
      let error=""
      switch(name){
        case 'clientid':
          error = value.length < 1 ? 'Please enter a Valid Client Id' : '';
          break;
        case 'clientSecret':
            error = value.length < 1 ? 'Please enter a Valid  Client Secret' : '';
          break;
          case 'redirectUrl':
            error = value.length < 1 ? 'Please enter a Valid  Redirect Url' : '';
          break;
      }
      seterrors(prevErrors => ({
        ...prevErrors,
        [name]: error
      }));
      setloginkeys(prevset=>({
        ...prevset,
        [name]:value
      }))
      }
    const Edit=(e)=>{
        e.preventDefault();
        setisnotFound(true);
      }
      const save =async (e) => {
        e.preventDefault();
        const requiredFields = ['clientid', 'clientSecret', 'redirectUrl'];
        let hasErrors=false
          requiredFields.forEach(field => {
            if (!loginkeys[field] || loginkeys[field].length === 0 || errors[field]) {
             hasErrors=true
              seterrors(prevErrors => ({
                ...prevErrors,
                [field]: !loginkeys[field] ? 'This field is required' : errors[field]
              }));
            }
          });
          if(hasErrors){
            return
          }
     
    try{
        const response=await axios.post(`${baseUrl}/sysadmin/save/SocialKeys`,loginkeys, {
            headers: {
              'Authorization': token
            }
          })
        
          if (response.status === 200) {
            MySwal.fire({
              title: "Saved !",
              text: response.data,
              icon: "success",
              confirmButtonText: "OK",
            }).then((result) => {
              if (result.isConfirmed) {
                  fetchSocialLoginKeys();
              }   });
            setisnotFound(false)
          } 
    }catch(error){
      // MySwal.fire({
      //   icon: 'error',
      //   title: 'Some Error Occurred',
      //   text: "error occured"
      // });
      throw error
    }
       
      
        
      
        
      };
      const oldinputs=(
    
          <div>
         <h4>  Google Login Settings <img src={googleicon}/></h4>
        
          <div className='form-group row' >
           
                <label htmlFor='clientid'  className="col-sm-3 col-form-label">Google Cloud Client Id <span className="text-danger">*</span></label>
                <div className="col-sm-9">
                <input
                  id='clientid'
                  placeholder='Client Id'
                  value={defaultkeys.clientid}
                  className='form-control'
                  readOnly
                />

              </div>
              </div>

              <div className='form-group row'>
                <label htmlFor='clientSecret' className="col-sm-3 col-form-label">Google Cloud client Secret <span className="text-danger">*</span></label>
                <div className="col-sm-9">
                 <input
                  id='clientSecret'
                  placeholder='Client Secet' 
                  readOnly
                   className='form-control'
                  value={defaultkeys.clientSecret}
                />
               </div>
    
              </div>
              <div className='form-group row'>
                <label htmlFor='redirectUrl'
                 className="col-sm-3 col-form-label"
                 >Google Cloud RedirectUrl<span className="text-danger">*</span></label>
  <div className="col-sm-9">
                 <input
                  id='redirectUrl'
                  value={defaultkeys.redirectUrl}
                  placeholder=' RedirectUrl'
                  className='form-control'
                  readOnly
                />
               </div>
    
              </div>
           
         
       
          
          <div className='btngrp' >
            <button className='btn btn-success' onClick={Edit}>Edit</button>
          </div>
          
      </div>
      )

      const EditInputs=(  <div>
       
        <h4> Google Login Settings <img src={googleicon}/></h4>
       
         <div className='form-group row' >
          
               <label htmlFor='clientid'
               className="col-sm-3 col-form-label">Google Cloud Client Id <span className="text-danger">*</span></label>
             <div className="col-sm-9">
               <input
                 id='clientid'
                 placeholder='Client Id'
                 value={loginkeys.clientid}
                 name='clientid'
                onChange={handleInputsChange}
                className={`form-control   ${errors.clientid && "is-invalid"}`}
               />
               <div className="invalid-feedback">{errors.clientid}</div>
               </div>
             </div>
             <div className='form-group row'>
               <label htmlFor='clientSecret'className="col-sm-3 col-form-label">Google Cloud client Secret <span className="text-danger">*</span></label>
               <div className="col-sm-9">
                <input
                name='clientSecret'
                 id='clientSecret'
                 placeholder='Client Secet' 
                 onChange={handleInputsChange}
                 value={loginkeys.clientSecret}
                 className={`form-control   ${errors.clientSecret && "is-invalid"}`}
                 />
                 <div className="invalid-feedback">{errors.clientSecret}</div>
                 </div>
             </div>
             <div className='form-group row'>
               <label htmlFor='redirectUrl'className="col-sm-3 col-form-label">Google Cloud RedirectUrl<span className="text-danger">*</span></label>
               <div className="col-sm-9">
                <input
                 id='redirectUrl'
                 name='redirectUrl'
                 value={loginkeys.redirectUrl}
                 placeholder=' RedirectUrl'
                 onChange={handleInputsChange}
                 className={`form-control   ${errors.redirectUrl && "is-invalid"}`}
                 />
                 <div className="invalid-feedback">{errors.redirectUrl}</div>
                 </div>
   
             </div>
          
         
      
         
         <div className='btngrp' >
           <button className='btn btn-primary' onClick={save}>Save</button>
         </div>
         
     </div>)
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
                            <li className="breadcrumb-item"><a href="#">Google Credentials </a></li>
                        </ul>
                        
                    </div>
                </div>
            </div>
    </div>
    <div className="card">
      <div className=" card-body">
      <div className="row">
      <div className="col-12">
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
    {isnotFound ?EditInputs: oldinputs  }
    </div>
    </div>
    </div>
    </div>
    </div>
  )
}


export default SocialLoginKeysAdmin