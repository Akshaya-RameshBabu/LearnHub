import React, {  useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import errorimg from "../../images/errorimg.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const CourseView = ({ filteredCourses,loading }) => {
  const MySwal = withReactContent(Swal);
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const role=sessionStorage.getItem("role");
  const navigate =useNavigate();
  const Currency=sessionStorage.getItem("Currency");
 
  const handleClick = async (event, id, amount, url) => {
    event.preventDefault();
    if (amount === 0) {
      navigate(url)
    } else {
      try {
        const formdata = JSON.stringify({ courseId: id });
        const response = await axios.post(
          `${baseUrl}/CheckAccess/match`,
          formdata,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );

        if (response.status === 200) {
          const message = response.data;
          navigate(message);
        }else if(response.status===204){
          MySwal.fire({
            icon: "error",
            title: "Oops...",
            text: "cannot Find the  Course ",
          });
        }
      } catch (error) {
        if (error.response.status === 401) {
          MySwal.fire({
            icon: "error",
            title: "Oops...",
            text: "cannot Access Course ",
          }).then(()=>{
            navigate("/unauthorized")
          })
        }else if(error.response.status === 403){
          MySwal.fire({
            icon: "error",
            title: "You Cannot Access This Course",
            text: "This Course was not  Assigned to You  ",
          });
        } else {
          throw error
        }
      }
    }
  };

  return (
    <>
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
) : (
 


      filteredCourses.length > 0 ? (
        <div className="row">
        
          {filteredCourses
            .slice()
            .reverse()
            .map((item) => (
              <div className=" course" key={item.courseId}>
                <div className="card mb-3 ">
                  <img
                   style={{ cursor: "pointer" }}
                   onClick={(e) => {
                     handleClick(
                       e,
                       item.courseId,
                       item.amount,
                       item.courseUrl
                     );
                   }}
                   title={`${item.courseName} image`}
                    className="img-fluid card-img-top"
                    src={`data:image/jpeg;base64,${item.courseImage}`}
                    onError={(e) => {
                      e.target.src = errorimg; // Use the imported error image
                    }}
                    alt="Course"
                  />
                  <div className="card-body">
                    <h5
                      className="courseName"
                      title={item.courseName}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        handleClick(
                          e,
                          item.courseId,
                          item.amount,
                          item.courseUrl
                        );
                      }}
                    >
                      {item.courseName}
                    </h5>
                   <p title={item.courseDescription} className="courseDescription">
                    {item.courseDescription}
                    </p>
                   {role ==="USER" &&  <div>
                      {item.amount === 0 ? (
                        <a
                          title="Enroll For Free"
                          onClick={(e) => {
                            handleClick(
                              e,
                              item.courseId,
                              item.amount,
                              item.courseUrl
                            );
                          }}
                          className="btn btn-sm btn-outline-success w-100"
                        >
                          Enroll for Free
                        </a>
                      ) : (
                        <div
                          className="amountGrid"
                        >
                          <div className="amt">
                             <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign pr-1" : "fa-solid fa-dollar-sign pr-1"}></i>
                              <span title={item.amount} >
                              {item.amount}
                            </span>
                          </div>
                          <button
                            className=" btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              handleClick(
                                e,
                                item.courseId,
                                item.amount,
                                item.courseUrl
                              );
                            }}
                            title="Enroll Now"
                          >
                            Enroll Now
                          </button>
                        </div>
                      )}
                    </div>}
                    {(role ==="ADMIN"||role==="TRAINER") &&  <div>
                      
                      <div className="card-text">
                      {item.amount === 0 ? (
                        <a
                        href="#"
                          className=" btn btn-sm btn-outline-success w-100"
                          onClick={(e) => {
                            handleClick(
                              e,
                              item.courseId,
                              item.amount,
                              item.courseUrl
                            );
                          }}
                        >
                          <label>
                          Free
                          </label>
                        </a>
                      ) : (
                        <a className="btn btn-sm  btn-outline-primary w-100"     onClick={(e) => {
                          handleClick(
                            e,
                            item.courseId,
                            item.amount,
                            item.courseUrl
                          );
                        }}>
                       <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1 " : "fa-solid fa-dollar-sign mr-1"}></i>
                          <label>{item.amount}</label>
                        </a>
                      )}
                    </div>
                         
                       
                    </div>}
                  </div>
                </div>
              </div>
            ))}
                 </div>
      ) : (
        <div >
        <h1 className="text-light ">No Course Found </h1>
        </div>
      )
    )}
    </>
  );
};

export default CourseView;