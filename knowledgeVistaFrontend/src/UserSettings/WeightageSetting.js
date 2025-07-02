import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../api/utils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const WeightageSetting = () => {
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [notfound, setnotfound] = useState(true);
  const [submitting, setsubmitting] = useState(false);
  const token = sessionStorage.getItem("token");
  const [weights, setWeights] = useState({
    test: 80,
    quiz: 10,
    attendance: 5,
    assignment: 5,
  });
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const fetchWeightageDetails = async () => {
    try {
      setsubmitting(true);
      const res = await axios.get(`${baseUrl}/get/Weightage`, {
        headers: {
          Authorization: token,
        },
      });
      setsubmitting(false);
      if (res.status === 200) {
        setnotfound(false);
        setPassingPercentage(res?.data?.passPercentage);
        setWeights(() => ({
          test: res?.data?.testWeightage,
          quiz: res?.data?.quizzWeightage,
          attendance: res?.data?.attendanceWeightage,
          assignment: res?.data?.assignmentWeightage,
        }));
      } else if (res.status === 204) {
        setnotfound(true);
      }
    } catch (err) {
      setsubmitting(false);
      if (err?.response?.status === 403) {
        navigate("/unaithorized");
      } else if (err?.response?.status === 401) {
        navigate("/unaithorized");
      } else {
        console.log(err);
        throw err;
      }
    }
  };
  useEffect(() => {
    fetchWeightageDetails();
  }, []);
  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    let newValue = Number(value);

    // Ensure input value is within valid range
    if (newValue < 0 || newValue > 100) return;

    // Calculate total weight excluding the current field
    let totalExcludingCurrent = Object.entries(weights)
      .filter(([key]) => key !== name)
      .reduce((sum, [, val]) => sum + val, 0);

    // Ensure the new total does not exceed 100%
    if (totalExcludingCurrent + newValue > 100) {
         MySwal.fire({
              toast:true,
        position: 'top-end', 
        icon: 'warning',
        title: 'Total weightage cannot exceed 100%!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      return;
    }

    // Update state
    setWeights((prevWeights) => ({
      ...prevWeights,
      [name]: newValue,
    }));
  };
  const handleSave = async () => {
    try {
      const response = {
        passPercentage: passingPercentage,
        testWeightage: weights.test,
        quizzWeightage: weights.quiz,
        assignmentWeightage: weights.assignment,
        attendanceWeightage: weights.attendance,
      };
      const res = await axios.post(`${baseUrl}/save/Weightage`, response, {
        headers: {
          Authorization: token,
        },
      });
      if (res.status === 200) {
        MySwal.fire({
          title: `${res.data}`,
          text: ` Weightage settings  ${res.data} Successfully`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            fetchWeightageDetails();
          }
        });
      }
    } catch (err) {
      if (err?.response?.status === 400) {
 MySwal.fire({
              toast:true,
        position: 'top-end', 
        icon: 'error',
        title:err?.response?.data,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      } else if (err?.response?.status === 401) {
        navigate("/unaithorized");
      } else if (err?.response?.status === 403) {
        navigate("/unaithorized");
      } else {
        console.log(err);
        throw err;
      }
    }
  };
  const Edit = (e) => {
    e.preventDefault();
    setnotfound(true);
  };
  const Oldweightage = (
    <div>
      {/* Passing Percentage (Separate) */}
      <div className="form-group row">
        <label className="col-sm-3 col-form-label">
          Passing Percentage (%)
        </label>
        <div className="col-sm-4">
          <input
            type="number"
            min="0"
            max="100"
            className="form-control"
            value={passingPercentage}
            readOnly
          />
        </div>
      </div>

      {/* Weightage Inputs */}
      {Object.keys(weights).map((key) => (
        <div className="form-group row" key={key}>
          <label className="col-sm-3 col-form-label">
            {key.charAt(0).toUpperCase() + key.slice(1)} Weightage (%)
            {key === "test" && (
        <>
          <br />
          <small className="text-muted">(Test + Module Test)</small>
        </>
      )}
          </label>
          <div className="col-sm-4">
            <input
              type="number"
              name={key}
              min="0"
              max="100"
              className="form-control"
              value={weights[key]}
              readOnly
            />
          </div>
        </div>
      ))}

      <div className="btngrp">
        <button className="btn btn-success" onClick={Edit}>
          Edit
        </button>
      </div>
    </div>
  );
  const newweightage = (
    <div>
      {/* Passing Percentage (Separate) */}
      <div className="form-group row">
        <label className="col-sm-3 col-form-label">
          Passing Percentage (%)
        </label>
        <div className="col-sm-4">
          <input
            type="number"
            min="0"
            max="100"
            className="form-control"
            value={passingPercentage}
            onChange={(e) => setPassingPercentage(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Weightage Inputs */}
      {Object.keys(weights).map((key) => (
        <div className="form-group row" key={key}>
          <label className="col-sm-3 col-form-label">
            {key.charAt(0).toUpperCase() + key.slice(1)} Weightage (%)
            {key === "test" && (
        <>
          <br />
          <small className="text-muted">(Test + Module Test)</small>
        </>
      )}
          </label>
          <div className="col-sm-4">
            <input
              type="number"
              name={key}
              min="0"
              max="100"
              className="form-control"
              value={weights[key]}
              onChange={handleWeightChange}
            />
          </div>
        </div>
      ))}

      <div className="btngrp">
        <button className="btn btn-primary" onClick={handleSave}>
          Save
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
                            <li className="breadcrumb-item"><a href="#">Grade Weightage </a></li>
                        </ul>
                        
                    </div>
                </div>
            </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="navigateheaders">
            <div onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left"></i>
            </div>
            <div></div>
            <div onClick={() => navigate(-1)}>
              <i className="fa-solid fa-xmark"></i>
            </div>
          </div>
          <h4>Grade Weightage Settings</h4>
          {submitting ? (
         <div className="skeleton-wrapper">
         {/* Passing Percentage */}
         <div className="form-group row">
           <label className="col-sm-3 col-form-label">Passing Percentage (%)</label>
           <div className="col-sm-4">
             <div className="skeleton skeleton-input"></div>
           </div>
         </div>
     
         {/* Test Weightage */}
         <div className="form-group row">
           <label className="col-sm-3 col-form-label">Test Weightage (%)</label>
           <div className="col-sm-4">
             <div className="skeleton skeleton-input"></div>
           </div>
         </div>
     
         {/* Quiz Weightage */}
         <div className="form-group row">
           <label className="col-sm-3 col-form-label">Quiz Weightage (%)</label>
           <div className="col-sm-4">
             <div className="skeleton skeleton-input"></div>
           </div>
         </div>
     
         {/* Attendance Weightage */}
         <div className="form-group row">
           <label className="col-sm-3 col-form-label">Attendance Weightage (%)</label>
           <div className="col-sm-4">
             <div className="skeleton skeleton-input"></div>
           </div>
         </div>
     
         {/* Assignment Weightage */}
         <div className="form-group row">
           <label className="col-sm-3 col-form-label">Assignment Weightage (%)</label>
           <div className="col-sm-4">
             <div className="skeleton skeleton-input"></div>
           </div>
         </div>
     
         {/* Save Button Placeholder */}
         <div className="btngrp">
           <div className="skeleton skeleton-button"></div>
         </div>
       </div>
     
        ) : (
          notfound ? newweightage : Oldweightage
        )}

        </div>
      </div>
    </div>
  );
};

export default WeightageSetting;
