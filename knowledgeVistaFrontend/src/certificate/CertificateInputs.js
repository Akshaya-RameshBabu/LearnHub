import React, { useState,useEffect } from 'react';
import signature from "../images/signature.png"
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from '../api/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import errorimg from "../images/errorimg.png"

const CertificateInputs = () => {

  const token=sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const[loading,setLoading]=useState(false)
  const [defaultcerti,setdefaultcerti]=useState({
    institutionName: '',
    ownerName: '',
    qualification: '',
    address: '',
    authorizedSign: null,
  
  });

  const navigate=useNavigate();

  const [certificate, setCertificate] = useState({
    institutionName: '',
    ownerName: '',
    qualification: '',
    address: '',
    authorizedSign: null, 
  });

  const [errors, setErrors]= useState({
    institutionName: '',
    ownerName: '',
    qualification: '',
    address: '',
    authorizedSign: '', 
  });
const [isnotFound,setisnotFound]=useState();
const[sign,setsign]=useState();
const [getSign,setgetSign]=useState();
const[isinitial,setisinitial]=useState(true);
  const fetchCertificate = async () => {
    try {
      setLoading(true)
      const certificatedata = await axios.get(`${baseUrl}/certificate/viewAll`,{
        headers: {
          Authorization: token,
        }
      });
      if (certificatedata.status === 200) {
        const certificateJson = certificatedata.data;
        setsign(`data:image/jpeg;base64,${certificateJson.authorizedSign}`);
        setdefaultcerti(certificateJson);
        setCertificate(certificateJson);
        setisinitial(false);
      }else if(certificatedata.status === 204){
        setisnotFound(true);

      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setisnotFound(true);
        
      }
      else{
        throw error
      }
    }finally{
      setLoading(false)
    }
  };
useEffect(() => {

  fetchCertificate();
}, []);


const handleEdit=()=>{
setgetSign(`data:image/jpeg;base64,${certificate.authorizedSign}`)
setisnotFound(true);

}

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setgetSign(e.target.result)
        setCertificate(prevState => ({
          ...prevState,
          authorizedSign: file // Store file object in certificate state
        }));
        setErrors(prevErrors => ({
          ...prevErrors,
          authorizedSign: ''
        }));
      };
      reader.readAsDataURL(file);
    } 

    // Reset input value
    event.target.value = null;
  };

  const handleChange = (event) => {
    const { id, value } = event.target;
    let error = '';

    switch (id) {
      case 'institutionName':
        error = value.length < 1 ? 'Please enter  Instituition Name' : '';
        break;
      case 'ownerName':
        error = value.length < 1 ? 'Please enter  ownerName' : '';
        break;
        case 'qualification':
          error = value.length < 1 ? 'Please enter  qualification' : '';
          break;
          case 'address':
            error = value.length < 1 ? 'Please enter  address' : '';
            break;
      
      default:
        break;
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [id]: error
    }));

    setCertificate(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSave = async () => {
   try {

      let hasErrors = false;
      const requiredFields = ['institutionName', 'ownerName', 'qualification',  'address'];
    
      requiredFields.forEach(field => {
        if (!certificate[field] || certificate[field].length === 0 || errors[field]) {
          hasErrors = true;
          setErrors(prevErrors => ({
            ...prevErrors,
            [field]: !certificate[field] ? 'This field is required' : errors[field]
          }));
        }
      });
      if(!certificate.authorizedSign){
        hasErrors = true;
        setErrors(prevErrors => ({
          ...prevErrors,
          authorizedSign: 'Image is Required'
        }));
      }
    
      if (hasErrors) {
        return;
      }
     
        const formData = new FormData();
        formData.append('institutionName', certificate.institutionName);
        formData.append('ownerName', certificate.ownerName);
        formData.append('qualification', certificate.qualification);
        formData.append('address', certificate.address);
        formData.append('authorizedSign', certificate.authorizedSign); 
        formData.append("certificateId", certificate.certificateId);
      
        const url = isinitial ? `${baseUrl}/certificate/add` : `${baseUrl}/certificate/Edit`;
        const method = isinitial ? "POST" : "PATCH";
      let response;
        if (method === 'POST') {
           response = await axios.post(url, formData, {
              headers: {
                  "Authorization": token,
              }
          });
      } else if (method === 'PATCH') {
           response = await axios.patch(url, formData, {
              headers: {
                  "Authorization": token,
              }
          });
      }
        
        const data = response.data;
        if (response.status===200) {
          MySwal.fire({
            title: "Saved",
            text: data,
            icon: "success",
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
            fetchCertificate()
            }
          });
        }
      } catch (error) {
      
        // MySwal.fire({
        //   title: "Error!",
        //   text: error.response.data ? error.response.data : "error occured",
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error
    }
    
         
};
const Skeleton = (
  <div >
    <div className="mainform">
      <div className="profile-picture">
        <div className="image-group">
         <div className="skeleton-circle mt-3 ml-3"></div>
        </div>
       
      </div>

      <div>
        <div className="form-group row">
          <label
            htmlFor="institutionName"
            className="col-sm-3 col-form-label"
          >
            Institution Name
          </label>
          <div className="col-sm-9">
            <div className="skeleton skeleton-input"></div>
          </div>
        </div>

        <div className="form-group row">
          <label htmlFor="ownerName" className="col-sm-3 col-form-label">
            Owner Name
          </label>
          <div className="col-sm-9">
            <div className="skeleton skeleton-input"></div>
          </div>
        </div>

        <div className="form-group row">
          <label htmlFor="qualification" className="col-sm-3 col-form-label">
            Qualification
          </label>
          <div className="col-sm-9">
            <div className="skeleton skeleton-input"></div>
          </div>
        </div>

        <div className="form-group row">
          <label htmlFor="address" className="col-sm-3 col-form-label">
            Address
          </label>
          <div className="col-sm-9">
            <div className="skeleton skeleton-input"></div>
          </div>
        </div>
      </div>
    </div>

    <div className="btngrp">
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);

const certificateInputs=(
 <div>
<div className='mainform'>
  <div className='profile-picture'>
  <div className='image-group'>
  <img
            src={getSign || signature}
              width="200px"
              height="200px"
            alt='Signature'
            className='profile-image'
          />
      
    
    </div>
    <div className='custom-file'>
    <label htmlFor='fileInput'className="custom-file-label">
      Upload
    </label>
    <div className="text-danger">{errors.authorizedSign}</div>
    <input
      type='file'
      style={{display:"none"}}
      id='fileInput'
      className='file-upload'
      accept='image/*'
      onChange={handleFileChange}
    />
    </div>
  </div>


  <div>
    <div className='form-group row'>
      <label htmlFor='institutionName'className="col-sm-3 col-form-label">Institution Name <span className="text-danger">*</span></label>
      <div className="col-sm-9">
      <input
        id='institutionName'
        className={`form-control   ${errors.institutionName && 'is-invalid'}`}
        placeholder='Institution Name'
        value={certificate.institutionName}
        onChange={handleChange}
        required
      />
      <div className="invalid-feedback">
                {errors.institutionName}
              </div>
              </div>
    </div>

    <div className='form-group row'>
      <label htmlFor='ownerName'className="col-sm-3 col-form-label">Owner Name <span className="text-danger">*</span></label>
      <div className="col-sm-9">
      <input
        id='ownerName'
        placeholder='Owner Name'
        
        className={`form-control   ${errors.ownerName && 'is-invalid'}`}
        value={certificate.ownerName}
        onChange={handleChange}
        required
      />
       <div className="invalid-feedback">
                {errors.ownerName}
              </div>
              </div>
    </div>

    <div className='form-group row'>
      <label htmlFor='qualification'className="col-sm-3 col-form-label">Qualification <span className="text-danger">*</span></label>
      <div className="col-sm-9">
      <input
      name='qualification'
        id='qualification'
        className={` form-control   ${errors.qualification && 'is-invalid'}`}
        placeholder='Qualification'
        value={certificate.qualification}
        onChange={handleChange}
        required
      />
       <div className="invalid-feedback">
                {errors.qualification}
              </div>
              </div>
    </div>

    <div className='form-group row'>
      <label htmlFor='address'className="col-sm-3 col-form-label">Address <span className="text-danger">*</span></label>
      <div className="col-sm-9">
      <input
        id='address'
        placeholder='Address'
        
        className={`form-control   ${errors.address && 'is-invalid'}`}
        value={certificate.address}
        onChange={handleChange}
        required
      />
       <div className="invalid-feedback">
                {errors.address}
              </div>
              </div>
    </div>

   
  </div>
</div>
<div className='btngrp'>
  <button className='btn btn-primary' onClick={handleSave}>Save</button>
</div>
</div>
);

const certificateView=(
 <div>
        <div className='mainform'>
          <div className='profile-picture'>
          <div className='image-group'>
              <img src={sign} 
               onError={(e) => {
                e.target.src = errorimg; // Use the imported error image
              }}
              width="200px"
              height="200px"
              alt='signature' />
            </div>
          
          </div>
        
<div>
          <div className='form-group row'>
              <label htmlFor='institutionName'
              className="col-sm-3 col-form-label">Institution Name</label>
              <div className="col-sm-9">
              <input
                id='institutionName'
                placeholder='Institution Name'
                value={defaultcerti.institutionName}
                className='form-control'
                readOnly
              />
              </div>
            </div>

            <div className='form-group row'>
              <label htmlFor='ownerName'
              className="col-sm-3 col-form-label">Owner Name</label>
                 <div className="col-sm-9">
              <input
                id='ownerName'
                placeholder='Owner Name'
                value={defaultcerti.ownerName}
                className='form-control'
                readOnly
              />
              </div>
            </div>

            <div className='form-group row'>
              <label htmlFor='qualification' className="col-sm-3 col-form-label">Qualification</label>
              <div className="col-sm-9">
              <input
                id='qualification'
                placeholder='Qualification'
                value={defaultcerti.qualification}
                className='form-control'
                readOnly
              />
              </div>
            </div>

            <div className='form-group row'>
              <label htmlFor='address'
              className="col-sm-3 col-form-label">Address</label>
              <div className="col-sm-9">
              <input
                id='address'
                placeholder='Address'
                value={defaultcerti.address}
                className='form-control'
                readOnly
               
              />
              </div>
            </div>
            </div>
           
          </div>
        <div className='btngrp '>
  <button className='btn btn-success' onClick={handleEdit}>Edit</button>
</div>
      </div>
)

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
                            <li className="breadcrumb-item"><a href="#">Certificate </a></li>
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
<h1>Certificate Form</h1>
         
      {loading? Skeleton: isnotFound ? certificateInputs : certificateView}
   </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default CertificateInputs;
