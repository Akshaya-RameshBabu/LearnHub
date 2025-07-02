import React, { useContext, useEffect, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome CSS
import profile from "../images/profile.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import { GlobalStateContext } from "../Context/GlobalStateProvider";
import { useNavigate } from "react-router-dom";

const AddTrainer = () => {
  const navigate=useNavigate();
  const token = sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { displayname } = useContext(GlobalStateContext);
  const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    psw: "",
    email: "",
    dob: "",
    phone: "",
    skills: "",
    profile: null,
    countryCode: "+91",
    isActive: true,
  });
  const [defaultCountry, setDefaultCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const fetchUserCountryCode = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      const dialingCode = data.country_calling_code || "+1";

      setFormData((prevState) => ({
        ...prevState,
        countryCode: dialingCode,
      }));
      const countryCode = data.country_code.toUpperCase(); // Get the country code (e.g., "IN" for India, "US" for USA)
      setDefaultCountry(countryCode);
    } catch (error) {
      console.error("Error fetching country code: ", error);
    }
  };

  useEffect(() => {
    fetchUserCountryCode(); // Fetch user's country code on component mount
  }, []);

  const handlePhoneChange = (value) => {
    if (typeof value !== "string") {
      return;
    }

    setPhoneNumber(value);
    const phoneNumber = parsePhoneNumber(value);
    if (phoneNumber) {
      // Extract phone number without country code
      const phoneNumberWithoutCountryCode = phoneNumber.nationalNumber;

      setFormData((prevState) => ({
        ...prevState,
        phone: phoneNumberWithoutCountryCode,
      }));
    }
    // Validate phone number
    if (value && isValidPhoneNumber(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phone: "",
      }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phone: "Enter a valid Phone number",
      }));
    }
  };
  const fetchCountryDialingCode = async (newCountryCode) => {
    try {
      if (!newCountryCode) {
        return;
      }

      // Fetch country data based on the new country code (e.g., "IN", "US")
      const response = await fetch(
        `https://restcountries.com/v3.1/alpha/${newCountryCode}`
      );
      const data = await response.json();

      // Extract the dialing code from the 'idd' object in the response
      const dialingCode =
        data[0]?.idd?.root + (data[0]?.idd?.suffixes?.[0] || "") || "+91";

      // Set the country dialing code in the formData
      setFormData((prevState) => ({
        ...prevState,
        countryCode: dialingCode,
      }));

      // const countryCode = data.country_code.toUpperCase(); // Get the country code (e.g., "IN" for India, "US" for USA)
      setDefaultCountry(newCountryCode);
    } catch (error) {
      console.error("Error fetching country dialing code: ", error);
    }
  };
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    dob: "",
    psw: "",
    skills: "",
    confirm_password: "",
    phone: "",
    fileInput: "",
    profile: "",
    otp:""
  });

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const dobRef = useRef(null);
  const pswRef = useRef(null);
  const confirmPswRef = useRef(null);
  const skillsRef = useRef(null);
  const phoneRef = useRef(null);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = "";

    switch (name) {
      case "username":
        error = value.length < 1 ? "Please enter a valid user Name" : "";
        break;
      case "email":
        // This is a basic email validation, you can add more advanced validation if needed
        error = /^[^\s@]+@[^\s@]+\.com$/.test(value)
          ? ""
          : "Please enter a valid email address";
        break;
      case "dob":
        const dobDate = new Date(value);
        const today = new Date();
        const maxDate = new Date(
          today.getFullYear() - 8,
          today.getMonth(),
          today.getDate()
        ); // Min age 8 years
        const minDate = new Date(
          today.getFullYear() - 100,
          today.getMonth(),
          today.getDate()
        ); // Max age 100 years
        error =
          dobDate <= maxDate && dobDate >= minDate
            ? ""
            : "Please enter a valid date of birth";
        break;
        case "psw":
          const passwordRegex =
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          if (!passwordRegex.test(value)) {
            error =
              "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one digit, and one special character.";
          } else if (formData.confirm_password && formData.confirm_password !== value) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              confirm_password: "Confirm password does not match the password.",
            }));
          }
          break;
    
        case "confirm_password":
          if (value !== formData.psw) {
            error = "Passwords do not match.";
          }
          break;
    
      case "phone":
        error =
          value.length < 10
            ? "Phone number must be at least 10 digits"
            : value.length > 15
            ? "Phone number cannot be longer than 15 digits"
            : /^\d+$/.test(value)
            ? ""
            : "Please enter a valid phone number (digits only)";

        break;
      case "countryCode":
        error = value.startsWith("+")
          ? value.length > 5
            ? "Enter a valid country code (max 5 digits)"
            : ""
          : "Country code must start with +";
      default:
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 50 * 1024) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        profile: "Image size must be 50 KB or smaller",
      }));
      return;
    }
    setErrors((prevErrors) => ({
      ...prevErrors,
      profile: "",
    }));
    // Convert the file to base64
    convertImageToBase64(file)
      .then((base64Data) => {
        // Set the base64 encoded image and the file in the state
        setFormData((prevFormData) => ({
          ...prevFormData,
          profile: file,
          base64Image: base64Data,
        }));
        setErrors((prevErrors) => ({
          ...prevErrors,
          profile: "",
        }));
      })
      .catch((error) => {
        console.error("Error converting image to base64:", error);
      });
  };

  const scrollToError = () => {
    if (errors.username) {
      nameRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.email) {
      emailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.dob) {
      dobRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.psw || errors.confirm_password) {
      pswRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.skills) {
      skillsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    } else if (errors.phone) {
      phoneRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  };

  useEffect(() => {
    scrollToError();
  }, [errors]);
const handleSendOTP = async () => {
    if (!formData.email || errors.email) {
      setErrors(prev => ({
        ...prev,
        email: !formData.email ? "Email is required" : errors.email
      }));
      emailRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSendingOtp(true);
    try {
      // Clear OTP input and errors when resending
      setOtp("");
      setErrors(prev => ({ ...prev, otp: "" }));
      setOtpVerified(false);
      setOtpSent(true);
      
      const response = await axios.post(
        `${baseUrl}/auth/send-otp`,
        null,
        { 
          params: { 
            email: formData.email
          } 
        }
      );

      if (response.status === 200) {
        MySwal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "Please check your email for the OTP.",
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        if (error.response.data === "EMAIL") {
          setErrors(prev => ({
            ...prev,
            email: "This email is already registered"
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          email: "Failed to send OTP. Please try again."
        }));
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setErrors(prev => ({
        ...prev,
        otp: "OTP is required"
      }));
      return;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/auth/verify-otp`,
        null,
        { params: { email: formData.email, otp } }
      );

      if (response.status === 200) {
        setOtpVerified(true);
        setErrors(prev => ({
          ...prev,
          otp: ""
        }));
           MySwal.fire({
                toast:true,
          position: 'top-end', 
          icon: 'success',
          title: 'Email verified successfully!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        otp: "Invalid or expired OTP"
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
     if (!otpVerified) {
         MySwal.fire({
              toast:true,
        position: 'top-end', 
        icon: 'warning',
        title: 'Please Verify Your Email First!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      emailRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    let hasErrors = false;
    const requiredFields = [
      "email",
      "psw",
      "confirm_password",
      "phone",
      "countryCode",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].length === 0 || errors[field]) {
        hasErrors = true;
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: !formData[field] ? "This field is required" : errors[field],
        }));
      }
    });

    if (hasErrors) {
      scrollToError(); // Scroll to the first error field
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("psw", formData.psw);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("dob", formData.dob);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("isActive", formData.isActive);
    formDataToSend.append("profile", formData.profile);
    formDataToSend.append("skills", formData.skills);
    formDataToSend.append("countryCode", formData.countryCode);
     formDataToSend.append("otp", otp);
    try {
      const response = await axios.post(
        `${baseUrl}/admin/addTrainer`,
        formDataToSend,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const data = response.data;
      if (response.status === 200) {
        MySwal.fire({
          title: "Added !",
          text: `New  ${
            displayname && displayname.trainer_name
              ? displayname.trainer_name
              : "Trainer"
          }
         Added successfully!`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
              navigate("/view/Trainer");
          }
        });
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data === "EMAIL") {
            setErrors((prevErrors) => ({
              ...prevErrors,
              email: "This email is already registered.",
            }));
          }
        } else if (error.response.status === 401) {
          MySwal.fire({
            title: "Un Authorized!",
            text: `you are unable to add the ${displayname && displayname.trainer_name
                    ? displayname.trainer_name
                    : "Trainer"} `,
            icon: "error",
            confirmButtonText: "OK",
          });
        } else if (error.response.status === 500) {
          MySwal.fire({
            title: "Server Error!",
            text: "Unexpected Error Occured",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } else {
        // MySwal.fire({
        //   title: "Error!",
        //   text: `An error occurred while Adding  ${
        //     displayname && displayname.trainer_name
        //       ? displayname.trainer_name
        //       : "Trainer"
        //   }
        // . Please try again later.`,
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error
      }
    }
  };

  return (
    <div>
      <div className="page-header"></div>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-12">
            <div className='navigateheaders'>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
              <div className="innerFrame">
                <h4>
                  Add{" "}
                  {displayname && displayname.trainer_name
                    ? displayname.trainer_name
                    : "Trainer"}
                </h4>
                <div className="mainform">
                  <div className="profile-picture">
                    <div className="image-group">
                      {formData.base64Image ? (
                        <img
                          src={formData.base64Image}
                          alt="Selected Image"
                          className="profile-picture"
                        />
                      ) : (
                        <img
                          src={profile}
                          alt="Default Profile Picture"
                          className="prof"
                        />
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <label htmlFor="fileInput" className="file-upload-btn">
                        Upload
                      </label>
                      <div className="text-danger">{errors.profile}</div>
                      <input
                        type="file"
                        name="fileInput"
                        style={{ display: "none" }}
                        id="fileInput"
                        className={`file-upload ${
                          errors.fileInput && "is-invalid"
                        }`}
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="form-group row" ref={nameRef}>
                      <label htmlFor="Name" className="col-sm-3 col-form-label">
                        {" "}
                        Name{" "}
                      </label>
                      <div className="col-sm-9">
                        {" "}
                        <input
                          type="text"
                          id="Name"
                          value={formData.username}
                          onChange={handleChange}
                          name="username"
                          className={`form-control   mt-1 ${
                            errors.username && "is-invalid"
                          }`}
                          placeholder="Full Name"
                          autoFocus
                          required
                        />
                        <div className="invalid-feedback">
                          {errors.username}
                        </div>
                      </div>
                    </div>
                 <div className="form-group row" ref={emailRef}>
                      <label htmlFor="email" className="col-sm-3 col-form-label">
                        Email<span className="text-danger">*</span>
                      </label>
                      <div className="col-sm-9">
                        <div className="d-flex">
                          <input
                            type="email"
                            autoComplete="off"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            required
                            disabled={otpVerified}
                          />
                          <button
                            type="button"
                            className="btn btn-primary ms-2 col-sm-3"
                            onClick={handleSendOTP}
                            disabled={!formData.email || errors.email || otpVerified || isSendingOtp}
                          >
                            {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                          </button>
                        </div>
                        {errors.email && <div className="text-danger mt-1">{errors.email}</div>}
                      </div>
                    </div>

                    {otpSent && !otpVerified && (
                      <div className="form-group row">
                        <label htmlFor="otp" className="col-sm-3 col-form-label">
                          OTP<span className="text-danger">*</span>
                        </label>
                        <div className="col-sm-9">
                          <div className="d-flex">
                            <input
                              type="text"
                              className={`form-control ${errors.otp ? "is-invalid" : ""}`}
                              name="otp"
                              value={otp}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(value);
                                if (errors.otp) {
                                  setErrors(prev => ({ ...prev, otp: "" }));
                                }
                              }}
                              placeholder="Enter 6-digit OTP"
                              maxLength="6"
                              required
                            />
                            <button
                              type="button"
                              className="btn btn-primary ms-2 col-sm-3"
                              onClick={handleVerifyOTP}
                              disabled={otp.length !== 6}
                            >
                              Verify OTP
                            </button>
                          </div>
                          {errors.otp && <div className="text-danger mt-1">{errors.otp}</div>}
                          {otpSent && !errors.otp && (
                            <small className="text-muted">
                              Please enter the 6-digit OTP sent to your email
                            </small>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="form-group row">
                      <label
                        htmlFor="Password"
                        className="col-sm-3 col-form-label"
                      >
                        Password
                        <span className="text-danger" ref={pswRef}>
                          *
                        </span>
                      </label>
                      <div className="col-sm-9">
                        <div
                          className={`inputpsw form-control   p-1  ${
                            errors.psw && "is-invalid"
                          }`}
                        >
                          <input
                            type={showPassword ? "text" : "password"}
                            name="psw"
                            style={{ outline: "none" }}
                            value={formData.psw}
                            onChange={handleChange}
                            placeholder="Password"
                            id="pswinp"
                            autoComplete="new-password"
                            required
                          />
                          <i
                            className={
                              showPassword ? "fa fa-eye-slash  " : "fa fa-eye "
                            }
                            style={{ display: "flex", alignItems: "center" }}
                            onClick={togglePasswordVisibility}
                          ></i>
                        </div>
                        <div className="invalid-feedback">{errors.psw}</div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        htmlFor="confirm_password"
                        className="col-sm-3 col-form-label"
                      >
                        Re-type password
                        <span className="text-danger" ref={confirmPswRef}>
                          *
                        </span>
                      </label>
                      <div className="col-sm-9">
                        <div
                          className={`inputpsw form-control   p-1 ${
                            errors.confirm_password && "is-invalid"
                          }`}
                        >
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            value={formData.confirm_password}
                            style={{ outline: "none" }}
                            id="pswinp"
                            onChange={handleChange}
                            autoComplete="new-password"
                            placeholder="Repeat Password"
                            required
                          />
                          <i
                            className={
                              showConfirmPassword
                                ? "fa fa-eye-slash"
                                : "fa fa-eye"
                            }
                            style={{ display: "flex", alignItems: "center" }}
                            onClick={toggleConfirmPasswordVisibility}
                          ></i>
                        </div>
                        <div className="invalid-feedback">
                          {errors.confirm_password}
                        </div>
                      </div>
                    </div>
                    <div className="form-group row " ref={phoneRef}>
                      <label
                        htmlFor="Phone"
                        className="col-sm-3 col-form-label"
                      >
                        {" "}
                        Phone
                        <span className="text-danger">*</span>
                      </label>
                      <div className="col-sm-9">
                        <div className="inputlikeeffect">
                          <PhoneInput
                            placeholder="Enter phone number"
                            id="phone"
                            value={phoneNumber || ""}
                            onChange={handlePhoneChange}
                            className={`form-control   ${
                              errors.phone && "is-invalid"
                            }`}
                            defaultCountry={defaultCountry}
                            international
                            countryCallingCodeEditable={true}
                            onCountryChange={fetchCountryDialingCode}
                          />

                          <div className="invalid-feedback">{errors.phone}</div>
                        </div>
                      </div>
                    </div>
                    <div className="form-group row">
                      <label
                        htmlFor="dob"
                        className="col-sm-3 col-form-label"
                        ref={dobRef}
                      >
                        Date of Birth
                      </label>
                      <div className="col-sm-9">
                        <input
                          type="date"
                          name="dob"
                          className={`form-control   ${
                            errors.dob && "is-invalid"
                          }`}
                          placeholder="Starting year"
                          value={formData.dob}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.dob}</div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <label
                        htmlFor="skills"
                        className="col-sm-3 col-form-label"
                        ref={skillsRef}
                      >
                        {" "}
                        Skills{" "}
                      </label>
                      <div className="col-sm-9">
                        {" "}
                        <input
                          type="text"
                          id="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          name="skills"
                          className={`form-control   mt-1 ${
                            errors.skills && "is-invalid"
                          }`}
                          placeholder="skills"
                          required
                        />
                        <div className="invalid-feedback">{errors.skills}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="btngrp">
                  <button className={`btn btn-primary `} onClick={handleSubmit}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrainer;