import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
import useGlobalNavigation from "../../AuthenticationPages/useGlobalNavigation";

const LessonList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  const { courseName, courseId } = useParams();
  const [lessons, setlessons] = useState([]);
  const [submitting, setsubmitting] = useState();
  const token = sessionStorage.getItem("token");
   const fetchData = async () => {
      try {
        setsubmitting(true);
        const response = await axios.get(
          `${baseUrl}/course/getLessonlist/${courseId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setsubmitting(false);
        const lessonList = response.data;
        setlessons(lessonList);
      } catch (error) {
        setsubmitting(false);
        if (error.response && error.response.status === 401) {
          navigate("/unauthorized");
        } else if (error.response && error.response.status === 404) {
          navigate("/missing");
        } else {
          // MySwal.fire({
          //   title: "Error!",
          //   text: error.response.data ? error.response.data : "error occured",
          //   icon: "error",
          //   confirmButtonText: "OK",
          // });
          throw error;
        }
      }
    };
  useEffect(() => {
   

    fetchData();
  }, [courseId]);

  const deletelesson = async (Lesstitle, lessId) => {
    const formData = new FormData();
    formData.append("lessonId", lessId);
    formData.append("Lessontitle", Lesstitle);

    MySwal.fire({
      title: "Delete Lesson?",
      text: `Are you sure you want to delete Lesson ${Lesstitle}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    })
      .then(async (result) => {
        if (result.isConfirmed && lessId != null) {
          try {
            const response = await axios.delete(`${baseUrl}/lessons/delete`, {
              headers: {
                Authorization: token,
              },
              data: formData,
            });

            const message = response.data;

            if (response.status === 200) {
              MySwal.fire({
                title: "Deleted Successfully",
                text: `Lesson ${Lesstitle} was deleted successfully.`,
                icon: "success",
                confirmButtonText: "OK",
              }).then(() => {
                fetchData();
              });
            }
          } catch (error) {
            if (error.response && error.response.status === 401) {
              MySwal.fire({
                title: "Deletion Failed",
                text: "you are UnAuthorized to delete this lesson",
                icon: "error",
                confirmButtonText: "OK",
              });
            } else {
              // MySwal.fire({
              //     title: "Error",
              //     text: "An error occurred while deleting the lesson.",
              //     icon: "error",
              //     confirmButtonText: "OK",
              // });
              throw error;
            }
          }
        }
      })
      .catch((error) => {
        MySwal.fire({
          title: "Unexpected Error",
          text: "An unexpected error occurred while deleting the lesson.",
          icon: "error",
          confirmButtonText: "OK",
        });
      });
  };
  const handleNavigation = useGlobalNavigation();
  return (
    <div>
      {submitting && (
        <div className="outerspinner active">
          <div className="spinner"></div>
        </div>
      )}
      <div className="page-header">
        <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Lessons</h5>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="#" onClick={handleNavigation}>
                    <i className="feather icon-layout"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Lessons</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className=" card-body">
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
                    navigate("/dashboard/course");
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </div>
              </div>

              <div className="twodiv">
                <div
                  className="headingandbutton"
                >
                  <h4>Lessons of {courseName}</h4>
                  <Link
                    to={`/course/Addlesson/${courseName}/${courseId}`}
                    className="btn btn-primary mybtn"
                  >
                    <i className="fas fa-plus"></i> Add{" "}
                  </Link>
                </div>
                <div className="table-container">
                  <table className="table table-hover table-bordered table-sm">
                    <thead className="thead-dark">
                      <tr>
                        <th scope="col" style={{ width: "70vw" }}>
                          Lessons
                        </th>
                        <th scope="col">Quizz</th>
                        <th scope="col" colSpan="2">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    {lessons.length > 0 && (
                      <tbody>
                        {lessons.map((lesson, index) => (
                          <tr key={lesson.lessonId}>
                            <th>
                              <span>{index + 1}.</span>

                              <Link
                                className="lesson-title"
                                to={`/courses/${courseName}/${courseId}/${lesson.lessonId}`}
                              >
                                {lesson.lessonTitle}
                              </Link>
                            </th>

                            <th>
                              {lesson.quizzId === null ? (
                                <Link
                                  to={`/AddQuizz/${courseName}/${courseId}/${lesson.lessonTitle}/${lesson.lessonId}`}
                                >
                                  <span className="btn btn-success">
                                    Add Quizz&nbsp;
                                  </span>
                                </Link>
                              ) : (
                                <Link
                                  to={`/ViewQuizz/${courseName}/${courseId}/${lesson.lessonTitle}/${lesson.lessonId}/${lesson.quizzName}/${lesson.quizzId}`}
                                >
                                  <span className="btn btn-success">
                                    View Quizz
                                  </span>
                                </Link>
                              )}
                            </th>

                            <th>
                              <Link
                                to={`/edit/${courseName}/${courseId}/${lesson.lessonTitle}/${lesson.lessonId}`}
                              >
                                {" "}
                                <i className="fas fa-edit text-primary"></i>
                              </Link>
                            </th>
                            <th>
                              {" "}
                              <span>
                                <i
                                  className="fas fa-trash text-danger pointer"
                                  onClick={() =>
                                    deletelesson(
                                      lesson.lessonTitle,
                                      lesson.lessonId
                                    )
                                  }
                                ></i>
                              </span>
                            </th>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>

              {!submitting && lessons.length <= 0 && (
                <div className="centerflex">
                  <div className="enroll">
                    <h3 className="mt-4">No Lessons Found for {courseName}</h3>
                    <Link
                      to={`/course/Addlesson/${courseName}/${courseId}`}
                      className="btn btn-primary"
                    >
                      Add Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonList;
