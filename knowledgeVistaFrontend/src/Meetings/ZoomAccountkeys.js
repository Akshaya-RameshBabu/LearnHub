import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";

const ZoomAccountkeys = () => {
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const [isnotFound, setisnotFound] = useState(false);
  const[loading,setLoading]=useState(false)
  const [initialsave, setinitialsave] = useState(false);
  const [errors, seterrors] = useState({
    client_id: "",
    client_secret: "",
    account_id: "",
  });
  const [oldzoomset, setoldzoomset] = useState({
    id: "",
    client_id: "",
    client_secret: "",
    account_id: "",
  });
  const [defaultZoomset, setdefaultZoomset] = useState({
    id: "",
    client_id: "",
    client_secret: "",
    account_id: "",
  });
  const [valid, setValid] = useState(true);
  const navigate = useNavigate();
  const fetchzoomAccountSettings = async () => {
        try {
          setLoading(true)
          const response = await axios.get(
            `${baseUrl}/zoom/get/Accountdetails`,
            {
              headers: {
                Authorization: token,
              },
            }
          );

          if (response.status === 200) {
            const data = response.data;
            setdefaultZoomset(data);
            setoldzoomset(data);
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
              navigate("/unauthorized");
            } else {
              throw error;
            }
          }
        }finally{
          setLoading(false)
        }
      };
  useEffect(() => {
    if (token) {
      fetchzoomAccountSettings();
    }
  }, []);
  const handleInputsChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    let error = "";
    switch (name) {
      case "client_id":
        error = value.length < 1 ? "Please enter a Valid Client Id" : "";
        break;
      case "client_secret":
        error = value.length < 1 ? "Please enter a Valid  Client_Secret" : "";
        break;
      case "account_id":
        error = value.length < 1 ? "Please enter a Valid  Account Id" : "";
        break;
    }
    seterrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
    setoldzoomset((prevset) => ({
      ...prevset,
      [name]: value,
    }));
  };
  const save = async (e) => {
    e.preventDefault();
    const requiredFields = ["client_id", "client_secret", "account_id"];
    let hasErrors = false;
    requiredFields.forEach((field) => {
      if (
        !oldzoomset[field] ||
        oldzoomset[field].length === 0 ||
        errors[field]
      ) {
        hasErrors = true;
        seterrors((prevErrors) => ({
          ...prevErrors,
          [field]: !oldzoomset[field]
            ? "This field is required"
            : errors[field],
        }));
      }
    });
    if (hasErrors) {
      return;
    }
    if (initialsave) {
      try {
        const response = await axios.post(
          `${baseUrl}/zoom/save/Accountdetails`,
          oldzoomset,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        if (response.status === 200) {
          MySwal.fire({
            title: "Saved !",
            text: "Zoom Details Saved Sucessfully",
            icon: "success",
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
              fetchzoomAccountSettings();
            }
          });
          setisnotFound(false);
        }
      } catch (error) {
        console.log(error);
        // MySwal.fire({
        //   icon: 'error',
        //   title: 'Some Error Occurred',
        //   text: "error occured"
        // });
        throw error;
      }
    } else {
      if (defaultZoomset.id) {
        axios
          .patch(`${baseUrl}/zoom/Edit/Accountdetails`, oldzoomset, {
            headers: {
              Authorization: token,
            },
          })
          .then((response) => {
            if (response.status === 200) {
              MySwal.fire({
                title: "Updated",
                text: "zoom Details Saved Sucessfully",
                icon: "success",
                confirmButtonText: "OK",
              }).then((result) => {
                if (result.isConfirmed) {
                  fetchzoomAccountSettings();
                }
              });
              setisnotFound(false);
            }
          })
          .catch((error) => {
            if (error.response.status === 401) {
              navigate("/unauthorized");
            } else {
              // MySwal.fire({
              //   icon: 'error',
              //   title: 'Some Error Occurred',
              //   text: error.data
              // });
              throw error;
            }
          });
      }
    }
  };

  const Edit = (e) => {
    e.preventDefault();
    setisnotFound(true);
  };
  const oldinputs = (
    <div>
      <div className="form-group row">
        <label htmlFor="clientid" className="col-sm-3 col-form-label">
          Zoom Client Id <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="clientid"
            placeholder="Client Id"
            value={defaultZoomset.client_id}
            readOnly
            className="form-control"
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="clientSecret" className="col-sm-3 col-form-label">
          zoom client Secret <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="clientSecret"
            placeholder="Client Secet"
            className="form-control"
            readOnly
            value={defaultZoomset.client_secret}
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="accountid" className="col-sm-3 col-form-label">
          Account Id<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="accountid"
            value={defaultZoomset.account_id}
            placeholder="Account Id"
            className="form-control"
            readOnly
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


  const EditInputs = (
    <div>
      <div className="form-group row">
        <label htmlFor="clientid" className="col-sm-3 col-form-label">
          Zoom Client Id <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="clientid"
            name="client_id"
            placeholder="Client Id"
            value={oldzoomset.client_id}
            className={`form-control   ${errors.client_id && "is-invalid"}`}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.client_id}</div>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="clientSecret" className="col-sm-3 col-form-label">
          zoom client Secret <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            name="client_secret"
            id="clientSecret"
            placeholder="Client Secet"
            value={oldzoomset.client_secret}
            className={`form-control   ${errors.client_secret && "is-invalid"}`}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.client_secret}</div>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="accountid" className="col-sm-3 col-form-label">
          Account Id<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="accountid"
            name="account_id"
            placeholder="Account Id"
            className={`form-control   ${errors.account_id && "is-invalid"}`}
            value={oldzoomset.account_id}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.account_id}</div>
        </div>
      </div>

      {valid ? (
        <div className="btngrp">
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );

  const Skeleton = (
  <div className="skeleton-wrapper">
    <div className="form-group row">
      <label htmlFor="clientid" className="col-sm-3 col-form-label">
        Zoom Client Id <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="clientSecret" className="col-sm-3 col-form-label">
        zoom client Secret <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="accountid" className="col-sm-3 col-form-label">
        Account Id <span className="text-danger">*</span>
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
      <div className="page-header">  <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">Settings </h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{ navigate("/admin/dashboard")}} title="dashboard"><i className="feather icon-home"></i></a></li>
                            <li className="breadcrumb-item"><a href="#">Zoom Credentials </a></li>
                        </ul>
                        
                    </div>
                </div>
            </div></div>
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

              <h4>Zoom Meet Settings</h4>
              {loading? Skeleton :isnotFound ? EditInputs : oldinputs}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomAccountkeys;
