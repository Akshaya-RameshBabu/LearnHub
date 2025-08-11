import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Razorpay_Settings = () => {
  const MySwal = withReactContent(Swal);
  const [valid, setValid] = useState(true);
  const data = sessionStorage.getItem("type");
  const[loading,setLoading]=useState(false)
  const token = sessionStorage.getItem("token");
  const [isnotFound, setisnotFound] = useState();
  const [initialsave, setinitialsave] = useState(false);
  const [defaultsettings, setdefaultsettings] = useState({
    id: "",
    razorpay_key: "",
    razorpay_secret_key: "",
  });
  const navigate = useNavigate();
    const fetchpaymentsettings = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${baseUrl}/api/getPaymentDetails`, {
          headers: {
            Authorization: token,
          },
        });

        if (response.status === 200) {
          const data = response.data;
          setdefaultsettings(data);
          setRazorpay_Key(data.razorpay_key || ''); // Set default empty string if not found
          setRazorpay_Secret_Key(data.razorpay_secret_key || '');
        }else if(response.status === 204){
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

    fetchpaymentsettings();
  }, []);

  const [errors, setErrors] = useState({
    Razorpay_Key: "",
    Razorpay_Secret_Key: "",
  });

  const [Razorpay_Key, setRazorpay_Key] = useState("");

  const changeRazorpay_KeyHandler = (event) => {
    const newValue = event.target.value;
    setRazorpay_Key(newValue);
    if (newValue?.trim() !== "") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        Razorpay_Key: "",
      }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        Razorpay_Key: "Please enter a valid Razorpay Key.",
      }));
    }
  };

  const [Razorpay_Secret_Key, setRazorpay_Secret_Key] = useState("");
  const changeRazorpay_Secret_KeyHandler = (event) => {
    const newValue = event.target.value;
    setRazorpay_Secret_Key(newValue);
    if (newValue.trim() !== "") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        Razorpay_Secret_Key: "",
      }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        Razorpay_Secret_Key: "Please enter a valid Razorpay Secret Key.",
      }));
    }
  };
  const Edit = (e) => {
    e.preventDefault();
    setisnotFound(true);

  };

  const save = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("razorpay_key", Razorpay_Key);
    formData.append("razorpay_secret_key", Razorpay_Secret_Key);
    const data = {
      razorpay_key: Razorpay_Key,
      razorpay_secret_key: Razorpay_Secret_Key,
    };
    if(initialsave){

      axios.post(`${baseUrl}/api/Paymentsettings`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })
    .then(response => {
      if (response.status === 200) {
        MySwal.fire({
          title: "Saved !",
          text: "Razorpay Details Saved Sucessfully" ,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
           fetchpaymentsettings();
          }   });
        setisnotFound(false)
      } 
    })
    .catch(error => {
      if(error.response.status===401){
        navigate("/unauthorized")
      }else{
        // MySwal.fire({
        //   icon: 'error',
        //   title: 'Some Error Occurred',
        //   text: error.data
        // });
        throw error
      }
    });
  }else{ 
    if(defaultsettings.id){

    axios.patch(`${baseUrl}/api/update/${defaultsettings.id}`,formData ,{
    headers:{
      "Authorization":token
      }
  })
  .then(response => {
    if (response.status=== 200) {
      MySwal.fire({
        title: "Updated",
        text: "Razorpay Details Update Sucessfully" ,
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          fetchpaymentsettings();
        }   });
      setisnotFound(false)
    }
    
  })
  .catch(error => {
   if(error.response.status===401){
    navigate("/unauthorized")
   } else{
    // MySwal.fire({
    //   icon: 'error',
    //   title: 'Some Error Occurred',
    //   text: error.data
    // });
    throw error
   } 
  });
    
  }}
    
  };


  const getsettings=( 
  <div className="col-12">
  
      <h4>Razorpay Settings</h4>

      <div className="form-group row">
        <label htmlFor="Razorpay_Key" className="col-sm-3 col-form-label">
          Razorpay Key <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="Razorpay_Key"
            placeholder="Razorpay_Key"
            value={Razorpay_Key}
            className={`form-control   ${errors.Razorpay_Key && "is-invalid"}`}
            onChange={changeRazorpay_KeyHandler}
            required
          />
          <div className="invalid-feedback">{errors.Razorpay_Key}</div>
        </div>
      </div>
      <br></br>
      <div className="form-group row">
        <label
          htmlFor="Razorpay_Secret_Key"
          className="col-sm-3 col-form-label"
        >
          Razorpay Secret Key <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
           type="password"
            id="Razorpay_Secret_Key"
            placeholder="Razorpay Secret Key"
            value={Razorpay_Secret_Key}
            className={`form-control   ${
              errors.Razorpay_Secret_Key && "is-invalid"
            }`}
            onChange={changeRazorpay_Secret_KeyHandler}
            required
          />
          <div className="invalid-feedback">{errors.Razorpay_Secret_Key}</div>
        </div>
      </div>

      {valid ? (
        <div className="cornerbtn">
          {defaultsettings.razorpay_key ?<button className="btn btn-secondary" onClick={()=>setisnotFound(false)}>Cancel</button>:<div></div>}
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={
              Object.values(errors).some((error) => error !== "") || // Check for errors
              !Razorpay_Key.trim() || // Check if Razorpay_Key is empty
              !Razorpay_Secret_Key.trim() // Check if Razorpay_Secret_Key is empty
            }
          >
            Save
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );

  const oldSettings = (
    <div className="col-12">
      <h4>Razorpay Settings</h4>
      <div className="form-group row">
        <label htmlFor="Razorpay_Key" className="col-sm-3 col-form-label">
          Razorpay Key{" "}
        </label>
        <div className="col-sm-9">
          <input
            className="form-control"
            readOnly
            value={defaultsettings ? defaultsettings.razorpay_key : ""}
          />
        </div>
      </div>
      <br></br>
      <div className="form-group row">
        <label
          htmlFor="Razorpay_Secret_Key"
          className="col-sm-3 col-form-label"
        >
          Razorpay Secret Key
        </label>
        <div className="col-sm-9">
          <input
           type="password"
            className="form-control"
            readOnly
            value={defaultsettings ? defaultsettings.razorpay_secret_key : ""}
          />
        </div>
      </div>

      {valid ? (
        <div className="btngrp">
          <button className="btn btn-success" onClick={Edit}>
            Edit
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );

  const Skeleton = (
  <div className="col-12 skeleton-wrapper">
    <h4>Razorpay Settings</h4>
    {/* Razorpay Key */}
    <div className="form-group row">
      <label htmlFor="Razorpay_Key" className="col-sm-3 col-form-label">
          Razorpay Key{" "}
        </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>
    <br />

    {/* Razorpay Secret Key */}
    <div className="form-group row">
   <label
          htmlFor="Razorpay_Secret_Key"
          className="col-sm-3 col-form-label"
        >
          Razorpay Secret Key
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

  return (
      <div className="card">
        <div className=" card-body">
          <div className="row">
            { loading ? Skeleton :isnotFound ? getsettings : oldSettings}</div>
        </div>
      </div>
  );
};

export default Razorpay_Settings;
