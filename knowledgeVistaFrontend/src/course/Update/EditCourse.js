import React from "react";
import errorimg from "../../images/errorimg.png";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
const EditCourse = ({ filteredCourses ,loading}) => {
  const navigate=useNavigate();
  const MySwal = withReactContent(Swal);
  const token = sessionStorage.getItem("token");
  const Currency=sessionStorage.getItem("Currency")
  const handleDelete = (e, courseId) => {
    e.preventDefault();
    MySwal.fire({
      title: "Delete Course?",
      text: "Are you sure you want to delete this course ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // If the user clicked "Delete"
        axios
          .delete(`${baseUrl}/course/${courseId}`, {
            headers: {
              Authorization: token,
            },
          })
          .then((response) => {
            if (response.status === 200) {
              MySwal.fire({
                title: "Deleted!",
                text: "Your course has been deleted.",
                icon: "success",
              }).then((result) => {
                if (result.isConfirmed) {
                  window.location.reload();
                }
              });
            }
          })
          .catch((error) => {
            if (error.response && error.response.status === 401) {
              navigate("/unauthorized")
            } else if(error.response && error.response.status === 403){
              MySwal.fire({
                title: "Error!",
                text: error.response.data
                  ? error.response.data
                  : "error occured",
                icon: "error",
                confirmButtonText: "OK",
              });
            }else{
            throw error
            }
          });
      }
    });
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
              <div className="course" key={item.courseId}>
                <div className="card mb-3">
                  <img
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      navigate(item.courseUrl);
                    }}
                    className="img-fluid card-img-top"
                    src={`data:image/jpeg;base64,${item.courseImage}`}
                    onError={(e) => {
                      e.target.src = errorimg; // Use the imported error image
                    }}
                    alt="Course"
                  />
                  <div className="card-body">
                    <div className="flexWithPadding">
                      <div
                      >
                      </div>
                      <div className="gap-10">
                        <div className="dropdown">
                          <a
                            className="dropdown-toggle"
                            href="#"
                            data-toggle="dropdown"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </a>
                          <div className="dropdown-menu dropdown-menu-right  dropdown-menu-top  dropdown-menu-top shadow animated--grow-in">
                            <Link
                              to={`/lessonList/${item.courseName}/${item.courseId}`}
                              className="dropdown-item"
                            >
                              Lessons
                            </Link>
                            <div className="dropdown-divider"></div>
                            <Link
                              to={`/course/testlist/${item.courseName}/${item.courseId}`}
                              className="dropdown-item"
                            >
                              Test
                            </Link>
                            <div className="dropdown-divider"></div>
                            <Link
                              to={`/course/moduleTest/${item.courseName}/${item.courseId}`}
                              className="dropdown-item"
                            >
                              Module Test
                            </Link>
                            <div className="dropdown-divider"></div>
                            <Link
                              to={`/Assignment/getAll/${item.courseName}/${item.courseId}`}
                              className="dropdown-item"
                            >
                              Assignment
                            </Link>
                          </div>
                        </div>
                        <Link to={`/course/edit/${item.courseId}`}>
                          <i title="edit Course" className="fa-solid fa-edit"></i>
                        </Link>

                        <a
                          href="#"
                           title="Delete Course"
                          onClick={(e) => handleDelete(e, item.courseId)}
                        >
                          <i className="fas fa-trash"></i>
                        </a>
                      </div>
                    </div>
                    <h5
                      className="courseName"
                      title={item.courseName}
                      style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          navigate(item.courseUrl);
                        }}
                    >
                      {item.courseName}
                    </h5>
                    <p  className="courseDescription">
                    {item.courseDescription}
                    </p>
                    <div className="card-text">
                      {item.amount === 0 ? (
                        <a
                        href="#"
                        onClick={(e)=>{e.preventDefault();  navigate(item.courseUrl)}}
                          className=" btn btn-sm btn-outline-success w-100"
                        >
                          <label>
                          Free
                          </label>
                        </a>
                      ) : (
                        <a className="btn btn-sm  btn-outline-primary w-100">
                       <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1 " : "fa-solid fa-dollar-sign mr-1"}></i>
                          <label>{item.amount}</label>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div
          style={{
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
            height: "70vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1>No Course Found</h1>
        </div>
      )
    )}
    </>
  );
};

export default EditCourse;