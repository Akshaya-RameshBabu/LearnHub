import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FooterDetails = () => {
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const [isnotFound, setisnotFound] = useState();
  const navigate = useNavigate();
  const[loading,setLoading]=useState(false)
  const [FooterDetails, setFooterDetails] = useState({
    copyright: "",
    contact: "",
    supportmail: "",
    institutionmail: "",
  });
  const [errors, seterrors] = useState({
    copyright: "",
    contact: "",
    supportmail: "",
    institutionmail: "",
  });
  const [defaultFooterDetails, setdefaultFooterDetails] = useState({
    copyright: "",
    contact: "",
    supportmail: "",
    institutionmail: "",
  });
      const getFooterdetails=async()=>{
     try{
      setLoading(true)
     const response=await axios.get(`${baseUrl}/Get/FooterDetails`,{
       headers:{
         Authorization:token
       }
     })
     if(response.status===200){
      setdefaultFooterDetails(response.data)
       setFooterDetails(response.data)
       setisnotFound(false)
     }else if(response.status===204){
       setisnotFound(true)
     }
   }catch(error){
     console.log(error)
   }finally{
   setLoading(false)
   }
  
    }
  useEffect(()=>{
    getFooterdetails();
 },[]

)
  const handleChange=(e)=>{
const{name,value}=e.target;
setFooterDetails((prev)=>({
    ...prev,
    [name]:value
}));
 

  }
  const Edit = (e) => {
    e.preventDefault();
    setisnotFound(true);
  };
  const save = async(e) => {
    try{
        e.preventDefault();
       const response=await axios.post(`${baseUrl}/save/FooterDetails`,FooterDetails,{
          headers: {
            Authorization: token,
          },
        });
        if(response.status===200){
          MySwal.fire({
            title: `${response.data}`,
            text: ` Footer Settings  ${response.data} Successfully`,
            icon: "success",
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
           getFooterdetails();
            }   });
          setisnotFound(false)
        } 
        
      }catch(error){
        console.log(error)
      }
  }

  const Skeleton = (
  <div className="skeleton-wrapper">
    <div className="form-group row">
      <label htmlFor="copyright" className="col-sm-3 col-form-label">
        Copy Right Content <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="contact" className="col-sm-3 col-form-label">
        Contact Mobile <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="supportmail" className="col-sm-3 col-form-label">
        Support mail <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="institutionmail" className="col-sm-3 col-form-label">
        Institution mail <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="cornerbtn" style={{ display: "flex", gap: "10px" }}>
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);

  const editFooter = (
    <div>
      <div className="form-group row" >
        <label htmlFor="copyright" className="col-sm-3 col-form-label">
          Copy Right Content<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="copyright"
            onChange={handleChange}
            placeholder="CopyRight Content"
            name="copyright"
            value={FooterDetails.copyright}
            className={`form-control   ${errors.copyright && "is-invalid"}`}
          />
          <div className="invalid-feedback">{errors.copyright}</div>
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="contact" className="col-sm-3 col-form-label">
           Contact Mobile<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
           onChange={handleChange}
            id="contact"
            name="contact"
            placeholder="Contact Mobile"
            value={FooterDetails.contact}
            className={`form-control   ${errors.contact && "is-invalid"}`}
          />
          <div className="invalid-feedback">{errors.contact}</div>
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="supportmail" className="col-sm-3 col-form-label">
           Support mail<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
           onChange={handleChange}
            id="supportmail"
            name="supportmail"
            placeholder="Support Mail"
            value={FooterDetails.supportmail}
            className={`form-control   ${errors.supportmail && "is-invalid"}`}
          />
          <div className="invalid-feedback">{errors.supportmail}</div>
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="institutionmail" className="col-sm-3 col-form-label">
           Institution mail<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
           onChange={handleChange}
            id="institutionmail"
            name="institutionmail"
            placeholder="Institution Mail"
            value={FooterDetails.institutionmail}
            className={`form-control   ${errors.institutionmail && "is-invalid"}`}
          />
          <div className="invalid-feedback">{errors.institutionmail}</div>
        </div>
      </div>
      <div className="cornerbtn">
        <button className="btn btn-secondary" onClick={()=>navigate(-1)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={save}
          >
            Save
          </button>
        </div>
    </div>
  );
  const oldfooter = (
   <div>
      <div className="form-group row">
        <label htmlFor="copyright" className="col-sm-3 col-form-label">
          Copy Right Content<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="copyright"
            placeholder="CopyRight Content"
            name="copyright"
            value={defaultFooterDetails.copyright}
            className="form-control"
            readOnly
          />
         </div>
      </div>

      <div className="form-group row">
        <label htmlFor="contact" className="col-sm-3 col-form-label">
           Contact Mobile
        </label>
        <div className="col-sm-9">
          <input
            id="contact"
            name="contact"
            placeholder="Contact Mobile"
            value={defaultFooterDetails.contact}
            className="form-control "
            readOnly
          />
          
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="supportmail" className="col-sm-3 col-form-label">
           Support mail
        </label>
        <div className="col-sm-9">
          <input
            id="supportmail"
            name="supportmail"
            placeholder="Support Mail"
            value={defaultFooterDetails.supportmail}
            className="form-control"
            readOnly
          />
         
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="institutionmail" className="col-sm-3 col-form-label">
           Institution mail
        </label>
        <div className="col-sm-9">
          <input
            id="institutionmail"
            name="institutionmail"
            placeholder="Institution Mail"
            value={defaultFooterDetails.supportmail}
            className="form-control"
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
                            <li className="breadcrumb-item"><a href="#">Footer Settings </a></li>
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
      <h4>Footer Settings</h4>
      {loading?Skeleton: isnotFound ?editFooter  :oldfooter }</div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default FooterDetails;
