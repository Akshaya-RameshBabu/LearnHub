import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import baseUrl from "../api/utils";
import { GlobalStateContext } from "../Context/GlobalStateProvider";

const Sitesettings = () => {
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const[loading,setLoading]=useState(false)
  const [isnotFound, setisnotFound] = useState(false);
  const navigate = useNavigate();
  const [siteSettings, setsiteSettings] = useState({
    siteUrl: "",
    title:"",
    sitelogo: null,
    siteicon: null,
    titleicon: null,
  });
  const[baseimage,setbaseimage]=useState({
    sitelogo: null,
    siteicon: null,
    titleicon: null,
  })
  const [defaultsiteSettings, setdefaultsiteSettings] = useState({
    siteUrl: "",
    title:"",
    sitelogo: null,
    siteicon: null,
    titleicon: null,
  });
  const [error, seterrors] = useState({
    siteUrl: "",
    title:"",
    sitelogo: "",
    siteicon: "",
    titleicon: "",
  });
  // const { Activeprofile} = useContext(GlobalStateContext);
  const { Activeprofile} = useContext(GlobalStateContext);
   const getLabelings=async()=>{
      try{
        setLoading(true)
      const response=await axios.get(`${baseUrl}/Get/labellings`,{
        headers:{
          Authorization:token
        }
      })
      if(response.status===200){
        setdefaultsiteSettings(response.data)
        setsiteSettings(response.data)
        setbaseimage({
          sitelogo: response.data?.sitelogo ? `data:image/jpeg;base64,${response.data.sitelogo}` : null,
          siteicon: response.data?.siteicon ? `data:image/jpeg;base64,${response.data.siteicon}` : null,
          titleicon: response.data?.titleicon ? `data:image/jpeg;base64,${response.data.titleicon}` : null,
        });
        
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
     getLabelings();
  },[])
  const Edit = (e) => {
    e.preventDefault();
    setisnotFound(true);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const name=e.target.name;
  setsiteSettings((prev)=>({
    ...prev,
    [name]: value
  }))
switch(name){
  case "siteUrl":
     // Validate URL using a regex
     const urlPattern = new RegExp(
      "^(https?:\\/\\/)?" + // Optional scheme (http or https)
        "((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*\\.)+[a-zA-Z]{2,})" + // Domain name
        "|localhost" + // Allow localhost
        "|(\\d{1,3}\\.){3}\\d{1,3})" + // IP address
        "(\\:\\d+)?(\\/[-a-zA-Z\\d%@_.~+&:]*)*" + // Port and path
        "(\\?[;&a-zA-Z\\d%@_.,~+&:=-]*)?" + // Query string
        "(\\#[-a-zA-Z\\d_]*)?$", // Fragment locator
      "i"
    );

    if (!urlPattern.test(value)) {
      seterrors((prev)=>({
        ...prev,
        siteUrl:"Please enter a valid URL."
      }));// Set error message
    } else {
      seterrors((prev)=>({
        ...prev,
        siteUrl:""
      }));
    }
    break;
    
}
   
  };
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof Blob)) {
        reject(new Error("Invalid file or file type is not supported"));
        return;
      }
  
      const reader = new FileReader();
  
      // Resolve with the base64 data once read is complete
      reader.onload = () => {
        resolve(reader.result);
      };
  
      // Reject with an error if something goes wrong
      reader.onerror = (error) => {
        reject(error);
      };
  
      // Read the file as a data URL
      reader.readAsDataURL(file);
    });
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name; // Correctly fetch `name` from input
  
    // Define allowed image types for different inputs
    let allowedImageTypes = [];
  
    switch (name) {
      case "siteicon":
        allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        break;
      case "sitelogo":
        allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        break;
      case "titleicon":
        allowedImageTypes = ["image/x-icon"]; // Correct MIME type for .ico
        break;
      default:
        seterrors((prevErrors) => ({
          ...prevErrors,
          [name]: "Unknown input field",
        }));
        return;
    }
  
    // Check file type (MIME type)
    if (file && !allowedImageTypes.includes(file.type)) {
      seterrors((prevErrors) => ({
        ...prevErrors,
        [name]: `Please select a file of type ${allowedImageTypes.join(", ")}`,
      }));
      return;
    }
  
    // Check file size (should be 50 KB or less)
    if (file && file.size > 100 * 1024) {
      seterrors((prevErrors) => ({
        ...prevErrors,
        [name]: "File size must be 50 KB or smaller",
      }));
      return;
    }
  
    // Update `siteSettings` with the selected file
    setsiteSettings((prev) => ({
      ...prev,
      [name]: file,
    }));
  
    // Convert file to base64
    convertImageToBase64(file)
      .then((base64Data) => {
        // Store base64 image
        setbaseimage((prev) => ({
          ...prev,
          [name]: base64Data,
        }));
  
        // Clear errors
        seterrors((prevErrors) => ({
          ...prevErrors,
          [name]: "",
        }));
      })
      .catch((error) => {
        console.error("Error converting image to base64:", error);
        seterrors((prevErrors) => ({
          ...prevErrors,
          [name]: "Error converting image to base64",
        }));
      });
  };
  
  const handleSave = async(e)=>{
    try{
      e.preventDefault();
      const formData = new FormData();
      formData.append("siteUrl", siteSettings.siteUrl);
      formData.append("title", siteSettings.title);
      formData.append("sitelogo", siteSettings.sitelogo);
      formData.append("siteicon", siteSettings.siteicon);
      formData.append("titleicon", siteSettings.titleicon);
      
      const response=await axios.post(`${baseUrl}/save/labellings`,formData,{
        headers: {
          Authorization: token,
        },
      });
      if(response.status===200){
        MySwal.fire({
          title: `${response.data}`,
          text: ` Site settings  ${response.data} Successfully`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
         getLabelings();
          }   });
        setisnotFound(false)
      } 
      
    }catch(error){
      console.log(error)
    }
  }
  const Skeleton = (
  <div>
    <h4>Site Settings</h4>

    <div className="form-group row">
      <label htmlFor="siteurl" className="col-sm-3 col-form-label">
        Site Url
      </label>
      <div className="col-sm-6">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="title" className="col-sm-3 col-form-label">
        Tab title
      </label>
      <div className="col-sm-6">
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="courseImage" className="col-sm-3 col-form-label">
        Site Logo
      </label>
      <div className="col-sm-6">
        <div className="skeleton skeleton-input"></div>
      </div>
      <div className="col-sm-3">
        <div className="skeleton" style={{ width: "150px", height: "50px" }}></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="courseImage" className="col-sm-3 col-form-label">
        Site Icon
      </label>
      <div className="col-sm-6">
        <div className="skeleton skeleton-input"></div>
      </div>
      <div className="col-sm-3">
        <div className="skeleton" style={{ width: "150px", height: "150px" }}></div>
      </div>
    </div>

    <div className="form-group row">
      <label htmlFor="courseImage" className="col-sm-3 col-form-label">
        Favicon
      </label>
      <div className="col-sm-6">
        <div className="skeleton skeleton-input"></div>
      </div>
      <div className="col-sm-3">
        <div className="skeleton" style={{ width: "150px", height: "150px" }}></div>
      </div>
    </div>

    <div className="btngrp">
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);

  const oldinputs = (
    <div>
      <h4> Site Settings</h4>

      <div className="form-group row">
        <label htmlFor="siteurl" className="col-sm-3 col-form-label">
          Site Url 
        </label>
        <div className="col-sm-6">
          <input
            id="siteurl"
            placeholder="Site Url"
            value={defaultsiteSettings.siteUrl}
            className="form-control"
            readOnly
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="title" className="col-sm-3 col-form-label">
          Tab title 
        </label>
        <div className="col-sm-6">
          <input
            id="title"
            placeholder="Tab title"
            value={defaultsiteSettings.title}
            className="form-control"
            readOnly
          />
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Site Logo 
        </label>
        <div className="col-sm-6 ">
          <div className="custom-file">
            <label className="custom-file-label">Choose file...</label>
          </div>{" "}
        </div>
        <div className="col-sm-3 ">
        {defaultsiteSettings.sitelogo && (
          <div className="imgcontainer" style={{width:"150px",height:"50px"}}>
              <img
                src={`data:image/jpeg;base64,${defaultsiteSettings.sitelogo}`}
                alt="site logo "
              />
          </div>
          )}
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Site Icon 
        </label>
        <div className="col-sm-6">
          <div className=" custom-file">
            <label className="custom-file-label">Choose file...</label>
          </div>
        </div>
        <div className="col-sm-3 ">
        {defaultsiteSettings.siteicon && (
          <div className="imgcontainer" style={{width:"150px",height:"150px"}}>
              <img
                src={`data:image/jpeg;base64,${defaultsiteSettings.siteicon}`}
                alt="site icon"
              />
          </div>
            )}
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Favicon 
        </label>
        <div className="col-sm-6">
          <div className=" custom-file">
            <label className="custom-file-label">Choose file...</label>
          </div>
        </div>
        <div className="col-sm-3 ">
        {defaultsiteSettings.titleicon && (
          <div className="imgcontainer" style={{width:"150px",height:"150px"}}>
              <img
                src={`data:image/jpeg;base64,${defaultsiteSettings.titleicon}`}
                alt="titleicon"
              />
          </div>
               )}
        </div>
      </div>
      <div className="btngrp">
        <button className="btn btn-success" onClick={Edit}>
          Edit
        </button>
      </div>
    </div>
  );

  const EditInputs = (
    <div>
      <h4> Site Settings</h4>

      <div className="form-group row">
        <label htmlFor="siteurl" className="col-sm-3 col-form-label">
          Site Url 
        </label>
        <div className="col-sm-6">
          <input
            id="siteurl"
            placeholder="Site Url"
            name="siteUrl"
            onChange={handleChange}
            value={siteSettings.siteUrl}
            className={`form-control   ${error.siteUrl && "is-invalid"}`}
               />
               <div className="invalid-feedback">{error.siteUrl}</div>
              
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="title" className="col-sm-3 col-form-label">
          Tab title 
        </label>
        <div className="col-sm-6">
          <input
            id="title"
            placeholder="Tab title"
            name="title"
            onChange={handleChange}
            value={siteSettings.title}
            className={`form-control   ${error.title && "is-invalid"}`}
               />
               <div className="invalid-feedback">{error.title}</div>
              
        </div>
      </div>
      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Site Logo 
        </label>
        <div className="col-sm-6 ">
          <div className="custom-file">
            <input
              type="file"
              className={`custom-file-input 
                      ${error.sitelogo && "is-invalid"}`}
                      onChange={handleFileChange}
              id="sitelogo"
              name="sitelogo"
             accept=".jpg,.jpeg,.png"
            />
            <label className="custom-file-label" htmlFor="sitelogo">
              Choose file...
            </label>
            {error.sitelogo ? (
              <div className="invalid-feedback">{error.sitelogo}</div>
            ) : (
              <div className="small">
              Use .png files with dimensions of 150x50px for better view. <br />
              Avoid using blue color for better contrast and visibility.
            </div>
            

            )}
          </div>{" "}
        </div>
        <div className="col-sm-3 ">
        {baseimage.sitelogo && (
          <div className="imgcontainer" style={{width:"150px",height:"50px"}}>
              <img
                src={baseimage.sitelogo}
                alt="site logo"
              />
          </div>
            )}
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Site Icon 
        </label>
        <div className="col-sm-6">
          <div className=" custom-file">
            <input
              type="file"
              className={`custom-file-input 
                      ${error.siteicon && "is-invalid"}`}
                      onChange={handleFileChange}
              id="siteicon"
              name="siteicon"
            accept=".jpg,.jpeg,.png"
            />
            <label className="custom-file-label" htmlFor="siteicon">
              Choose file...
            </label>
            {error.siteicon ? (
              <div className="invalid-feedback">{error.siteicon}</div>
            ) : (
              <div className="small">
              Use .png files with dimensions of 200X200px for better view. <br />
              Avoid using White color for better contrast and visibility.
            </div>
            )}
          </div>
        </div>
        <div className="col-sm-3 ">
        {baseimage.siteicon && (
          <div className="imgcontainer" style={{width:"150px",height:"150px"}}>
              <img
                src={baseimage.siteicon}
                alt="site icon"
              />      
          </div>
               )}
        </div>
      </div>

      <div className="form-group row">
        <label htmlFor="courseImage" className="col-sm-3 col-form-label">
          Favicon 
        </label>
        <div className="col-sm-6">
          <div className=" custom-file">
            <input
              type="file"
              className={`custom-file-input 
                      ${error.titleicon && "is-invalid"}`}
                      onChange={handleFileChange}
              id="titleicon"
              name="titleicon"
                accept=".ico"
            />
            <label className="custom-file-label" htmlFor="titleicon">
              Choose file...
            </label>
            {error.titleicon ? (
              <div className="invalid-feedback">{error.titleicon}</div>
            ) : ( <div className="small">
              Use .png files with dimensions of 16X16px for better view. <br />
              Avoid using White color for better contrast and visibility.
            </div>
            )}
          </div>
        </div>
        <div className="col-sm-3 ">
        {baseimage.titleicon && (
          <div className="imgcontainer" style={{width:"150px",height:"150px"}}>
              <img
                src={baseimage.titleicon}
                alt="titleicon"
              />
          </div>
            )}
        </div>
      </div>
      <div className="btngrp">
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
  return (<>{Activeprofile ==="VPS" && <div>{loading?Skeleton: isnotFound ? EditInputs : oldinputs}</div>}</>);
};

export default Sitesettings;
