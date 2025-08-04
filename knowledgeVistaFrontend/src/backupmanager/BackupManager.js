import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";

const scheduleTypes = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const weekDays = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const monthDays = Array.from({ length: 28 }, (_, i) => i + 1); // To avoid Feb bugs

export default function BackupManager() {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState({});
  const [newSchedule, setNewSchedule] = useState({
    scheduleType: "",
    dayOfWeek: "", // MUST match enum
    dayOfMonth: 0,
    maxBackupsToKeep: 0, // MUST match Java field name
    backupTime:"02:00"
  });

  const weekDays = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  useEffect(() => {
    fetchSchedule();
  }, []);
  const fetchSchedule = async () => {
    setLoading((prev) => ({ ...prev, getshedule: true }));
    try {
      const response = await axios.get(`${baseUrl}/backup/shedule/get`, {
        headers: {
          Authorization: token,
        },
      });

      setNewSchedule(response?.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/unauthorized");
      } else {
        MySwal.fire({
          icon: "error",
          title: "Failed to save schedule",
          text: error?.response?.data || "Something went wrong.",
          confirmButtonText: "ok",
        });
      }
    } finally {
      setLoading((prev) => ({ ...prev, getshedule: false }));
    }
  };
  const createSchedule = async () => {
    setLoading((prev) => ({ ...prev, saveSchedule: true }));
    try {
      const response = await axios.post(
        `${baseUrl}/backup/shedule/SaveorUpdate`,
        newSchedule,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
      MySwal.fire({
        icon: "success",
        title: `Schedule ${response?.data}`,
        text:
          `Backup schedule ${response?.data} successfully!` ||
          "Your backup schedule was saved.",
        confirmButtonText: "OK",
      }).then((result) => {
        fetchSchedule();
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      MySwal.fire({
        icon: "error",
        title: "Failed to save schedule",
        text: error?.response?.data || "Something went wrong.",
        confirmButtonText: "ok",
      });
    } finally {
      setLoading((prev) => ({ ...prev, saveSchedule: false }));
    }
  };

  const setLoadingFor = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const downloadBackup = async () => {
    try {
      setLoadingFor("downloadBackup", true);
      const response = await axios.get(`${baseUrl}/backup/download`, {
        headers: {
          Authorization: token,
        },
        responseType: "blob", // 👈 important for binary data
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/sql" });

        // Generate a filename with timestamp or fallback
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:T]/g, "-");
        const filename = `backup_${timestamp}.sql`;

        // Create temporary download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename); // 👈 sets the filename
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/unauthorized");
      } else if (err?.response?.status === 500) {
        const blob = err?.response?.data;

        // Try to read the blob as text
        const reader = new FileReader();
        reader.onload = () => {
          const errorMessage = reader.result || "Unknown server error";

          MySwal.fire({
            icon: "error",
            title: "Some Error Occurred",
            text: errorMessage,
            confirmButtonText: "OK",
          });
        };
        reader.onerror = () => {
          MySwal.fire({
            icon: "error",
            title: "Some Error Occurred",
            text: "Unable to read server error message.",
            confirmButtonText: "OK",
          });
        };

        reader.readAsText(blob); // 👈 reads blob as string
      }
    } finally {
      setLoadingFor("downloadBackup", false);
    }
  };

  const saveBackuptoDrive = async () => {
    try {
      setLoadingFor("saveToDrive", true);
      const response = await axios.get(`${baseUrl}/backup/SaveToDrive`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.status === 200) {
        MySwal.fire({
          icon: "success",
          title: "Backup Successful",
          text: response?.data,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/unauthorized");
      }
      if (err?.response?.status === 428) {
        const message = err?.response?.data;

        MySwal.fire({
          icon: "warning",
          title: "Credentials are Missing ",
          text: message,
          confirmButtonText: "OK",
        }).then((result) => {
          navigate("/admin/driveCredentials");
        });
      } else if (err?.response?.status === 500) {
        MySwal.fire({
          icon: "error",
          title: "Some Error Occurred",
          text: err?.response?.data,
          confirmButtonText: "OK",
        });
      }
    } finally {
      setLoadingFor("saveToDrive", false);
    }
  };

  return (
    <div>
      <div className="page-header"></div>
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
          <h4 className="pb-1">
            <i className="fa fa-database "></i> Database Backup
          </h4>
          <div>
            <h5 className="mb-3">Automated Schedule</h5>
            {loading.getshedule ? (
              <div className="skeleton-wrapper">
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Schedule Type
                  </label>
                  <div className="col-sm-9">
                    <div className="skeleton skeleton-input"></div>
                  </div>
                </div>

                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Max Backups to Keep
                  </label>
                  <div className="col-sm-9">
                    <div className="skeleton skeleton-input"></div>
                  </div>
                </div>

                <div className="skeleton skeleton-input"></div>

                <div className="cornerbtn mt-3">
                  <div></div>
                  <div className="skeleton skeleton-button"></div>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Schedule Type
                  </label>
                  <div className="col-sm-9">
                    <select
                      className="form-select"
                      value={newSchedule.scheduleType}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          scheduleType: e.target.value,
                        })
                      }
                    >
                      {scheduleTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newSchedule.scheduleType === "WEEKLY" && (
                  <div className="form-group row">
                    <label className="col-sm-3 col-form-label">
                      Day of the Week
                    </label>
                    <div className="col-sm-9">
                      <select
                        className="form-select"
                        value={newSchedule.dayOfWeek}
                        onChange={(e) =>
                          setNewSchedule({
                            ...newSchedule,
                            dayOfWeek: e.target.value,
                          })
                        }
                      >
                        {weekDays.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {newSchedule.scheduleType === "MONTHLY" && (
                  <div className="form-group row">
                    <label className="col-sm-3 col-form-label">
                      Day of the Month
                    </label>
                    <div className="col-sm-9">
                      <select
                        className="form-select"
                        value={newSchedule.dayOfMonth}
                        onChange={(e) =>
                          setNewSchedule({
                            ...newSchedule,
                            dayOfMonth: parseInt(e.target.value),
                          })
                        }
                      >
                        {monthDays.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Max Backups to Keep
                  </label>
                  <div className="col-sm-9">
                    <select
                      className="form-select"
                      value={newSchedule.maxBackupsToKeep}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          maxBackupsToKeep: parseInt(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Only the latest{" "}
                      <strong>{newSchedule.maxBackupsToKeep}</strong> backups
                      will be retained in Drive. Older ones will be
                      automatically deleted.
                    </small>
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Backup Time</label>
                  <div className="col-sm-9">
                    <input
                      type="time"
                      className="form-control"
                      value={newSchedule.backupTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          backupTime: e.target.value,
                        })
                      }
                      required
                    />
                    <small className="form-text text-muted">
                      Choose the time when backup should be executed.
                    </small>
                  </div>
                </div>

                {newSchedule.scheduleType && (
                  <div className="alert alert-info">
                    Backups will happen every{" "}
                    <strong>{newSchedule.scheduleType.toLowerCase()}</strong>
                    {newSchedule.scheduleType === "WEEKLY" && (
                      <>
                        {" "}
                        on <strong>{newSchedule.dayOfWeek}</strong>
                      </>
                    )}
                    {newSchedule.scheduleType === "MONTHLY" && (
                      <>
                        {" "}
                        on day <strong>{newSchedule.dayOfMonth}</strong>
                      </>
                    )}{" "}
                    and stored in <strong>Drive</strong>. Only the last{" "}
                    <strong>{newSchedule.maxBackupsToKeep}</strong> backups will
                    be kept.
                  </div>
                )}

                <div className="cornerbtn">
                  <div></div>
                  <button className="btn btn-primary" onClick={createSchedule}>
                    Save Schedule
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr />
          <h5 className="mb-3">Trigger Backup Now</h5>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-success"
              onClick={downloadBackup}
              disabled={loading?.downloadBackup}
            >
              {loading?.downloadBackup ? (
                <i className="fa fa-spinner fa-spin"></i> // ⬅️ Spinner icon
              ) : (
                <i className="fa fa-download"></i>
              )}{" "}
              {loading?.downloadBackup ? "Downloading..." : "Download Now"}
            </button>

            <button
              className="btn btn-outline-info"
              onClick={saveBackuptoDrive}
              disabled={loading?.saveToDrive}
            >
              {loading?.saveToDrive ? (
                <i className="fa fa-spinner fa-spin"></i> // ⬅️ Spinner icon
              ) : (
                <i className="fa fa-google-drive"></i>
              )}{" "}
              {loading?.saveToDrive ? "Saving..." : "Save to Drive"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
