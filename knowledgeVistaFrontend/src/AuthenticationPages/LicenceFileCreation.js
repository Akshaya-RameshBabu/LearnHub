import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from '../api/utils';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const LicenceFileCreation = () => {
    const [formData, setFormData] = useState({
        companyName: "",
        productName: "",
        storageSize: "",
        noOfCourse: "",
        noOfStudent: "",
        noOfTrainers: "",
        type: "",
        validity: "",
        version: "",
    });

        const MySwal = withReactContent(Swal);
    const [freeData, setFreeData] = useState({
        storageSize: "1",
        noOfCourse: "1",
        noOfStudent: "10000",
        noOfTrainers: "10000",
        type: "free",
        validity: "365",
        version: "4.2",
    });
    const [basicData, setBasicData] = useState({
        storageSize: "1",
        noOfCourse: "3",
        noOfStudent: "1000",
        noOfTrainers: "1000",
        type: "basic",
        validity: "365",
        version: "4.2",
    });
    const [standardData, setStandardData] = useState({
        storageSize: "1000",
        noOfCourse: "5",
        noOfStudent: "1000",
        noOfTrainers: "1000",
        type: "standard",
        validity: "365",
        version: "4.2",
    });
    const [enterpriseData, setEnterpriseData] = useState({
        storageSize: "1000",
        noOfCourse: "1000",
        noOfStudent: "1000",
        noOfTrainers: "1000",
        type: "enterprise",
        validity: "365",
        version: "4.2",
    });
    const [professionalData, setProfessionalData] = useState({
        storageSize: "1000",
        noOfCourse: "10",
        noOfStudent: "1000",
        noOfTrainers: "1000",
        type: "professional",
        validity: "365",
        version: "4.2",
    });
    // Effect to handle free selection
    // Validate all fields
    const isValid = () => {
        return (
            formData.type && // Ensure 'type' is selected
            formData.companyName &&
            formData.productName &&
            Object.values(formData).every((value) => value !== null && value !== "")
        );
    };

    // Update state on input change
    const handleInputChange = (e) => {
        const { id, value } = e.target;

         // Prevent editing other fields if 'type' is not selected
    if (!formData.type && id !== "type") {
         MySwal.fire({
                                        toast:true,
                                  position: 'top-end', 
                                  icon: 'warning',
                                  title: 'Please Select a Type First !',
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

    setFormData((prevData) => ({
        ...prevData,
        [id]: value || "", // Default to empty string
    }));

      // If 'type' is changed, update form values accordingly
      if (id === "type") {
        if (value === "free") {
            setFormData({
                ...freeData,
                companyName: "", // Preserve companyName
                productName: "", // Preserve productName
            });
        } else if (value === "professional") {
            setFormData({
                ...professionalData,
                companyName: "", // Preserve companyName
                productName: "", // Preserve productName
            });
        } else if (value === "standard") {
            setFormData({
                ...standardData,
                companyName: "", // Preserve companyName
                productName: "", // Preserve productName
            });
        } else if (value === "enterprise") {
            setFormData({
                ...enterpriseData,
                companyName: "", // Preserve companyName
                productName: "", // Preserve productName
            });
        } else if (value === "basic") {
            setFormData({
                ...basicData,
                companyName: "", // Preserve companyName
                productName: "", // Preserve productName
            });
            
        }else if (value === "customized") {
            setFormData({
                companyName: "",
                productName: "",
                storageSize: "",
                noOfCourse: "",
                noOfStudent: "",
                noOfTrainers: "",
                type: "customized",
                validity: "",
                version: "",
            });
        } else {
            setFormData({
                companyName: "",
                productName: "",
                storageSize: "0",
                noOfCourse: "0",
                noOfStudent: "0",
                noOfTrainers: "0",
                type: value,
                validity: "0",
                version: "", // Allow version to be a string
            });
        }
    }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!isValid()) {
             MySwal.fire({
                                            toast:true,
                                      position: 'top-end', 
                                      icon: 'warning',
                                      title: 'Please Fill out all Required Fields !',
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
        try {
            const response = await axios.get(`${baseUrl}/api/v2/download`, {
                params: formData, // Pass formData as URL parameters
                responseType: "blob", // Handle file as a blob
                headers: {
                  "Accept": "application/xml", // Expecting XML file from the server
                },
              });
      const blob = new Blob([response.data], { type: "application/xml" });

      // Create an anchor tag to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "data.xml"; // The name of the file to be downloaded
      document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        } catch (error) {
            console.error("Error creating licence file:", error);
             MySwal.fire({
                                            toast:true,
                                      position: 'top-end', 
                                      icon: 'error',
                                      title: 'Something Went Wrong Please Try again later !',
                                      showConfirmButton: false,
                                      timer: 3000,
                                      timerProgressBar: true,
                                      didOpen: (toast) => {
                                        toast.addEventListener('mouseenter', Swal.stopTimer);
                                        toast.addEventListener('mouseleave', Swal.resumeTimer);
                                      }
                                    });
        }
    };

    return (
        <div>
            <div className="page-header"></div>
            <div className="card">
                <div className="card-body">
                    <h4>Licence File Creation</h4>
                    <div className="pt-4">
                        {/* Type Selection (Must Select First) */}
                    <div className="form-group row">
                            <label htmlFor="type" className="col-sm-3 col-form-label">
                                Type <span className="text-danger">*</span>
                            </label>
                            <div className="col-sm-9">
                                <select
                                    id="type"
                                    value={formData.type || "*"}
                                    onChange={handleInputChange}
                                    className="form-control"
                                >
                                    <option value="*">
                                        Select Type
                                    </option>
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="standard">Standard</option>
                                    <option value="professional">Professional</option>
                                    <option value="enterprise">Enterprise</option>
                                    <option value="customized">Customized</option>
                                    
                                </select>
                            </div>
                        </div>
                       
                      {/* Other Inputs (Disabled Until Type is Selected) */}
                    {[
                        { id: "companyName", label: "Company Name", type: "text" },
                        { id: "productName", label: "Product Name", type: "text" },
                        { id: "storageSize", label: "Storage Size", type: "number" },
                        { id: "noOfCourse", label: "No of Course", type: "number" },
                        { id: "noOfStudent", label: "No of Student", type: "number" },
                        { id: "noOfTrainers", label: "No of Trainers", type: "number" },
                        { id: "validity", label: "Validity (Days)", type: "number" },
                        { id: "version", label: "Version", type: "text" }, // Always editable
                    ].map(({ id, label, type }) => (
                        <div className="form-group row" key={id}>
                            <label htmlFor={id} className="col-sm-3 col-form-label">
                                {label} <span className="text-danger">*</span>
                            </label>
                            <div className="col-sm-9">
                                <input
                                    type={type}
                                    id={id}
                                    placeholder={label}
                                    value={formData[id]}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    disabled={!formData.type || ((formData.type === "free" || formData.type === "basic" || formData.type === "standard"|| formData.type === "professional"|| formData.type === "enterprise") && id !== "version" && id !== "companyName" && id !== "productName")}
                                />
                            </div>
                        </div>
                    ))}

                    </div>

                    <div className="btngrp">
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!isValid()}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenceFileCreation;
