import React, { useState, useEffect } from "react";
import baseUrl from "../api/utils";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";

const LicenceDetails = () => {
  const MySwal = withReactContent(Swal);
  const [audioFile, setAudioFile] = useState(null);
  const [errors, setErrors] = useState({ audioFile: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastModifiedDate, setLastModifiedDate] = useState(null);
  const [licenceDetails, setLicenceDetails] = useState({}); // State for licence details
  const token = sessionStorage.getItem("token");
  const [Activeprofile, setActiverofile] = useState();
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  useEffect(() => {
    const fetchactive = async () => {
      try {
        const active = await axios.get(`${baseUrl}/Active/Environment`);
        if (active?.data?.environment) {
          sessionStorage.setItem("Activeprofile", active.data.environment);
          setActiverofile(active.data.environment);
        }
        if (active?.data?.currency) {
          sessionStorage.setItem("Currency", active.data.currency);
        }
      } catch (error) {
        throw error;
        console.error(error);
      }
    };
    const fetchData = async () => {
      try {
        setloading(true);
        const response = await axios.get(`${baseUrl}/licence/getinfo`, {
          headers: {
            Authorization: token,
          },
        });
        const { data } = response; // Destructure data from response

        // Filter out unwanted properties
        const filteredData = {
          ProductName: data.product_name,
          CompanyName: data.company_name,
          trainer: data.trainer, // Assuming Contact refers to trainer
          student: data.students,
          course: data.course,
          Email: data.email, // Assuming email property exists
          version: data.version, // Assuming version property exists
          Type: data.type,
          StartDate: data.start_date
            ? new Date(data.start_date).toLocaleDateString()
            : "NA",
          EndDate: data.end_date
            ? new Date(data.end_date).toLocaleDateString()
            : "NA",
          StorageSize: `${data.storagesize || 0} GB`, // Handle null storage size
        };

        setLicenceDetails(filteredData);
      } catch (error) {
        throw error;
      } finally {
        setloading(false);
      }
    };

    fetchactive();
    fetchData();
  }, []);
  const handleFileChange = (event) => {
    const { name, value } = event.target;
    let error = "";
    const file = event.target.files[0];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "xml") {
      error = "please select .xml file";
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));
      setSelectedFile(null);
    } else {
      setAudioFile(file);
      setSelectedFile(file);

      // setLastModifiedDate(file ? new Date(file.lastModified).toLocaleString() : null);
      setLastModifiedDate(
        file ? new Date(file.lastModified).toISOString().replace("Z", "") : null
      );
      setErrors({ audioFile: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!audioFile) {
        setErrors({ audioFile: "Please select a file ." }); // Handle missing file
        return;
      }
      if (errors.audioFile) {
        return;
      }
      const formData = new FormData();
      const audioData = {
        audioFile: audioFile,
        lastModifiedDate: lastModifiedDate,
      };
      for (const key in audioData) {
        formData.append(key, audioData[key]);
      }

      const token = sessionStorage.getItem("token");

      const response = await axios.post(
        `${baseUrl}/api/v2/uploadfile`,
        formData,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.status === 200) {
        MySwal.fire({
          title: "Licence Updated!",
          text: "Licence Have been updated successfully!",
          icon: "success",
          confirmButtonText: "Go to Login",
        }).then((result) => {
            navigate("/login");
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        MySwal.fire({
          title: "Error!",
          text: "you are unAuthorized to access this page",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        // MySwal.fire({
        //   title: "Error!",
        //  text: "Some unexpected error occured try again later",
        //   icon: "error",
        //   confirmButtonText: "OK",
        // });
        throw error;
      }
    }
  };

  const Skeleton = (
    <div className="twosplit">
      {/* Product name */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Product name :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Trainers */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Trainers :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Students */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Students :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Course */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Course :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Type */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Type :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Storage Size */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Storage Size :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* Start Date */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>Start Date :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
      </div>

      {/* End Date */}
      <div className="form-group row">
        <label className="col-sm-6 col-form-label">
          <b>End Date :</b>
        </label>
        <div className="col-sm-6 col-form-label">
          <div className="skeleton skeleton-title"></div>
        </div>
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
              <h4 style={{ textAlign: "center" }}>Licence Info</h4>
              {loading ? (
                Skeleton
              ) : (
                <div className="twosplit">
                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Product name :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.ProductName || "NA"}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Trainers :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.trainer || "NA"}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Students :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.student || "NA"}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Course :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.course || "NA"}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Type :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.Type || "NA"}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Storage Size :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.StorageSize}
                    </label>
                  </div>
                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>Start Date :</b>{" "}
                    </label>

                    <label className="col-sm-6 col-form-label">
                      {licenceDetails.StartDate}
                    </label>
                  </div>

                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label">
                      <b>End Date :</b>{" "}
                    </label>

                    <label className="col-sm-6  col-form-label">
                      {licenceDetails.EndDate}
                    </label>
                  </div>

                  {Activeprofile !== "SAS" && (
                    <form onSubmit={handleSubmit}>
                      <div
                        className="form-group row"
                        style={{ height: "80px", alignItems: "flex-start" }}
                      >
                        <label className="col-sm-6 col-form-label">
                          <b>Add New License :</b>{" "}
                        </label>

                        <div className="col-sm-6">
                          <label
                            htmlFor="audioFile"
                            style={{ width: "200px" }}
                            className="file-upload-btn"
                          >
                            {" "}
                            upload file
                          </label>
                          {selectedFile && (
                            <p style={{ fontSize: "smaller" }}>
                              {selectedFile.name}
                            </p>
                          )}
                          <div className="text-danger">{errors.audioFile}</div>

                          <input
                            type="file"
                            className={`file-upload ${
                              errors.audioFile && "is-invalid"
                            }`}
                            id="audioFile"
                            accept=".xml"
                            name="audioFile"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>

                      <input
                        type="submit"
                        value="Upload"
                        className="btn btn-primary"
                      />
                    </form>
                  )}
                </div>
              )}

              <div className="modal-footer mt-1 pt-2">
                <input
                  onClick={() =>
                    window.open("https://learnhub.vsmartengine.com/", "_blank")
                  }
                  value="Upgrade Licence here"
                  className="btn btn-secondary"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenceDetails;
