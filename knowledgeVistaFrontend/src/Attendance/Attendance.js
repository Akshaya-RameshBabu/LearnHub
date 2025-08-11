import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import baseUrl from '../api/utils';
import { GlobalStateContext } from '../Context/GlobalStateProvider';
const Attendance = () => {
  const { paramBatchId } = useParams();
   const { displayname } = useContext(GlobalStateContext);
   const[batchId,setbatchId]=useState(null);
       const[batches,setbatches]=useState([{
         id:"",
         name:"",
         type:""
       }])
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState( location.state?.user);
  const [datacounts, setdatacounts] = useState({
      start: "",
      end: "",
      total: "",
    });
  const token = sessionStorage.getItem('token');
  const [attendance, setAttendance] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // To handle pagination
  const [totalPages, setTotalPages] = useState(0); // To handle the total pages
   const itemsperpage=10
 const [percentage,setpercentage]=useState(0);
 const fetchBatches = async () => {
  try {
    const response = await axios.get(`${baseUrl}/view/batch/${user.email}`, {
      headers: {
        Authorization: token,
      }
    });
    if (response?.status == 200) {
      let batchList = response.data;
      
      if (paramBatchId  ) {
        batchList = batchList.filter(batch => String(batch.id) === paramBatchId);

        setbatchId(Number(paramBatchId));
        setbatches(batchList); 
      } else if (batchList.length > 0) {

        setbatches(batchList); 
        setbatchId(batchList[0].id);
      }
    }

  } catch (err) {
    console.log(err);
  }
};
 useEffect(() => {
    fetchBatches();
  }, [location]);
  const fetchAttendanceForUser = async () => {
    try {
      if(!batchId){
        return
      }
      const res = await axios.get(`${baseUrl}/view/StudentAttendance/${user.userId}/${batchId}?page=${currentPage}&size=${itemsperpage}`, {
        headers: {
          Authorization: token
        }
      });
      
      if (res.status === 200) {
        const attedancegot=res?.data?.attendance;
        setAttendance(attedancegot?.content); // Assuming 'content' is the list of attendance
        setTotalPages(attedancegot?.totalPages); // Get total pages for pagination
        setpercentage(res?.data?.percentage);
        setdatacounts(() => ({
          start: currentPage * itemsperpage + 1,
          end: currentPage * itemsperpage + itemsperpage,
          total: attedancegot?.totalElements,
        }));
      }
      if (res.status === 204) {
        navigate("/notFound");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/unauthorized");
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    fetchAttendanceForUser();
  }, [currentPage,batchId,location]); // Fetch attendance every time currentPage changes

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
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
  const handleStatusChange = async (event,item) => {
    const newStatus = event.target.value;
    try {
      await axios.post(
        `${baseUrl}/update/attendance`,
        null, // No body, using params instead
        {
          params: {
            Id: item.id,
            status: newStatus,
          },
          headers: {
            Authorization: token,
          },
        }
      );
 fetchAttendanceForUser();
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };


  return (
    <div>
      <div className="page-header">
      <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Attendance </h5>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a
                    href="#"
                    onClick={() => {
                      navigate("/admin/dashboard");
                    }}
                    title="dashboard"
                  >
                    <i className="feather icon-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#" onClick={()=>{navigate("/view/Students")}}>
                    {" "}
                    {displayname && displayname.student_name
                      ? displayname.student_name
                      : "Student"}{" "}
                    Details{" "}
                  </a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#" >
                    Attendance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-header">
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
              <div className="tableheader2 ">
                <h4>Attendance</h4>
                <select 
  className="selectstyle btn btn-success text-left has-ripple" 
  value={batches.some(batch => batch.id === batchId) ? batchId : ""}
  onChange={(e) => {
    const selectedValue = e.target.value;
    setbatchId(selectedValue ? Number(selectedValue) : null);
  }}
>
  <option value="" disabled className="bg-light text-dark">
    Select a Batch
  </option>
  {batches.map((batch) => (
    <option className="bg-light text-dark" key={batch.id} value={batch.id}>
      {batch.name}
    </option>
  ))}
</select>

              </div>{" "}
              <div className="detailstab">
                <div>
                  <h6>Name :</h6> <label>{user?.username}</label>
                </div>
                <div>
                  <h6>Email :</h6>
                  <label>{user?.email}</label>
                </div>
                <div>
                  <h6>Contact No :</h6>
                  <label>{user?.phone}</label>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table className="table table-hover table-bordered table-sm">
                  <thead className="thead-dark">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Session</th>
                      <th scope="col">Date</th>
                      <th scope="col"> Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance?.map((item, index) => (
                      <tr key={index}>
                        <th> {currentPage * itemsperpage + (index + 1)}</th>
                        <td className="py-2"> {item.topic}</td>
                        <td className="py-2"> {item.date}</td>
                        <td className="py-2"> <select
        className="btn btn-light"
        style={{width:"100%"}}
        value={item.status}
        onChange={(e)=>{handleStatusChange(e,item)}}
      >
        <option value="PRESENT">PRESENT</option>
        <option value="ABSENT">ABSENT</option>
      </select></td>
                      </tr>
                    ))}
                  </tbody>
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
                    ( {datacounts.start}- {datacounts.start + attendance.length - 1})
                    of {datacounts.total}
                  </label>
                </div>
              </div>
              <h5 className='text-right'><label className='text-primary'>Total Attendance : {percentage}%</label></h5>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
