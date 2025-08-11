import React, { useState, useEffect } from "react";
import errorimg from "../images/errorimg.png";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";

const MyAssignedcourses = () => {
  const MySwal = withReactContent(Swal);
  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");
  const [courses, setCourses] = useState([]);
  const Currency=sessionStorage.getItem("Currency")
  const navigate=useNavigate()
     const fetchItems = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/AssignCourse/Trainer/courselist`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        const data = response.data;
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
  useEffect(() => {
    fetchItems();
  }, []);
  const handleDelete = (e, courseId) => {
    e.preventDefault();
    MySwal.fire({
      title: "Delete Course?",
      text: "Are you sure you want to delete this course?",
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
              // Handle successful deletion
              MySwal.fire({
                title: "Deleted!",
                text: "Your course has been deleted.",
                icon: "success",
              }).then((result) => {
                if (result.isConfirmed) {
                fetchItems();
                }
              });
            }
          })
          .catch((error) => {
            if (error.response && error.response.status === 401) {
              navigate("/unauthorized")
            } else {
              // MySwal.fire({
              //   title: "Error!",
              //   text: error.response.data
              //     ? error.response.data
              //     : "error occured",
              //   icon: "error",
              //   confirmButtonText: "OK",
              // });
              throw error
            }
          });
      } else {
        // If the user clicked "Cancel" or closed the dialog
        MySwal.fire("Cancelled", "Your course is safe :)", "info");
      }
    });
  };
  return (
    <div>
      <div className="page-header"></div>
      <div className="row">
        <div className="col-sm-12">
          <div className="createbtn">
            {(role === "ADMIN" || role === "TRAINER") && (
              <a onClick={(e)=>{e.preventDefault();navigate("/course/addcourse")}} href="#">
                <button type="button" className="btn btn-light mb-3">
                  <i className="fa-solid fa-plus"></i> Create Course
                </button>
              </a>
            )}
          </div>
          {courses?.length === 0 ? (
            <div className="centerflex">
              <div className="enroll pb-5 pt-4">
                <h3 className="mt-5">No courses Found </h3>
              </div>
            </div>
          ) : (
            <div className="row">
              {Array.isArray(courses) &&  courses?.map((item) => (
                <div className=" course" key={item.courseId}>
                  <div className="card mb-3">
                    <img
                      src={`data:image/jpeg;base64,${item.courseImage}`}
                      onError={(e) => {
                        e.target.src = errorimg; // Use the imported error image
                      }}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(item.courseUrl)
                      }}
                      className="img-fluid card-img-top"
                      alt="Course"
                    />
                    <div className="card-body">
                      <div className=" flexWithPadding">
                        <div></div>
                        <div className="gap-10">
                          <div className="dropdown ">
                            <a
                              className="dropdown-toggle"
                              href="#"
                              id="userDropdown"
                              role="button"
                              data-toggle="dropdown"
                              aria-haspopup="true"
                              aria-expanded="false"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </a>
                            <div
                              className="dropdown-menu dropdown-menu-right  shadow animated--grow-in"
                              aria-labelledby="userDropdown"
                            >
                              <Link
                                to={`/lessonList/${item.courseName}/${item.courseId}`}
                                className="dropdown-item"
                                data-toggle="modal"
                                data-target="#logoutModal"
                              >
                                Lessons
                              </Link>
                              <div className="dropdown-divider"></div>
                              <Link
                                to={`/course/testlist/${item.courseName}/${item.courseId}`}
                                className="dropdown-item"
                                data-toggle="modal"
                                data-target="#logoutModal"
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
                          <div>
                            <Link to={`/course/edit/${item.courseId}`}>
                              <i title="Edit Course" className="fa-solid fa-edit"></i>
                            </Link>
                          </div>
                          <div>
                            <a
                              href="#"
                              title="Delete course"
                              onClick={(e) => handleDelete(e, item.courseId)}
                            >
                              <i className="fas fa-trash "></i>
                            </a>
                          </div>
                        </div>
                      </div>
                      <h5>
                      <a className="courseName" title= {item.courseName} onClick={(e)=>{e.preventDefault();navigate(item.courseUrl)}}
                         style={{ cursor: "pointer" }}>
                          { item.courseName}
                        </a></h5>
                      <p title={item.courseDescription} className="courseDescription"> {item.courseDescription}</p>
                      <div>
                        {item.amount === 0 ? (
                          <a
                            href="#"
                            onClick={(e)=>{e.preventDefault();
                              navigate(item.courseUrl)
                            }}
                           
                            className=" btn btn-sm btn-outline-success w-100"
                          >
                            {" "}
                            Free
                          </a>
                        ) : (
                          <a className="btn btn-sm btn-outline-primary w-100">
                            <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1" : "fa-solid fa-dollar-sign mr-1"}></i>
                            <span>{item.amount}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssignedcourses;