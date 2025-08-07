import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import { GlobalStateContext } from "../Context/GlobalStateProvider";
import course from "../icons/course.svg";
import seats from "../icons/seats.svg";
import students from "../icons/students.svg";
import trainers from "../icons/trainers.svg";
import undraw_profile from "../images/profile.png";
import RadialProgressBar from "./RadialProgressBar";
import SupportChart from "./SupportChart";
const Dashboard = () => {

    const navigate = useNavigate();
    const Currency = sessionStorage.getItem("Currency");
    const Role = sessionStorage.getItem("role");
    const isActiveProfileSAS = sessionStorage.getItem("Activeprofile") === "SAS";
    const MySwal = withReactContent(Swal);
    const token = sessionStorage.getItem("token");
    const [Courses, setCourses] = useState([]);
    const { displayname } = useContext(GlobalStateContext);
    const [storagedetail, setStoragedetail] = useState({
        total: "",
        StorageUsed: "",
        balanceStorage: ""
    })
    const [countdetails, setcountdetails] = useState({
        coursecount: "",
        trainercount: "",
        usercount: "",
        availableseats: "",
        paidcourse: "",
        amountRecived: "",
    });
    const [trainerFest, settrainerFest] = useState([
        { name: '', profile: null, freeCourses: "", paidCourses: "", totalStudents: "" },
    ])
    const [StudentFest, setStudentFest] = useState([
        { name: '', profile: null, freeCourses: "", paidCourses: "", totalStudents: "", pending: "" },
    ])

    const [StudentFestSysAdmin, setStudentFestSysAdmin] = useState([
        { name: '', batchName: "", courseName: "", amount: "" },
    ])
    const [isvalid, setIsvalid] = useState();
    const [isEmpty, setIsEmpty] = useState();

    //need to change
    useEffect(() => {
        if (Role !== "ADMIN") return;
        console.log("called")
        const fetchData = async () => {
            try {
                const response = await axios.get(`${baseUrl}/api/v2/GetAllUser`, {
                    headers: {
                        Authorization: token,
                    },
                });

                if (response.status !== 200) {
                    setIsEmpty(response.data.empty);
                    console.error("Error fetching data:");
                }

                const data = response.data;

                setIsEmpty(data.empty);
                setIsvalid(data.valid);
            } catch (error) {
                console.error("Error fetching data:", error);
                throw error
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (Role !== "ADMIN") return;
        const fetchCounts = async () => {
            try {
                //  /triggerError ===> api to trigger error    

                const response = await axios.get(`${baseUrl}/course/countcourse`, {
                    headers: {
                        Authorization: token,
                    },
                });

                if (response.status === 200) {
                    const data = response.data;
                    setcountdetails(data);
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {

                    navigate("/unauthorized")
                    return;
                }
                // MySwal.fire({
                //   icon: "error",
                //   title: "Some Error Occurred",
                //   text: error.message,
                // });
                throw error
            }
        };
        const fetchstorage = async () => {
            try {
                const resu = await axios.get(`${baseUrl}/dashboard/storage`, {
                    headers: {
                        Authorization: token
                    }
                })
                setStoragedetail(resu.data);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    navigate("/unauthorized")
                    return;
                }
                MySwal.fire({
                    icon: "error",
                    title: "Some Error Occurred",
                    text: error.message,
                });

            }
        }
        const fetchStudentFects = async () => {
            try {
                const res = await axios.get(`${baseUrl}/dashboard/StudentSats`, {
                    headers: {
                        Authorization: token,
                    },
                });
                const data = res.data;
                setStudentFest(data)
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    navigate("/unauthorized")
                    return;
                }
                MySwal.fire({
                    icon: "error",
                    title: "Some Error Occurred",
                    text: error.message,
                });
            }

        }
        const fetchtrainerFetcs = async () => {
            try {
                const res = await axios.get(`${baseUrl}/dashboard/trainerSats`, {
                    headers: {
                        Authorization: token,
                    },
                });
                const data = res.data;
                settrainerFest(data)
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    navigate("/unauthorized")
                    return;
                }
                MySwal.fire({
                    icon: "error",
                    title: "Some Error Occurred",
                    text: error.message,
                });
            }

        }

        fetchCounts();
        fetchtrainerFetcs();
        fetchStudentFects();
        fetchstorage();
    }, []);

    const [admins, setAdmins] = useState([]);
    const [selectedInstitution, setSelectedInstitution] = useState("");
    const [institutionNames, setInstitutionNames] = useState([]);
    
  

    useEffect(() => {
        if (Role !== "SYSADMIN") return;
        const fetchCounts = async () => {
            try {
                let response;
                //  /triggerError ===> api to trigger error    
                if (selectedInstitution === "*" || selectedInstitution === "") {
                response = await axios.get(`${baseUrl}/sysadmin/dashboard`, {
                    headers: {
                        Authorization: token,
                    },
                });
            } else {
                response = await axios.get(
                    `${baseUrl}/sysadmin/dashboard/${selectedInstitution}`,
                    {
                      headers: { Authorization: token },
                    }
                  );
                }
                if (response.status === 200) {
                    const data = response.data;


                    // Set paymentsummary or provide a default empty object if it's not provided.
                    setcountdetails(data.paymentsummary || {});

                    // Set paymentlist or provide a default empty array if it's not provided.
                    setStudentFestSysAdmin(data.paymentlist || []);
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {

                    navigate("/unauthorized")
                    return;
                }
                // MySwal.fire({
                //   icon: "error",
                //   title: "Some Error Occurred",
                //   text: error.message,
                // });
                throw error
            }
        };
        const fetchData = async () => {
            try {
              // Fetch data from server
              const response = await axios.get(`${baseUrl}/ViewAll/Admins`,{
                headers:{
                  Authorization:token
                }
              });
              if (response.data && response.data.content) {
                const adminData = response.data.content;
                setAdmins(adminData);
              // Extract unique institution names
              const names = Array.from(
                new Set(adminData.map((admin) => admin.institutionName).filter(Boolean))
              );
             
              setInstitutionNames(names);

       // If only one institution is available, default to "All Institution" ("*")
       if (names.length === 1) {
        setSelectedInstitution("*");
      }}
            } catch (error) {
              if(error.response && error.response.status===401){
                navigate("/unauthorized")
              }else{
              console.error('Error fetching data:', error);
              throw error
              }
            }
          };
      
          fetchData();
        fetchCounts();
    }, [selectedInstitution]);

    const convertToGB = (value) => {
        if (value.toLowerCase().includes("mb")) {
            // Convert MB to GB
            return parseFloat(value) / 1024;
        } else if (value.toLowerCase().includes("gb")) {
            // Already in GB
            return parseFloat(value);
        }
        return 0; // Default fallback in case of an invalid value
    };
      
    // Convert all values to GB
    const totalGB = convertToGB(storagedetail.total);
    const usedGB = convertToGB(storagedetail.StorageUsed);

    // Calculate percentage of storage used
    const usedPercentage = (usedGB / totalGB) * 100;


    return (
        Role != "SYSADMIN" ?
            <>
                <div className="page-header">
                    <div className="page-block">
                        <div className="row align-items-center">
                            <div className="col-md-12">
                                <div className="page-header-title">
                                    <h5 className="m-b-10">Dashboard </h5>
                                </div>
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="#" onClick={() => { navigate("/admin/dashboard") }}><i className="feather icon-home"></i></a></li>
                                    <li className="breadcrumb-item"><a href="#">Dashboard </a></li>
                                </ul>
                                {!isvalid && (
                                    <div className="marquee-container">
                                        <div className="marquee-content">
                                            <a onClick={() => { navigate("/licenceDetails") }} href="#" style={{ color: "darkred" }}>
                                                License has been expired Need to uploard new License or contact
                                                "+91 9566191759"
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-7 col-md-12">
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="card support-bar overflow-hidden">
                                    <div className="card-body pb-0">
                                        <h2 className="m-0"> <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign" : "fa-solid fa-dollar-sign"}></i> {countdetails.amountRecived}</h2>
                                        <span className="text-c-blue">Total Course Revenue</span>
                                        <p className="mb-3 mt-3">Total number of courses calculated amount.</p>
                                    </div>
                                    <div id="support-chart">

                                        <SupportChart data={[0, countdetails.paidcourse, countdetails.trainercount, countdetails.coursecount, 0]} />
                                    </div>
                                    <div className="card-footer bg-primary text-white">
                                        <div className="row text-center">
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.paidcourse}</h5>
                                                <span>Paid</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.trainercount}</h5>
                                                <span>Trainers</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.coursecount}</h5>
                                                <span>Courses</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="card support-bar overflow-hidden">
                                    <div className="card-body pb-0">
                                        <h2 className="m-0">Storage</h2>
                                        <span className="text-c-green">Total Storage</span>
                                        <p className="mb-3 mt-3">Number of Video Space Graph</p>
                                    </div>

                                    <div className="radial-bar" >
                                        <RadialProgressBar percentage={usedPercentage} total={storagedetail.total} /></div>
                                    <div className="card-footer bg-success text-white">
                                        <div className="row text-center">
                                            <div className="col">
                                                <h5 className="m-0 text-white">{storagedetail.total}</h5>
                                                <span>Total Space</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{storagedetail.StorageUsed}</h5>
                                                <span>used</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{storagedetail.balanceStorage}</h5>
                                                <span>Available </span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5 col-md-12">
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-yellow">{countdetails.availableseats}</h4>
                                                <h6 className="text-muted m-b-0">Seats</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={seats} alt="seats" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-yellow">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Available Seats</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6" style={{ cursor: "pointer" }} onClick={() => { navigate("/dashboard/course") }}>
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-green">{countdetails.coursecount}</h4>
                                                <h6 className="text-muted m-b-0">Courses</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={course} alt="course Icon" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-green">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total Courses</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ cursor: "pointer" }} onClick={() => { navigate("/view/Students") }} className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-red">{countdetails.usercount}</h4>
                                                <h6 className="text-muted m-b-0">{displayname && displayname.student_name
                                                    ? displayname.student_name
                                                    : "Student"}</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={students} alt="students" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-red">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total {displayname && displayname.student_name
                                                    ? displayname.student_name
                                                    : "Student"}</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ cursor: "pointer" }} onClick={() => { navigate("/view/Trainer") }} className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-blue">{countdetails.trainercount}</h4>
                                                <h6 className="text-muted m-b-0">{displayname && displayname.trainer_name
                                                    ? displayname.trainer_name
                                                    : "Trainer"}</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={trainers} alt="trainers" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-blue">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total {displayname && displayname.trainer_name
                                                    ? displayname.trainer_name
                                                    : "Trainer"}</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-6 col-md-12">
                        <div className="card table-card ">
                            <div className="card-header">
                                <h5>Trainers</h5>

                            </div>
                            <div className="card-body p-0 listviewDashboard">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>

                                                    Name
                                                </th>
                                                <th>Paid Courses</th>
                                                <th>Free Courses</th>
                                                <th className="text-right">Students</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trainerFest.map((trainer, index) => (
                                                <tr key={index}>
                                                    <td>

                                                        <div className="d-inline-block align-middle">
                                                            <img src={trainer.profile !== null ? `data:image/jpeg;base64,${trainer.profile}` : undraw_profile}
                                                                alt="user"
                                                                className="img-radius wid-40 align-top m-r-15" />
                                                            <div className="d-inline-block">
                                                                <h6>{trainer.name || ""}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{trainer.paidCourses || 0}</td>
                                                    <td>{trainer.freeCourses || 0}</td>
                                                    <td className="text-right">{trainer.students || 0}</td>
                                                </tr>))}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-6 col-md-12 ">
                        <div className="card table-card ">
                            <div className="card-header">
                                <h5>Students</h5>

                            </div>
                            <div className="card-body p-0 listviewDashboard">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>

                                                    Name
                                                </th>
                                                <th>paid Coures</th>
                                                <th>Free Courses</th>
                                                <th className="text-right">Pending Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {StudentFest.map((Student, index) => (
                                                <tr key={index}>
                                                    <td>

                                                        <div className="d-inline-block align-middle">
                                                            <img src={Student.profile !== null ? `data:image/jpeg;base64,${Student.profile}` : undraw_profile}
                                                                alt="user"
                                                                className="img-radius wid-40 align-top m-r-15" />
                                                            <div className="d-inline-block">
                                                                <h6>{Student.name || ""}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{Student.paidCourses || 0}</td>
                                                    <td>{Student.freeCourses || 0}</td>
                                                    <td className="text-right">{Student.pending || 0}</td>
                                                </tr>))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
            : <>
                <div className="page-header">
                    <div className="page-block">
                        <div className="row align-items-center">
                            <div className="col-md-12">
                               
                            <div className="page-header-title d-flex align-items-center justify-content-between">
  <h5 className="m-b-10">Dashboard</h5>
  {institutionNames.length >1?
  <select
    id="institution-dropdown"
    value={selectedInstitution}
    onChange={(e) => setSelectedInstitution(e.target.value)}
    className="form-control"
    style={{ maxWidth: "250px",color: "black",backgroundColor: "#fff" }}  // optional: limit width
  >
    <option value="*"> All Institution</option>
    {institutionNames.map((inst, index) => (
      <option key={index} value={inst}>
        {inst}
      </option>
    ))}
  </select>:<div></div>}
</div>
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="#" onClick={() => { navigate("/admin/dashboard") }}><i className="feather icon-home"></i></a></li>
                                    <li className="breadcrumb-item"><a href="#">Dashboard </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-6 col-md-12">
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="card support-bar overflow-hidden" style={{ height: "96%" }}>
                                    <div className="card-body pb-0">
                                        <h2 className="m-0"> <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign" : "fa-solid fa-dollar-sign"}></i> {countdetails.amountRecived}</h2>
                                        <span className="text-c-blue">Total Course Revenue</span>
                                        <p className="mb-3 mt-3">Total number of courses calculated amount.</p>

                                    </div>
                                    <div id="support-chart">

                                        <SupportChart data={[0, countdetails.paidcourse, countdetails.trainercount, countdetails.coursecount, 0]} />
                                    </div>
                                    <div className="card-footer bg-primary text-white">
                                        <div className="row text-center">
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.paidcourse}</h5>
                                                <span>Paid Courses</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.trainercount}</h5>
                                                <span>Trainers</span>
                                            </div>
                                            <div className="col">
                                                <h5 className="m-0 text-white">{countdetails.coursecount}</h5>
                                                <span>Courses</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="col-sm-6">
                        <div className="card support-bar overflow-hidden">
                            <div className="card-body pb-0">
                                <h2 className="m-0">Storage</h2>
                                <span className="text-c-green">Total Storage</span>
                                <p className="mb-3 mt-3">Number of Video Space Graph</p>
                            </div>
                            
                            <div className="radial-bar2" > 
                                <div className="innerradial-bar">
                            <RadialProgressBar percentage={usedPercentage} total={storagedetail.total}/></div>
                            </div>
                            <div className="card-footer bg-success text-white">
                                <div className="row text-center">
                                    <div className="col">
                                        <h5 className="m-0 text-white">{storagedetail.total}</h5>
                                        <span>Total Space</span>
                                    </div>
                                    <div className="col">
                                        <h5 className="m-0 text-white">{storagedetail.StorageUsed}</h5>
                                        <span>used</span>
                                    </div>
                                    <div className="col">
                                        <h5 className="m-0 text-white">{storagedetail.balanceStorage}</h5>
                                        <span>Available </span>
                                    </div>
                             
                                </div>
                            </div>
                        </div>
                    </div> */}
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12">
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-yellow">{countdetails.availableseats}</h4>
                                                <h6 className="text-muted m-b-0">Seats</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={seats} alt="seats" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-yellow">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Available Seats</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6" 
                            // style={{ cursor: "pointer" }} onClick={() => {isActiveProfileSAS?navigate("/dashboard/course"):navigate("/dashboard/course") }}
                             >
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-green">{countdetails.coursecount}</h4>
                                                <h6 className="text-muted m-b-0">Courses</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={course} alt="course Icon" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-green">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total Courses</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ cursor: "pointer" }} onClick={() => { navigate("/viewAll/Students") }} className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-red">{countdetails.usercount}</h4>
                                                <h6 className="text-muted m-b-0">{displayname && displayname.student_name
                                                    ? displayname.student_name
                                                    : "Student"}</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={students} alt="students" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-red">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total {displayname && displayname.student_name
                                                    ? displayname.student_name
                                                    : "Student"}</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ cursor: "pointer" }} onClick={() => {navigate("/viewAll/Trainers") }} className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-8">
                                                <h4 className="text-c-blue">{countdetails.trainercount}</h4>
                                                <h6 className="text-muted m-b-0">{displayname && displayname.trainer_name
                                                    ? displayname.trainer_name
                                                    : "Trainer"}</h6>
                                            </div>
                                            <div className="col-4 text-right">
                                                <img src={trainers} alt="trainers" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-c-blue">
                                        <div className="row align-items-center">
                                            <div className="col-9">
                                                <p className="text-white m-b-0">Total {displayname && displayname.trainer_name
                                                    ? displayname.trainer_name
                                                    : "Trainer"}</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="col-xl-6 col-md-12">
                <div className="card table-card ">
                    <div className="card-header">
                        <h5>Trainers</h5>
                      
                    </div>
                    <div className="card-body p-0 listviewDashboard">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>
                                           
                                            Name
                                        </th>
                                        <th>Paid Courses</th>
                                        <th>Free Courses</th>
                                        <th className="text-right">Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {trainerFest.map((trainer,index) => (
          <tr key={index}>
                                        <td>
                                           
                                            <div className="d-inline-block align-middle">
                                                <img src={trainer.profile!==null ? `data:image/jpeg;base64,${trainer.profile}`:undraw_profile} 
                                                alt="user"
                                                 className="img-radius wid-40 align-top m-r-15"/>
                                                <div className="d-inline-block">
                                                    <h6>{trainer.name || ""}</h6>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{trainer.paidCourses || 0}</td>
                                        <td>{trainer.freeCourses || 0}</td>
                                        <td className="text-right">{trainer.students||0}</td>
                                    </tr>))}
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div> */}
                    <div className="col-xl-12 col-md-12 ">
                        <div className="card table-card ">
                            <div className="card-header">
                                <h5>Students</h5>

                            </div>
                            <div className="table-wrapper" style={{ border: "1px solid #ddd", borderRadius: "5px" }}>

                                {/* Table Header (Fixed) */}
                                <table className="table table-hover mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                                    <thead style={{ position: "sticky", top: "0", background: "#fff", zIndex: "10" }}>
                                        <tr>
                                            <th style={{ width: "25%", height: "60px", overflow: "hidden" }}>Name</th>
                                            <th style={{ width: "25%", height: "60px", overflow: "hidden" }}>Batch</th>
                                            <th style={{ width: "25%", height: "60px", overflow: "hidden" }}>Courses</th>
                                            <th style={{ width: "25%", height: "60px", overflow: "hidden" }} className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                </table>

                                {/* Scrollable Table Body */}
                                <div
                                    style={{
                                        maxHeight: "400px",
                                        overflowY: "auto",
                                        scrollbarWidth: "thin", /* Firefox */
                                        scrollbarColor: "#888 #f1f1f1", /* Firefox */
                                    }}
                                    className="custom-scrollbar"
                                >
                                    <table className="table table-hover mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                                        <tbody>
                                            {StudentFestSysAdmin.map((Student, index) => (
                                                <tr key={index} style={{ height: "60px" }}>
                                                    <td style={{
                                                        width: "25%",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }} title={Student.name}>
                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            <img
                                                                src={Student.profile ? `data:image/jpeg;base64,${Student.profile}` : undraw_profile}
                                                                alt="user"
                                                                className="img-radius wid-40 align-top m-r-15"
                                                                style={{ height: "40px", width: "40px", objectFit: "cover", borderRadius: "50%" }}
                                                            />
                                                            <div style={{ marginLeft: "10px" }}>
                                                                <h6 style={{ margin: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    {Student.name || ""}
                                                                </h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{
                                                        width: "25%",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }} title={Student.batchName}>
                                                        {Student.batchName || 0}
                                                    </td>
                                                    <td style={{
                                                        width: "25%",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }} title={Student.courseName}>
                                                        {Student.courseName || 0}
                                                    </td>
                                                    <td style={{
                                                        width: "25%",
                                                        textAlign: "right",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }} title={Student.amount}>
                                                        {Student.amount || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                            </div>







                            {/* <div className="card-body p-0 listviewDashboard"> */}
                            {/* <div className="table-responsive"> */}
                            {/* <table className="table table-hover mb-0">
                                <thead >
                                    <tr>
                                        <th>
                                           
                                            Name
                                        </th>
                                        <th>Batch</th>
                                        <th>Courses</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {StudentFestSysAdmin.map((Student,index) => (
          <tr key={index}>
                                        <td>
                                           
                                            <div className="d-inline-block align-middle">
                                                <img src={Student.profile ? `data:image/jpeg;base64,${Student.profile}` : undraw_profile}
                                                alt="user"
                                                 className="img-radius wid-40 align-top m-r-15"/>
                                                <div className="d-inline-block">
                                                    <h6>{Student.name || ""}</h6>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{Student.batchName || 0}</td>
                                        <td>{Student.courseName || 0}</td>
                                        <td className="text-right">{Student.amount||0}</td>
                                    </tr>))}
                                </tbody>
                            </table> */}
                            {/* </div> */}
                            {/* </div> */}
                        </div>
                    </div>
                </div>
            </>
    );
};

export default Dashboard;
