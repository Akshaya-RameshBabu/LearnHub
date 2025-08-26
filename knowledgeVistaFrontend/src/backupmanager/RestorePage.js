import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
const RestorePage = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const token=sessionStorage.getItem('token');
 
    const fetchBackups = async () => {
    try {
      const res = await axios.get(`${baseUrl}/listbackups`,{
        headers:{
          Authorization:token
        }
      }); // replace with your backend endpoint
      console.log(res.data)
      setBackups(res.data || []);
    } catch (err) {
      if(err?.res?.status===401){
        navigate("/unauthorized")
      }
      console.error("Error fetching backups", err);
    }
  };

 useEffect(() => {

  fetchBackups();
}, []);


const handleServerRestore = async () => {
  if (!selectedBackup) {
    MySwal.fire("⚠️ Warning", "Please select a backup file.", "warning");
    return;
  }

  setLoading(true);
  try {
    const response = await axios.post(
      `${baseUrl}/backups/restore/server`,
      null, // POST body is empty
      {
        headers: {
          Authorization: token,
        },
        params: {
          fileName: selectedBackup, // ✅ send as request param
        },
      }
    );

    MySwal.fire("✅ Success", "Restore completed successfully from server!", "success");
  } catch (error) {
    const errorMsg = error.response?.data || "❌ Error restoring from server.";
    MySwal.fire("❌ Restore Failed", errorMsg, "error");
    console.error("Server restore error:", error);
  } finally {
    setLoading(false);
  }
};



const handleUploadRestore = async () => {


  try {
      if (!uploadFile) {
    MySwal.fire("⚠️ Warning", "Please upload a .zip file.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("backupZipFile", uploadFile); // ✅ must match backend param

  setLoading(true);
    const response = await axios.post(`${baseUrl}/zip/restore-database`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token
      },
    });
 if(response?.status===200){
    // ✅ success
    MySwal.fire(" Success", response.data, "success");
 }
  } catch (error) {
    if(error.response){
    const errorMsg =
      error.response?.data || "❌ Error restoring from uploaded file.";
    MySwal.fire(" Restore Failed", errorMsg, "error");
    }
  } finally {
    setLoading(false);
    setUploadFile(null);
  }
};


  return (
    <div>
      <div className="page-header">

         <div className="page-block">
                                <div className="page-header-title">
                                    <h5 className="m-b-10">Restore </h5>
                                </div>
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="#" onClick={() => { navigate("/admin/dashboard") }}><i className="feather icon-home"></i></a></li>
                                    <li className="breadcrumb-item"><a href="#">Restore </a></li>
                                </ul>
                             
                    </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <div className="card min-vh-80">
            <div className="card-body">
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

              {loading && (
                <div className="outerspinner active">
                  <div className="spinner"></div>
                </div>
              )}

              <h4> Restore </h4>

              {/* Restore from Server */}
              <div className="mb-5 p-3 mt-2 border rounded">
                <h4>🔹 Restore from Server Backups</h4>
                <p className="text-muted">
                  The system automatically keeps daily backups for the last 7
                  days. Select one from the list below to restore your database
                  and assets.
                </p>
                <div className="row">
                  <div className="col-md-8">
                    <label className="form-label">Select Backup File</label>
                    <select
                      className="form-select"
                      value={selectedBackup}
                      onChange={(e) => setSelectedBackup(e.target.value)}
                    >
                      <option value="">-- Choose Backup --</option>
                      {backups.map((b, idx) => (
                        <option key={idx} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleServerRestore}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>

              {/* Restore from Upload */}
              <div className="p-3 border rounded">
                <h4>🔹 Restore from Uploaded File</h4>
                <p className="text-muted">
                  You can upload a backup archive file (<strong>.zip</strong>)
                  to restore your system manually. Make sure the file is
                  generated by the Learnhub backup tool.
                </p>
                <div className="row">
                  <div className="col-md-8">
                    <label className="form-label">Upload Backup File</label>
                    <input
                      type="file"
                      accept=".zip"
                      className="form-control"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button
                      className="btn btn-success w-100"
                      onClick={handleUploadRestore}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="mt-5 p-3 bg-light rounded">
                <h5>ℹ️ Important Notes</h5>
                <ul>
                  <li>Server keeps only the last 7 daily backups.</li>
                  <li>
                    Upload restore accepts only <code>.zip</code> files created
                    by the system.
                  </li>
                  <li>
                    Restoring will overwrite current database and assets — make
                    sure to back up important data before proceeding.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestorePage;
