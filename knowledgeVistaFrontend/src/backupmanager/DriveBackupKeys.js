import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import baseUrl from '../api/utils';
import axios from 'axios';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const DriveBackupKeys = () => {
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();

  const [driveOauthKeys, setDriveOauthKeys] = useState({
    clientId: "",
    clientSecret: "",
  });

  const [showClientId, setShowClientId] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  const [errors, setErrors] = useState({
    clientId: "",
    clientSecret: "",
  });
const[loading,setloading]=useState(false)
  const [isNotFound, setIsNotFound] = useState(false);
   const fetchDriveCredentials = async () => {
        try {
          setloading(true)
          const response = await axios.get(`${baseUrl}/get/DriveCredentials`, {
            headers: {
              "Authorization": token
            }
          });

          if (response.status === 200) {
            setDriveOauthKeys(response.data);
          } else if (response.status === 204 || response.status === 404) {
            setIsNotFound(true);
          }
        } catch (error) {
          if (error.response?.status === 401) {
            navigate("/unauthorized");
          } else {
            setIsNotFound(true);
          }
        }finally{
          setloading(false)
        }
      };
  useEffect(() => {
      fetchDriveCredentials();
  }, []);
  const handleInputsChange = (e) => {
    const { name, value } = e.target;
    let error = "";

    switch (name) {
      case 'clientId':
        error = value.trim() === '' ? 'Please enter a valid Client ID' : '';
        break;
      case 'clientSecret':
        error = value.trim() === '' ? 'Please enter a valid Client Secret' : '';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    setDriveOauthKeys(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (e) => {
    e.preventDefault();
    setIsNotFound(true);
  };

const handleSave = async (e) => {
  e.preventDefault();
  const requiredFields = ['clientId', 'clientSecret'];
  let hasErrors = false;

  requiredFields.forEach(field => {
    if (!driveOauthKeys[field]?.trim()) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
    }
  });

  if (hasErrors) return;

  try {
    const response = await axios.post(`${baseUrl}/save/DriveCredentials`, driveOauthKeys, {
      headers: { Authorization: token }
    });

    if (response.status === 200) {
      MySwal.fire({
        title: "Saved!",
        text: response.data,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {fetchDriveCredentials()});
    } else if (response.status === 202) {
      MySwal.fire({
  icon: 'info',
  title: 'Authorization Needed!',
  text: 'Please complete the Google authorization in the new tab.',
  showConfirmButton: true,
  confirmButtonText: "Authorize Now",
}).then((result)=>{
const url = response.data.replace("🔐 Please authorize access: ", "").trim();
      window.open(url, "_blank");
})

    }

  } catch (error) {
    console.error("Error saving credentials:", error);
  }
};

const Skeleton = (
  <div>
    <h4>Google Drive Backup Settings</h4>

    {/* Google Client ID */}
    <div className="form-group row">
      <label className="col-sm-3 col-form-label">
        Google Client ID <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9 input-group">
        <div className="skeleton skeleton-input"></div>
      
      </div>
    </div>

    {/* Google Client Secret */}
    <div className="form-group row">
      <label className="col-sm-3 col-form-label">
        Google Client Secret <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9 input-group">
        <div className="skeleton skeleton-input"></div>
       
      </div>
    </div>

    {/* Edit button */}
    <div className="btngrp">
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);

  const editableInputs = (
    <form onSubmit={handleSave}>
      <h4> Google Drive Backup Settings</h4>

      <div className='form-group row'>
        <label htmlFor='clientId' className='col-sm-3 col-form-label'>
          Google Client ID <span className="text-danger">*</span>
        </label>
        <div className='col-sm-9 input-group'>
          <input
            id='clientId'
            name='clientId'
            type={showClientId ? 'text' : 'password'}
            value={driveOauthKeys.clientId}
            onChange={handleInputsChange}
            className={`form-control ${errors.clientId ? 'is-invalid' : ''}`}
            placeholder='Enter Client ID'
          />
          <div className="input-group-append">
            <button type="button" className="hidebtn" onClick={() => setShowClientId(!showClientId)}>
              <i className={`fa-solid ${showClientId ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
        </div>
      </div>

      <div className='form-group row'>
        <label htmlFor='clientSecret' className='col-sm-3 col-form-label'>
          Google Client Secret <span className="text-danger">*</span>
        </label>
        <div className='col-sm-9 input-group'>
          <input
            id='clientSecret'
            name='clientSecret'
            type={showClientSecret ? 'text' : 'password'}
            value={driveOauthKeys.clientSecret}
            onChange={handleInputsChange}
            className={`form-control ${errors.clientSecret ? 'is-invalid' : ''}`}
            placeholder='Enter Client Secret'
          />
          <div className="input-group-append">
            <button type="button" className="hidebtn" onClick={() => setShowClientSecret(!showClientSecret)}>
              <i className={`fa-solid ${showClientSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errors.clientSecret && <div className="invalid-feedback">{errors.clientSecret}</div>}
        </div>
      </div>

      <div className='btngrp'>
        <button type='submit' className='btn btn-primary'>Save</button>
      </div>
    </form>
  );

  const readOnlyInputs = (
    <div>
      <h4>Google Drive Backup Settings</h4>

      <div className='form-group row'>
        <label className="col-sm-3 col-form-label">
          Google Client ID <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9 input-group">
          <input
            type={showClientId ? "text" : "password"}
            value={driveOauthKeys.clientId}
            className='form-control'
            readOnly
          />
          <div className="input-group-append">
            <button
              type="button"
              className="hidebtn"
              onClick={() => setShowClientId(prev => !prev)}
            >
              <i className={`fa-solid ${showClientId ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <div className='form-group row'>
        <label className="col-sm-3 col-form-label">
          Google Client Secret <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9 input-group">
          <input
            type={showClientSecret ? "text" : "password"}
            value={driveOauthKeys.clientSecret}
            className='form-control'
            readOnly
          />
          <div className="input-group-append">
            <button
              type="button"
              className="hidebtn "
              onClick={() => setShowClientSecret(prev => !prev)}
            >
              <i className={`fa-solid ${showClientSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <div className='btngrp'>
        <button className='btn btn-success' onClick={handleEdit}>Edit</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"></div>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-12">
              <div className="navigateheaders">
                <div onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-arrow-left"></i>
                </div>
                <div></div>
                <div onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-xmark"></i>
                </div>
              </div>
              {loading? Skeleton: isNotFound ? editableInputs : readOnlyInputs}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveBackupKeys;
