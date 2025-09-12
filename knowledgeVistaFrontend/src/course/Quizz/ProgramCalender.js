import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../../api/utils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const ProgramCalender = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [event, setevent] = useState([]);
  const [submitting, setsubmitting] = useState(false);
  const MySwal = withReactContent(Swal);
  const[loading,setloading]=useState(false);
    const itemsperpage = 10;
    const [datacounts, setdatacounts] = useState({
      start: "",
      end: "",
      total: "",
    });
    
      const [currentPage, setCurrentPage] = useState(0);
      const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setloading(true);
        const response = await axios.get(`${baseUrl}/Events/Get?pageNumber=${currentPage+1}&pageSize=${itemsperpage}`, {
          headers: {
            Authorization: token,
          },
        });
        console.log(response.data);
        setevent(response?.data?.events);
        const totalCount = response?.data?.totalCount || 0;

      setTotalPages(Math.ceil(totalCount / itemsperpage));

     const start= currentPage * itemsperpage + 1
      const end= currentPage * itemsperpage + itemsperpage

      setdatacounts({
        start,
        end,
        total: totalCount,
      });
      } catch (err) {
        console.log(err);
      }finally{
        setloading(false);
      }
    };
    fetchEvents();
  }, [currentPage]);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    for (let i = 0; i < totalPages; i++) {
      buttons.push(
        <li
          className={`page-item ${i === currentPage ? "active" : ""}`}
          key={i}
        >
          <a className="page-link" href="#" onClick={() => handlePageChange(i)}>
            {i + 1}
          </a>
        </li>
      );
    }
    return buttons;
  };
  const handlClickJoinUrl = async (id) => {
    try {
      const response = await axios.get(`${baseUrl}/api/zoom/Join/${id}`, {
        headers: {
          Authorization: token,
        },
      });

      console.log(response.data);
      if (
        typeof response.data === "string" &&
        response.data.startsWith("http")
      ) {
        window.open(response.data, "_blank");
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        MySwal.fire({
          title: "Meeting Not Started",
          text: "This meeting was not Started Yet. Please try again later.!",
          icon: "info",
        });
      } else {
        console.error(error);
        // Optionally, show an error message
        // MySwal.fire('Error!', 'An error occurred while deleting the meeting.', 'error');
        throw error;
      }
    }
  };
  const handleStart=(item)=>{
if(item?.type==="MTEST"){
  navigate(`/ModuleTest/${item.title}/${item.quizzid}/${item.batchName}/${item.batchid}`);
}else if(item.type==="QUIZZ"){
  navigate(`/Quizz/${item.title}/${item.quizzid}/${item.batchName}/${item.batchid}`);
}
  }
  return (
    <div>
      <div className="page-header"></div>
      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-header">
              <div className="navigateheaders" style={{ margin: "2px" }}>
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
              {submitting && (
                <div className="outerspinner active">
                  <div className="spinner"></div>
                </div>
              )}
              <div className="headingandbutton">
                <h4 style={{ margin: "0px" }}>Program Calender</h4>
              </div>
              <div className="table-container mt-2">
                <table className="table table-hover  table-bordered table-sm">
                  <thead className="thead-dark">
                    <tr>
                      <th scope="col" style={{ width: "50px" }}>
                        #
                      </th>
                      <th scope="col">Title</th>
                      <th scope="col">Schedule </th>
                      <th scope="col">Batch</th>
                      <th scope="col">Action</th>
                      
                    </tr>
                  </thead>
                   {loading? (  <div className="outerspinner active">
                <div className="spinner"></div>
            </div>):
                  <tbody>
  {Array.isArray(event) &&
    event.map((item, index) => {
      if (item.type === "MEET") {
        return (
          <tr key={index}>
             <th scope="row">
                          {currentPage * itemsperpage + (index + 1)}
                        </th>
            <td>
              <i className="fa-solid fa-display text-primary mr-2"></i>
              {item.title}
            </td>
            <td>
  {item.startTime && !isNaN(new Date(item.startTime)) ? (
    <>
      {new Date(item.startTime).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}{" "}
      {new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}{" "}
      ({item.duration} min)
    </>
  ) : (
    "Invalid Date/Time"
  )}
</td>

            <td>{item.batchName}</td>
            <td>
              <button className="btn btn-success" onClick={() => handlClickJoinUrl(item.meetingId)}>
                Join &nbsp;
              </button>
            </td>
          </tr>
        );
      } else {
        return (
          <tr key={index}>
            <th scope="row">
                          {currentPage * itemsperpage + (index + 1)}
                        </th>
            <td>
              <i className="fa-regular fa-circle-question mr-2"></i>
              {item.title}
            </td>
            
            <td>
  {item.quizzDate && !isNaN(new Date(item.quizzDate)) ? (
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(item.quizzDate))
  ) : (
    "Invalid Date"
  )}
 &nbsp;({Math.floor(item.duration / 60)} hr {item.duration % 60} min)
</td>


            <td>{item.batchName}</td>
            <td>
              <button className="btn btn-success" onClick={()=>{handleStart(item)}}>Start</button>
              {item.status?<i className="fa-regular fa-circle-check pl-2"></i>:""}
            </td>
          </tr>
        );
      }
    })}
</tbody>}

                </table>
              </div>
              <div className="cornerbtn">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 0 ? "disabled" : ""
                    }`}
                    key="prev"
                  >
                    <a
                      className="page-link"
                      href="#"
                      aria-label="Previous"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <span aria-hidden="true">«</span>
                      <span className="sr-only">Previous</span>
                    </a>
                  </li>
                  {renderPaginationButtons()}
                  <li
                    className={`page-item ${
                      currentPage === totalPages - 1 ? "disabled" : ""
                    }`}
                    key="next"
                  >
                    <a
                      className="page-link"
                      href="#"
                      aria-label="Next"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <span aria-hidden="true">»</span>
                      <span className="sr-only">Next</span>
                    </a>
                  </li>
                </ul>
                <div>
                  <label className="text-primary">
                    ( {datacounts.start}- {datacounts.start + event.length - 1})
                    of {datacounts.total}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCalender;
