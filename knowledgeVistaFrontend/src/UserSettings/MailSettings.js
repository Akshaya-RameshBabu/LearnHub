import React, { useEffect, useState } from "react";
import { resolvePath, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";

const MailSettings = () => {
  const navigate = useNavigate();
  const [initialsave, setinitialsave] = useState(false);
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const[loading,setLoading]=useState(false)
  const [isnotFound, setisnotFound] = useState(false);
  const [settings, setsettings] = useState({
    hostname: "",
    port: "587",
    emailid: "",
    password: "",
  });
  const [defaultsettings, setdefaultsettings] = useState({
    hostname: "",
    port: "",
    emailid: "",
    password: "",
  });
  const [errors, seterrors] = useState({
    hostname: "",
    emailid: "",
    password: "",
  });
    const fetchMailAccountSettings = async () => {
        try {
          setLoading(true)
          const response = await axios.get(`${baseUrl}/get/mailkeys`, {
            headers: {
              Authorization: token,
            },
          });

          if (response.status === 200) {
            const data = response.data;

            setdefaultsettings(data);
            setsettings(data);
          } else if (response.status === 204) {
            setisnotFound(true);
            setinitialsave(true);
          }
        } catch (error) {
          if (error.response) {
            if (error.response.status === 401) {
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
      fetchMailAccountSettings();
    }
  }, []);
  const save = async (e) => {
    e.preventDefault();
    if (initialsave) {
      try {
        const response = await axios.post(
          `${baseUrl}/save/mailkeys`,
          settings,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        if (response.status === 200) {
          MySwal.fire({
            title: "Saved !",
            text: "Email Details Saved Sucessfully",
            icon: "success",
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
               fetchMailAccountSettings();
            }
          });
          setisnotFound(false);
        }
      } catch (error) {
        console.log(error);
        // MySwal.fire({
        //   icon: "error",
        //   title: "Some Error Occurred",
        //   text: "error occured",
        // });
        throw error;
      }
    } else {
      if (defaultsettings.id) {
        axios
          .patch(`${baseUrl}/Edit/mailkeys`, settings, {
            headers: {
              Authorization: token,
            },
          })
          .then((response) => {
            if (response.status === 200) {
              MySwal.fire({
                title: "Updated",
                text: "Email Details Saved Sucessfully",
                icon: "success",
                confirmButtonText: "OK",
              }).then((result) => {
                if (result.isConfirmed) {
                  fetchMailAccountSettings();
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
              //   icon: "error",
              //   title: "Some Error Occurred",
              //   text: error.data,
              // });
              throw error;
            }
          });
      }
    }
  };

  const handleInputsChange = (e) => {
    const { name, value } = e.target;
    setsettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const Edit = (e) => {
    e.preventDefault();
    setisnotFound(true);
  };

  const getinputs = (
    <div>
      <div className="form-group row">
        <label htmlFor="hostname" className="col-sm-3 col-form-label">
          Mail Host Name<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="hostname"
            name="hostname"
            placeholder="Email Host Name"
            value={settings.hostname}
            className={`form-control   ${errors.hostname && "is-invalid"}`}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.hostname}</div>
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="port" className="col-sm-3 col-form-label">
          Mail port Name<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="port"
            name="port"
            placeholder="Email port Name"
            value={settings.port}
            className={`form-control   ${errors.port && "is-invalid"}`}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.port}</div>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="emailid" className="col-sm-3 col-form-label">
          Email Id <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            name="emailid"
            id="emailid"
            placeholder="Email Id"
            value={settings.emailid}
            className={`form-control   ${errors.emailid && "is-invalid"}`}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.emailid}</div>
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="password" className="col-sm-3 col-form-label">
          Password<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="password"
            name="password"
            placeholder="password "
            className={`form-control   ${errors.password && "is-invalid"}`}
            value={settings.password}
            onChange={handleInputsChange}
          />
          <div className="invalid-feedback">{errors.password}</div>
        </div>

        <div className="btngrp">
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
  const Skeleton = (
  <div>
    <div className="form-group row">
      <label htmlFor="hostname" className="col-sm-3 col-form-label">
        Mail Host Name <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="port" className="col-sm-3 col-form-label">
        Mail port Name <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="emailid" className="col-sm-3 col-form-label">
        Email Id <span className="text-danger">*</span>
      </label>
      <div className="col-sm-9">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="password" className="col-sm-3 col-form-label">
        Password <span className="text-danger">*</span>
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

  const defaultinputs = (
    <div>
      <div className="form-group row">
        <label
          htmlFor="hostname"
          className="col-sm-3 col-form-label
           "
        >
          Mail Host Name <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="hostname"
            placeholder="Host Name"
            value={defaultsettings.hostname}
            readOnly
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="port" className="col-sm-3 col-form-label">
          Mail port Name <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="port"
            placeholder="port Name"
            value={defaultsettings.port}
            readOnly
            className="form-control"
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="emailid" className="col-sm-3 col-form-label">
          Email Id <span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="emailid"
            placeholder="Email Id"
            className="form-control"
            readOnly
            value={defaultsettings.emailid}
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="password" className="col-sm-3 col-form-label">
          Password<span className="text-danger">*</span>
        </label>
        <div className="col-sm-9">
          <input
            id="password"
            placeholder="password "
            value={defaultsettings.password}
            className="form-control"
            readOnly
          />
        </div>
      </div>

      <div className="btngrp">
        <button className="btn btn-success" onClick={Edit}>
          Edit
        </button>
      </div>
    </div>
  );
  return (
    <div>
      <div className="page-header">
        {" "}
        <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Settings </h5>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a
                    href="#"
                    onClick={() => {
                      navigate("/admin/dashboard");
                    }}
                    title="dashboard"
                  >
                    <i className="feather icon-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Mail Credentials </a>
                </li>
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
              <h4>Mail Settings</h4>
              {loading? Skeleton: isnotFound ? getinputs : defaultinputs}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailSettings;
