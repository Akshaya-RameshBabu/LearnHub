import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
const PaypalSettings = () => {
    const MySwal = withReactContent(Swal);
    const token = sessionStorage.getItem("token");
    const [isnotFound, setisnotFound] = useState();
    const[loading,setloading]=useState(false)
    const navigate = useNavigate();
    const [defaultpaypal,setdefaultpaypal]=useState({
        paypal_client_id:"",
        paypal_secret_key:""
    })
    const[paypalkeys,setpaypalkeys]=useState({
         paypal_client_id:"",
        paypal_secret_key:""
    })
    const [errors, seterrors] = useState({
       paypal_client_id:"",
        paypal_secret_key:""
      });
         const getpaypalDetils=async()=>{
         try{
            if(token){
              setloading(true)
         const response=await axios.get(`${baseUrl}/api/get/PaypalKeys`,{
           headers:{
             Authorization:token
           }
         })
         if(response.status===200){
          setdefaultpaypal(response.data)
           setpaypalkeys(response.data)
           setisnotFound(false)
         }else if(response.status===204){
           setisnotFound(true)
         }
        }
       }catch(error){
        if(error.response && error.response.status===401){
          MySwal.fire({
            title: "UnAuthorized!",
            text: `You are Unauthorized to access this page as ${error.response?.data}`,
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => {
            // Navigate to the unauthorized page when the popup closes
            navigate("/unauthorized");
          });
        
            
        }
         throw error
       }finally{
        setloading(false)
       }
      
        }
      useEffect(()=>{
     
        getpaypalDetils();
     },[]
    
    )
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the paypalkeys state
    setpaypalkeys((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate input for empty fields
    if (value.trim() === "") {
      // Set error message if the value is empty
      seterrors((prevErrors) => ({
        ...prevErrors,
        [name]: `${name.replace('_', ' ')} is required`,
      }));
    } else {
      // Clear error message if the field is not empty
      seterrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

    const Edit = (e) => {
        e.preventDefault();
        setisnotFound(true);
      };
      const save = async(e) => {
        try{
            e.preventDefault();
                // Check if there are any errors and if both keys are provided
    if (!paypalkeys.paypal_client_id || !paypalkeys.paypal_secret_key) {
        seterrors({
          paypal_client_id: paypalkeys.paypal_client_id ? "" : "Paypal Client key is required",
          paypal_secret_key: paypalkeys.paypal_secret_key ? "" : "Paypal secret key is required",
        });
        return; // Prevent submission if any keys are empty
      }
  if(token){
      const response=await axios.post(`${baseUrl}/api/save/PaypalKeys`,paypalkeys,{
        headers: {
          Authorization: token,
        },
      });
      if(response.status===200){
        MySwal.fire({
          title: `${response.data}`,
          text: ` Paypal keys  ${response.data} Successfully`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
         getpaypalDetils();
          }   });
        setisnotFound(false)
      } 
    }
}catch(error){
    if(error.response && error.response.status===401){
      MySwal.fire({
        title: "UnAuthorized!",
        text: `You are Unauthorized to access this page as ${error.response?.data}`,
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => {
        // Navigate to the unauthorized page when the popup closes
        navigate("/unauthorized");
      });
    }
    console.log(error);
    throw error
}

      }

              const Skeleton = (
  <div className="col-12 skeleton-wrapper">
   <h4>Paypal Settings</h4>
    {/* Razorpay Key */}
    <div className="form-group row">
        <label htmlFor="paypal_client_id" className="col-sm-3 col-form-label">
         Client key<span className="text-danger">*</span>
         </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>
    <br />

    {/* Razorpay Secret Key */}
    <div className="form-group row">
   <label htmlFor="paypal_secret_key" className="col-sm-3 col-form-label">
         Secret key
         </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    {/* Buttons */}
    <div className="btngrp" >
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);
    const Oldpaypal=(  <div className="col-12">
       
       <h4>Paypal Settings</h4>
       <div className="form-group row">
         <label htmlFor="paypal_client_id" className="col-sm-3 col-form-label">
         Client key<span className="text-danger">*</span>
         </label>
         <div className="col-sm-9">
           <input
             id="paypal_client_id"
             placeholder="Client key"
             name="paypal_client_id"
             value={defaultpaypal.paypal_client_id}
             className="form-control"
             readOnly
           />
         </div>
       </div>
 
       <div className="form-group row">
         <label htmlFor="paypal_secret_key" className="col-sm-3 col-form-label">
         Secret key
         </label>
         <div className="col-sm-9">
           <input
           type="password"
             id="paypal_secret_key"
             name="paypal_secret_key"
             placeholder="Secret key"
             value={defaultpaypal.paypal_secret_key}
             className="form-control "
             readOnly
           />
           
         </div>
       </div>
 
       <div className="btngrp">
           <button
             className="btn btn-success"
             onClick={Edit}
           >
             Edit
           </button>
         </div>
     
     </div>)
    const editpaypal=(<div className="col-12">
        <h4>Paypal Settings</h4>
        <div className="form-group row" >
          <label htmlFor="paypal_client_id" className="col-sm-3 col-form-label">
          Client key<span className="text-danger">*</span>
          </label>
          <div className="col-sm-9">
            <input
           
              id="paypal_client_id"
              onChange={handleChange}
              placeholder="Client key"
              name="paypal_client_id"
              value={paypalkeys.paypal_client_id}
              className={`form-control   ${errors.paypal_client_id && "is-invalid"}`}
            />
            <div className="invalid-feedback">{errors.paypal_client_id}</div>
          </div>
        </div>
  
        <div className="form-group row">
          <label htmlFor="paypal_secret_key" className="col-sm-3 col-form-label">
          Secret key<span className="text-danger">*</span>
          </label>
          <div className="col-sm-9">
            <input
             type="password"
             onChange={handleChange}
              id="paypal_secret_key"
              name="paypal_secret_key"
              placeholder="Secret key"
              value={paypalkeys.paypal_secret_key}
              className={`form-control   ${errors.paypal_secret_key && "is-invalid"}`}
            />
            <div className="invalid-feedback">{errors.paypal_secret_key}</div>
          </div>
        </div>
  
      
        <div className="cornerbtn">
         {defaultpaypal.paypal_client_id ?  <button className="btn btn-secondary" onClick={()=>setisnotFound(false)}>Cancel</button>:<div></div>}
            <button
              className="btn btn-primary"
              onClick={save}
            >
              Save
            </button>
          </div>
      </div>)
  return (
    <div className="card">
      <div className=" card-body">
        <div className="row">
          {loading? Skeleton:
          isnotFound ?editpaypal  :Oldpaypal }</div>
      </div>
    </div>
  )
}

export default PaypalSettings;