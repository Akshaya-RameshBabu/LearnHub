
import React, { useState } from 'react';
import baseUrl from '../api/utils';
import axios from 'axios';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 

const CreateBatchModel = ({ setSelectedBatches, closeModal,setErrors }) => {
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        const MySwal = withReactContent(Swal);
  // Calculate the same date next month
  const nextMonthDate = new Date(today);
  nextMonthDate.setMonth(today.getMonth() + 1); // Add one month
  const formattedNextMonthDate = nextMonthDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  const [batchTitle, setBatchTitle] = useState('First batch');
  const [startDate, setStartDate] = useState(formattedToday); // Set initial start date to today
  const [endDate, setEndDate] = useState(formattedNextMonthDate);

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token'); // Get the token from sessionStorage

    if (!batchTitle || !startDate || !endDate) {
        MySwal.fire({
                                toast:true,
                          position: 'top-end', 
                          icon: 'warning',
                          title: 'Please Fill all Fields Before Submitting',
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
      const response = await axios.post(
        `${baseUrl}/batch/partial/save`, // Construct the API endpoint
        null, // No request body since data is sent as query parameters
        {
          params: {
            batchTitle,
            startDate,
            endDate,
          },
          headers: {
            Authorization: token, // Add the token as a header
          },
        }
      );

      if (response.status === 200) {
        const batch = response.data;
        console.log("batch", batch);

        setSelectedBatches((prev) => [
          ...prev, // Spread the previous state (array)
          { id: batch.id, batchId: batch.batchId, batchTitle: batchTitle } // Add the new batch
        ]);
        setErrors((prevErrors) => ({
          ...prevErrors,
          batches: "",
        }));
  
        // Close the modal after submitting
        closeModal();
      }
    } catch (error) {
      console.error('Error creating batch:', error);
        MySwal.fire({
                                toast:true,
                          position: 'top-end', 
                          icon: 'Error',
                          title: 'Error Occured While Creating the batch',
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
    <div
      className="modal fade show "
      id="createBatchModal"
      tabIndex="-1"
      aria-labelledby="createBatchModalLabel"
      aria-hidden="true"
      style={{ display: 'block' }} // Display the modal
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadowcard">
          <div className="modal-header">
            <h5 className="modal-title" id="createBatchModalLabel">Add New Batch</h5>
            <button
              type="button"
              className="btn-close"
              onClick={closeModal} // Call closeModal function on click
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label htmlFor="batch-title" className="col-form-label">
                  Batch Title:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="batch-title"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="start-date" className="col-form-label">
                  Start Date:
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="start-date"
                  min={formattedToday}
                  value={startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setStartDate(newStartDate);
                    if (newStartDate > endDate) {
                      setEndDate(newStartDate); // Adjust end date if it is before the new start date
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-date" className="col-form-label">
                  End Date:
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="end-date"
                  min={startDate} // Set the min attribute dynamically based on the start date
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal} // Close modal
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit} // Call handleSubmit to save data
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBatchModel;
