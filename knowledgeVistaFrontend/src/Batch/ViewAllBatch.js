import React, { useEffect, useState } from "react";
import baseUrl from "../api/utils";
import errorimg from "../images/errorimg.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import altBatchImage from "../images/altBatchImage.jpg";
const ViewAllBatch = () => {
  const token = sessionStorage.getItem("token");
  const role=sessionStorage.getItem("role");
  const MySwal = withReactContent(Swal);
  const [batch, setbatch] = useState([]);
  const Currency = sessionStorage.getItem("Currency");
  const navigate = useNavigate();
  const[loading,setloading]=useState(false)
  const handleDelete = (e, batchId) => {
    if(role=="USER"){
      return;
    }
    e.preventDefault()
    MySwal.fire({
      title: "Delete Course?",
      text: "Are you sure you want to delete this batch ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // If the user clicked "Delete"
        axios
          .delete(`${baseUrl}/batch/delete/${batchId}`, {
            headers: {
              Authorization: token,
            },
          })
          .then((response) => {
            if (response.status === 200 || 204) {
              MySwal.fire({
                title: "Deleted!",
                text: "Your Batch has been deleted.",
                icon: "success",
              }).then((result) => {
                if (result.isConfirmed) {
               fetchBatch()
                }
              });
            }
          })
          .catch((error) => {
            if (error.response && error.response.status === 401) {
              navigate("/unauthorized");
            } else {
              throw error;
            }
          });
      }
    });
  };
     const fetchBatch = async () => {
      try {
        setloading(true)
        const response = await axios.get(`${baseUrl}/Batch/getAll`, {
          headers: {
            Authorization: token,
          },
        });
        const data = response.data;
        console.log(data);
        setbatch(data);
      } catch (err) {
        console.log(err);
      }finally{
        setloading(false)
      }
    };
  useEffect(() => {
 
    fetchBatch();
  }, []);
  return (
    <div>
      <div className="page-header"></div>
       {loading ? (
  <div className="row">
    {[...Array(12)].map((_, index) => (
      <div className=" course" key={index}>
        <div className="card mb-3">
          {/* Image skeleton */}
          <div
            className="skeleton skeleton-input"
            style={{ height: "140px", width: "100%" }}
          ></div>

          <div className="card-body">
            {/* Title skeleton */}
            <div
              className="skeleton skeleton-title"
              style={{ marginBottom: "10px" }}
            ></div>

            {/* Description skeleton */}
            <div
              className="skeleton skeleton-input"
              style={{ height: "1rem", marginBottom: "15px" }}
            ></div>

            {/* Button skeleton */}
            <div
              className="skeleton skeleton-button"
              style={{ marginTop: "10px" }}
            ></div>
          </div>
        </div>
      </div>
    ))}
  </div>
) : ( batch.length > 0 ? (
        <div className="batch-container">
          {batch
            .slice()
            .reverse()
            .map((item) => (
                <div className="batch mb-3 card" key={item.id}>
                  {item.batchImage ? (
                    <img
                      style={{ cursor: "pointer" }}
                      title={`${item.batchTitle} image`}
                      className="img-fluid card-img-top"
                      src={`data:image/jpeg;base64,${item.batchImage}`}
                      onError={(e) => {
                        e.target.src = errorimg; // Use the imported error image
                      }}
                      onClick={(e) => {
                        navigate(`/batch/viewcourse/${item.batchTitle}/${item.id}`)
                       }}
                      alt="Batch"
                    />
                  ) : (
                    <div
                      className="img-fluid card-img-top "
                      title={item.batchTitle}
                      onClick={(e) => {
                        navigate(`/batch/viewcourse/${item.batchTitle}/${item.id}`)
                       }}
                      style={{
                        backgroundImage: `url(${altBatchImage})`, // Set the background image as altBatchImage
                        backgroundSize: "cover", // Ensure the image covers the div
                        backgroundPosition: "center", 
                        height: "150px", // Set a fixed height or adjust accordingly
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      
                      }}
                    >
                      {/* var(--primary) */}
                     <h4 style={{color:'white',
                       wordWrap: "break-word", // Ensure the text wraps if it overflows
                       margin: "0", // Remove any default margin
                       padding: "0 10px", // Add some padding for better readability if needed
                       textAlign:"center"
                    
                     }}> {item.batchTitle}</h4>
                    </div>
                  )}
                  <div className="card-body pt-2">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h5
                      className="courseName"
                      title={item.batchTitle}
                      style={{ cursor: "pointer",width:"200px"}}
                      onClick={(e) => {
                       navigate(`/batch/viewcourse/${item.batchTitle}/${item.id}`)
                      }}
                    >
                      {item.batchTitle}
                    </h5>
                 {(role ==="ADMIN"||role==="TRAINER") &&    <div style={{ textAlign: "right" }}>
                      <a
                        href={`/batch/Edit/${item.id}`}
                        title="Edit Batch"
                        style={{ cursor: "pointer" }}
                      >
                        <i className="fas fa-edit pr-2"></i>
                      </a>
                      <a
                        href="#"
                        title="Delete Batch"
                        onClick={(e) => handleDelete(e, item.id)}
                      >
                        <i className="fas fa-trash text-danger"></i>
                      </a>
                    </div>}
                    </div>
                    <p title={item.course.join(", ")} className="batchlist">
                      <b>Courses &nbsp;:</b> {item.course.join(", ")}
                    </p>
                    <p title={item.trainer.join(", ")} className="batchlist">
                      <b>Trainers &nbsp;:</b> {item.trainer.join(", ")}
                    </p>
                    <p title={item.duration} className="batchlist">
                      <b>Duration :</b> {item.duration}
                    </p>
                    <div>
                      {item.amount === 0 ? (
                        <a
                          title="Enroll For Free"
                          //onClick={(e)=>{ e.preventDefault();navigate(item.courseUrl)}}
                          className="btn btn-sm btn-outline-success w-100"
                        >
                          Enroll for Free
                        </a>
                      ) : (
                        <div className="amountGrid">
                          <div className="amt">
                            <i
                              className={
                                Currency === "INR"
                                  ? "fa-solid fa-indian-rupee-sign pr-1"
                                  : "fa-solid fa-dollar-sign pr-1"
                              }
                            ></i>
                            <span title={item.amount}>{item.amount}</span>
                          </div>
                          <button
                            className=" btn btn-sm btn-outline-primary"
                            // onClick={() =>
                            //   handlepaytype(item.courseId, userId, item.paytype)
                            // }
                            title="Enroll Now"
                          >
                            Enroll Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
        </div>
      ) : (
        <div>
          <h1 className="text-primary ">No Batch Found </h1>
        </div>
      )
    )}
    </div>
  );
};

export default ViewAllBatch;
