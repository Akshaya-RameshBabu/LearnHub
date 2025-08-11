import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
const StripeKeys = () => {
    const MySwal = withReactContent(Swal);
    const token = sessionStorage.getItem("token");
    const[loading,setloading]=useState(false)
    const [isnotFound, setisnotFound] = useState();
    const navigate = useNavigate();
    const [defaultstripe,setdefaultstripe]=useState({
        stripe_publish_key:"",
        stripe_secret_key:""
    })
    const[stripekeys,setstripekeys]=useState({
         stripe_publish_key:"",
        stripe_secret_key:""
    })
    const [errors, seterrors] = useState({
       stripe_publish_key:"",
        stripe_secret_key:""
      });
        const getstripeDetails=async()=>{
         try{
            if(token){
              setloading(true)
         const response=await axios.get(`${baseUrl}/api/get/stripekeys`,{
           headers:{
             Authorization:token
           }
         })
         if(response.status===200){
          setdefaultstripe(response.data)
           setstripekeys(response.data)
           setisnotFound(false)
         }else if(response.status===204){
           setisnotFound(true)
         }
        }
       }catch(error){
        if(error.response && error.response.status===401){
            navigate("/unauthorized")
        }
         console.log(error)
         throw error
       }finally{
        setloading(false)
       }
      
        }
      useEffect(()=>{
        getstripeDetails();
     },[]
    
    )
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the stripeKeys state
    setstripekeys((prev) => ({
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
    if (!stripekeys.stripe_publish_key || !stripekeys.stripe_secret_key) {
        seterrors({
          stripe_publish_key: stripekeys.stripe_publish_key ? "" : "Stripe publish key is required",
          stripe_secret_key: stripekeys.stripe_secret_key ? "" : "Stripe secret key is required",
        });
        return; // Prevent submission if any keys are empty
      }
  if(token){
      const response=await axios.post(`${baseUrl}/api/save/stripekeys`,stripekeys,{
        headers: {
          Authorization: token,
        },
      });
      if(response.status===200){
        MySwal.fire({
          title: `${response.data}`,
          text: ` Stripe keys  ${response.data} Successfully`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
         getstripeDetails();
          }   });
        setisnotFound(false)
      } 
    }
}catch(error){
    if(error.response && error.response.status===401){
        navigate("/unauthorized")
    }
    console.log(error);
    throw error
}

      }

        const Skeleton = (
  <div className="col-12 skeleton-wrapper">
  <h4>Stripe Settings</h4>
    {/* Razorpay Key */}
    <div className="form-group row">
       <label htmlFor="stripe_publish_key" className="col-sm-3 col-form-label">
         Publishable key<span className="text-danger">*</span>
         </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>
    <br />

    {/* Razorpay Secret Key */}
    <div className="form-group row">
   <label htmlFor="stripe_secret_key" className="col-sm-3 col-form-label">
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
    const OldStripe=(  <div className="col-12">
       
       <h4>Stripe Settings</h4>
       <div className="form-group row">
         <label htmlFor="stripe_publish_key" className="col-sm-3 col-form-label">
         Publishable key<span className="text-danger">*</span>
         </label>
         <div className="col-sm-9">
           <input
             id="stripe_publish_key"
             placeholder="Publishable key"
             name="stripe_publish_key"
             value={defaultstripe.stripe_publish_key}
             className="form-control"
             readOnly
           />
         </div>
       </div>
 
       <div className="form-group row">
         <label htmlFor="stripe_secret_key" className="col-sm-3 col-form-label">
         Secret key
         </label>
         <div className="col-sm-9">
           <input
           type="password"
             id="stripe_secret_key"
             name="stripe_secret_key"
             placeholder="Secret key"
             value={defaultstripe.stripe_secret_key}
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
    const editStripe=(<div className="col-12">
        <h4>Stripe Settings</h4>
        <div className="form-group row" >
          <label htmlFor="stripe_publish_key" className="col-sm-3 col-form-label">
          Publishable key<span className="text-danger">*</span>
          </label>
          <div className="col-sm-9">
            <input
           
              id="stripe_publish_key"
              onChange={handleChange}
              placeholder="Publishable key"
              name="stripe_publish_key"
              value={stripekeys.stripe_publish_key}
              className={`form-control   ${errors.stripe_publish_key && "is-invalid"}`}
            />
            <div className="invalid-feedback">{errors.stripe_publish_key}</div>
          </div>
        </div>
  
        <div className="form-group row">
          <label htmlFor="stripe_secret_key" className="col-sm-3 col-form-label">
          Secret key<span className="text-danger">*</span>
          </label>
          <div className="col-sm-9">
            <input
             type="password"
             onChange={handleChange}
              id="stripe_secret_key"
              name="stripe_secret_key"
              placeholder="Secret key"
              value={stripekeys.stripe_secret_key}
              className={`form-control   ${errors.stripe_secret_key && "is-invalid"}`}
            />
            <div className="invalid-feedback">{errors.stripe_secret_key}</div>
          </div>
        </div>
  
      
        <div className="cornerbtn">
         {defaultstripe.stripe_publish_key ?  <button className="btn btn-secondary" onClick={()=>setisnotFound(false)}>Cancel</button>:<div></div>}
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
          isnotFound ?editStripe  :OldStripe }</div>
      </div>
    </div>
  )
}

export default StripeKeys;