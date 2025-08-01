import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Link, redirect, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../../api/utils";
import axios from "axios";
import book from "../../images/book.jpeg";

const ViewVideo = () => {
  const playerRef = useRef(null);
  const lessonListRef = useRef(null);
  const MySwal = withReactContent(Swal);
  const { courseId, courseName } = useParams();
  const [lessonId, setLessonId] = useState(null);
  const [AllLessons, setAllLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [videoType, setVideoType] = useState();
  const [videoSource, setVideoSource] = useState();
  const [currentLesson, setCurrentLesson] = useState();
  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");
  const [currentDocs, setcurrentDocs] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/course/getLessondetail/${courseId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        if (response.status == 200) {
          const lessonList = response.data;
          setAllLessons(lessonList);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/unauthorized")
          return;
        } else if (error.response && error.response.status === 404) {
          navigate("/missing")
        } else {
          // await MySwal.fire({
          //   icon: "error",
          //   title: "Some Error Occurred",
          //   text: "Please Try Again Later",
          //   confirmButtonText: "OK",
          // })
          throw error.then((result) => {
            if (result.isConfirmed) {
              navigate(-1);
            }
          });
        }
      }
    };

    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (AllLessons.length > 0 && lessonId === null) {
      setLessonId(AllLessons[0].lessonId);
    }
  }, [AllLessons, lessonId]);

  useEffect(() => {
    if (lessonId !== null) {
      fetchVideo(lessonId);
    }
  }, [lessonId]);

  useEffect(() => {
    if (currentLessonIndex >= 0 && currentLessonIndex < AllLessons.length) {
      setLessonId(AllLessons[currentLessonIndex].lessonId);
    }
  }, [currentLessonIndex, AllLessons]);

  const fetchdoc = async (lessonId) => {
    const docResponse = await axios.get(`${baseUrl}/getDocs/${lessonId}`,{
      headers: {
        Authorization: token,
      },
    });
    setcurrentDocs(docResponse.data);
  };
  useEffect(() => {
    // Update the currently playing lesson whenever lessonId changes
    if (lessonId !== null) {
      const playingLesson = AllLessons.find(
        (lesson) => lesson.lessonId === lessonId
      );
      setCurrentLesson(playingLesson);
      fetchdoc(lessonId);
    }
  }, [lessonId, AllLessons]);

  const handleOnProgress = (progress) => {
    // Check if progress and its buffered and played properties exist
    if (progress && progress.buffered && progress.played) {
      // Calculate buffered amount
      const bufferedEnd =
        progress.buffered.end && typeof progress.buffered.end === "function"
          ? progress.buffered.end()
          : 0;
      const playedEnd =
        progress.played.end && typeof progress.played.end === "function"
          ? progress.played.end()
          : 0;

      // Calculate buffered amount
      const bufferedAmount = bufferedEnd - playedEnd;

      // If the buffered amount is low, request more data
      if (bufferedAmount < 0.1) {
        // Determine the range to request based on the current played end and a buffer size
        const rangeStart = Math.floor(
          playedEnd * playerRef.current.getDuration()
        );
        const rangeSize = 5 * 1024 * 1024; // 5 MB buffer size
        const rangeEnd = Math.min(
          rangeStart + rangeSize,
          playerRef.current.getDuration()
        );

        // Create a new URL with range query parameters
        const rangeUrl = `${videoSource}?rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`;

        // Set the new video URL to request the specified range from the server
        setVideoSource(rangeUrl);
      }
    }
  };
  useEffect(() => {
    // Scroll to the current lesson note when currentLessonIndex changes
    if (lessonListRef.current && currentLessonIndex >= 0) {
      const currentNoteElement = lessonListRef.current.querySelector(
        `.notes[data-index="${currentLessonIndex}"]`
      );
      if (currentNoteElement) {
        currentNoteElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }
  }, [currentLessonIndex]);

  // Handler for onSeek event

  const handleOnSeek = (progress) => {
    if (progress.buffered && progress.buffered.length > 0) {
      const bufferedEnd = progress.buffered.end(0);
      // Do something with bufferedEnd
    } else {
      console.error("Buffered data is not available.");
    }
  };

  const fetchVideo = async (lessId) => {
    try {
      const lesson = AllLessons.find((lesson) => lesson.lessonId === lessId); // Find the lesson with the matching lessonId

      if (lesson) {
        const url = lesson.fileUrl;
        if (
          url !== null &&
          (url.includes("youtube.com") || url.includes("youtu.be"))
        ) {
          // If URL is not null and contains 'youtube.com' or 'youtu.be', it's a YouTube URL
          setVideoType("youtube");
          setVideoSource(url);
        } else {
          // If URL is null or doesn't contain 'youtube.com' or 'youtu.be', consider it as a local video
          console.log("fetching video")
          setVideoType("local");
          setVideoSource(
            `${baseUrl}/lessons/getvideoByid/${lessId}/${courseId}/${token}`
          );
        }
      }
    } catch (error) {
      MySwal.fire({
        title: "Error!",
        text: error,
        // text: "Some Unexpected Error occured . Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleNoteClick = async (lessId) => {
    const lessonIndex = AllLessons.findIndex(
      (lesson) => lesson.lessonId === lessId
    );
    fetchVideo(lessId);
    setCurrentLessonIndex(lessonIndex);
  };

  const handleVideoEnd = () => {
    setCurrentLessonIndex((prevIndex) => prevIndex + 1);
  };

  const handleNextButtonClick = () => {
    if (currentLessonIndex < AllLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePreviousButtonClick = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

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
              navigate("/dashboard/course");
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </div>
        </div>
        {AllLessons.length > 0 ? (
          <div>
            <div className=" headingbtn">
              <h4 >{courseName}</h4>
              <div>
             {role ==="USER" &&<Link
                to={`/test/start/${courseName}/${courseId}`}
                className="btn btn-primary mybtn  "
              >
                Start Test
              </Link>}
              </div>
           </div>
            
              <div className="main">
                <div className="VideoFrame">
                  {videoType === "local" ? (
                    <ReactPlayer
                      ref={playerRef}
                      url={videoSource}
                      className="vdobox"
                      controls
                      style={{width:"100%"}}
                      onProgress={handleOnProgress}
                      onSeek={handleOnSeek}
                      light={
                        currentLesson.thumbnail
                          ? `data:image/jpeg;base64,${currentLesson.thumbnail}`
                          : false
                      }
                      onEnded={handleVideoEnd}
                      progressInterval={1000}
                      playing
                      config={{
                        file: {
                          attributes: {
                            controlsList: "nodownload",
                          },
                        },
                      }}
                    />
                  ) : videoType === "youtube" ? (
                   
                    <ReactPlayer
                      controls
                      className="vdobox"
                      style={{width:"100%"}}
                      playing
                      url={videoSource ? videoSource : null}
                      light={
                        currentLesson.thumbnail
                          ? `data:image/jpeg;base64,${currentLesson.thumbnail}`
                          : false
                      }
                      onEnded={handleVideoEnd}
                    />
                  ) : null}
                  {currentLesson && (
                    <div className="description mt-1">
                      <h2>{currentLesson.lessontitle}</h2>
                      <p style={{ textIndent: "100px" }}>
                        {currentLesson.lessonDescription}
                      </p>
                    
                     
                    </div>
                  )}
                </div>
                <div className="list">
                  <label className="lessonheading" >
                    Lessons Covered
                  </label>
                  <div className="content" ref={lessonListRef}>
                    {AllLessons.map((lesson, index) => (
                      <div
                        key={index}
                        data-index={index}
                        className={`notes ${
                          lesson.lessonId === lessonId ? "current-lesson" : ""
                        }`}
                        onClick={() => handleNoteClick(lesson.lessonId)}
                        style={{
                          border:
                            lesson.lessonId === lessonId
                              ? "3px solid #4680FE"
                              : "none",
                        }}
                      >
                        <div className="child">
                          <img
                            src={
                              lesson.thumbnail
                                ? `data:image/jpeg;base64,${lesson.thumbnail}`
                                : book
                            }
                            style={{ width: "100%", height: "100%" }}
                            alt="thumbnail"
                          />
                        </div>
                        <div className="child">
                          <h5 className="courseName">{lesson.lessontitle}</h5>
                          <p className="courseDescription">{lesson.lessonDescription}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
       
            {currentDocs &&
                          currentDocs.length > 0 && (
            <ul className="doclist">
                    <h6><b>Documents</b></h6>
                       
                         { currentDocs.map((doc) => (
                            <li
                            className="doclink"
                              key={doc.id}
                              onClick={() => {
                                navigate(`/viewDocument/${doc.documentPath}/${lessonId}/${doc.id}`);
                              }}
                            >
                              {doc.documentName != null
                                ? doc.documentName
                                : "Document"}
                            </li>
                          ))}
                      </ul>)}
            <div style={{ textAlign: "right",marginTop:"10px" }}>
              {AllLessons.length > 1 && currentLessonIndex > 0 && (
                <button
                  onClick={handlePreviousButtonClick}
                  className="btn btn-primary"
                >
                  Previous
                </button>
              )}
              {currentLessonIndex < AllLessons.length - 1 && (
                <button
                  onClick={handleNextButtonClick}
                  className="btn btn-primary ml-2"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : role === "ADMIN" || role === "TRAINER" ? (
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
        ) : (
          <div>
            <div className="headingandbutton">
              <h1 style={{ textAlign: "center" }}>{courseName}</h1>
             {role==="USER" && <Link
                to={`/test/start/${courseName}/${courseId}`}
                className="btn btn-primary mybtn"
              >
                Start Test
              </Link>}
            </div>
            <div>
              <div className="centerflex">
                <div className="enroll">
                  <h3 className="mt-4">No Lessons Found for {courseName}</h3>

                  <Link to="/dashboard/course" className="btn btn-primary">
                    Go Back
                  </Link>
                </div>
              </div>
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

export default ViewVideo;
