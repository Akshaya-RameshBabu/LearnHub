import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import login from "../images/login.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";
import logo from "../images/logo.png";
import GoogleLoginComponent from "../Registration/GoogleLoginComponent";
import { GlobalStateContext } from "../Context/GlobalStateProvider";
const Login = () => {
  const { siteSettings } = useContext(GlobalStateContext);
  const MySwal = withReactContent(Swal);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate(); // useNavigate hook for navigation
  const[showSocialLogin,setshowSocialLogin]=useState()
  const [client_id,setclient_id]=useState(null);
  const [activeProfile, setActiveProfile] = useState(
    sessionStorage.getItem("Activeprofile")
  );

  useEffect(() => {
    const getActiveProfile = async () => {
      try {
        const active = await axios.get(`${baseUrl}/Active/Environment`);
        if (active?.data?.environment) {
          sessionStorage.setItem("Activeprofile", active.data.environment);
          setActiveProfile(active.data.environment);
        } 
        if (active?.data?.currency) {
          sessionStorage.setItem("Currency", active.data.currency);
        } 
  
        // If the active profile is 'VPS', proceed with the next requests
        if (active.data === "VPS") {
          fetchShowInLandingPage();
        }
      } catch (error) {
        console.log(error);
        throw error
      }
    };
  
    const fetchShowInLandingPage = async () => {
      try {
        const response = await axios.get(`${baseUrl}/settings/ShowSocialLogin`);
        setshowSocialLogin(response.data);
  
        // If showSocialLogin is true, proceed to get the client ID
        if (response.data === true) {
          getClientId();
        }
      } catch (error) {
        console.error(error);
        throw error
      }
    };
  
    const getClientId = async () => {
      try {
        const client = await axios.get(`${baseUrl}/getgoogleclient`, {
          params: { Provider: "GOOGLE" },
        });
        setclient_id(client.data);
      } catch (error) {
        console.log(error);
        throw error
      }
    };
  
    // First fetch the active profile
    getActiveProfile();
  }, []);
  
  const handleRegistration = async () => {
    try {
      if (activeProfile === "VPS") {
        const count = await axios.get(`${baseUrl}/count/admin`);
        let htmlContent;

        // Determine which buttons to display based on the admin count
        if (count.data > 0) {
          htmlContent = `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <button id="trainer-btn" class="swal2-confirm swal2-styled" style="margin-bottom: 10px; width: 100%;">Register as Trainer</button>
              <button id="student-btn" class="swal2-confirm swal2-styled" style="width: 100%;">Register as Student</button>
            </div>
          `;
        } else {
          htmlContent = `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <button id="admin-btn" class="swal2-confirm swal2-styled" style="margin-bottom: 10px; width: 100%;">Register as Admin</button>
              <button id="trainer-btn" class="swal2-confirm swal2-styled" style="margin-bottom: 10px; width: 100%;">Register as Trainer</button>
              <button id="student-btn" class="swal2-confirm swal2-styled" style="width: 100%;">Register as Student</button>
            </div>
          `;
        }

        // Show the SweetAlert with the dynamically created HTML
        MySwal.fire({
          title: "Select your Role",
          html: htmlContent,
          showCancelButton: true,
          showConfirmButton: false, // Disable default confirm button, we will use custom buttons
          cancelButtonText: "Cancel",
          didOpen: () => {
            // Check if the admin button exists before adding event listeners
            const adminBtn = document.getElementById("admin-btn");
            const trainerBtn = document.getElementById("trainer-btn");
            const studentBtn = document.getElementById("student-btn");

            if (adminBtn) {
              adminBtn.addEventListener("click", () => {
                navigate("/adminRegistration");
                MySwal.close();
              });
            }

            if (trainerBtn) {
              trainerBtn.addEventListener("click", () => {
                navigate("/trainerRegistration");
                MySwal.close();
              });
            }

            if (studentBtn) {
              studentBtn.addEventListener("click", () => {
                navigate("/studentRegistration");
                MySwal.close();
              });
            }
          },
        });
      } else if (activeProfile === "SAS") {
        window.location.href = "/RegisterInstitute";
      }
    } catch (error) {
      // MySwal.fire({
      //   icon: "error",
      //   title: "Some Error Occurred",
      //   text: error.message,
      // });
      throw error
    }
  };

  const [errors, setErrors] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = "";
    switch (name) {
      case "username":
        error = /^[^\s@]+@[^\s@]+\.com$/.test(value)
          ? ""
          : "Please enter a valid email address";
        break;
      case "password":
        error =
          value.length < 6 ? "Password must be at least 6 characters long" : "";
        break;
      default:
        break;
    }
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.password === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Please Enter The Password",
        }));
      }
      if (formData.username === "") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          username: "Please Enter The Email",
        }));
      }
      if (
        Object.values(errors).some((error) => error) ||
        !formData.username ||
        !formData.password
      ) {
        return;
      }

      const response = await axios.post(`${baseUrl}/login`, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
          sessionStorage.clear();
        const data = response.data;
        const jwtToken = data.token;
        const role = data.role;
        const userId = data.userid;
        const email = data.email;
        sessionStorage.setItem("token", jwtToken);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("userid", userId);
        sessionStorage.setItem("email", email);

        if (role === "SYSADMIN") {
          window.location.href = "/viewAll/Admins";
        } else {
          window.location.href = "/dashboard/course";
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          username: "User not found",
        }));
      } else if (error.response && error.response.status === 401) {
        const data = error.response.data
          ? error.response.data
          : "error occured";
        const message = data?.message;
        if (message === "Incorrect password") {
          setErrors((prevErrors) => ({
            ...prevErrors,
            password: `Incorrect password. ${data?.attemptsLeft} attempts left before account lockout.`,
          }));
        } else if (message === "In Active") {
          MySwal.fire({
            title: "In Active User!",
            text: `reason : ${data?.Description}`,
            icon: "error",
          });
        }else if(message ==="Not Approved"){
          MySwal.fire({
            title: `${data?.message}`,
            text: `${data?.Description}`,
            icon: "error",
          });
        }
      } else {
        // MySwal.fire({
        //   title: "Error Occured!",
        //   text: "An error occurred while logging in. Please try again later.",
        //   icon: "error",
        // });
        throw error
      }
    }
  };

  return (
    <div className="login-container ">
      <div className="image-section ">
        <img
          id="boyimage"
          src={login}
          alt="boy-pic"
        />
      </div>
      <div className="card-center">
<div className="card card-login" >
      <div className=" card-header  text-center">
      <img 
      width={200} 
      height={200}
  src={siteSettings.siteicon 
    ? `data:image/jpeg;base64,${siteSettings.siteicon}` 
    : logo} 
  alt="siteicon" 
/>

        <div className="card-body">
        <h3 className="h4 text-gray-900 mb-3">Sign in</h3>

        <div className="row mb-3">
          <input
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            className={`form-control   ${
              errors.username && "is-invalid"
            }`}
            placeholder="Email"
            autoComplete="username"
            autoFocus
            required
          />
          <div className="invalid-feedback">{errors.username}</div>
        </div>

        <div className="row mb-3">
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-control   ${
              errors.password && "is-invalid"
            }`}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <div className="invalid-feedback">{errors.password}</div>
        </div>

        <div className="mb-2">
          <Link
            className="user text-decoration-none mr-3"
            to="/forgot-password"
          >
            Forgot Password?
          </Link>
          <Link
            className="user text-decoration-none ml-3"
            onClick={handleRegistration} // Trigger the modal on click
            to="#"
          >
            New user?
          </Link>
        </div>

        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={handleSubmit}
        >
          Login
        </button>
        <Link className="btn btn-secondary btn-lg btn-block" to="/">
          Cancel
        </Link>

        <hr className="my-2 mt-2" />
        {activeProfile === "VPS" && showSocialLogin &&(
         
          <div>
             {client_id !==null &&(
            <GoogleLoginComponent clientId={client_id}/>
          )}
          </div>
        
        )}
        </div>
      </div>
    </div>
    
</div>
    </div>
  );
};

export default Login;
