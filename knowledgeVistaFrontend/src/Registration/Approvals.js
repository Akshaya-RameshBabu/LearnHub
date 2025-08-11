import React, { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from "../api/utils";
import axios from "axios";

const Approvals = () => {
  const MySwal = withReactContent(Swal);
  const [users, setUsers] = useState([]);
  const token = sessionStorage.getItem("token");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const [filterOption, setFilterOption] = useState("All");
  const[loading,setloading]=useState(false)
  const [searchQuery, setSearchQuery] = useState("");
  const itemsperpage = 10;
  const [datacounts, setdatacounts] = useState({
    start: "",
    end: "",
    total: "",
  });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [skills, setSkills] = useState("");
  const[role,setrole]=useState("")
  const [fullsearch, setfullsearch] = useState(false);
  // Function to call the search API
  const searchUsers = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/Institution/search/Approvals`,
        {
          headers: {
            Authorization: token,
          },
          params: {
           
            username: encodeURIComponent(username),
        email: encodeURIComponent(email),
        phone: encodeURIComponent(phone),
        dob: encodeURIComponent(dob),
        skills: encodeURIComponent(skills),
            role,
            page: currentPage,
            size: 10,
          },
        }
      );

      if (response.status === 200) {
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Function to handle changes and call search
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === "") {
      fetchData();
    }
    switch (name) {
      case "username":
        setUsername(value);
        break;
      case "dob":
        setDob(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break;

      case "skills":
        setSkills(value);
        break;
       case "role":
        setrole(value)
      default:
        break;
    }
  };
  useEffect(() => {
    // Call searchUsers whenever any of the dependencies change
    searchUsers();
  }, [username, email, phone, dob, skills,role, currentPage]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from server
        setloading(true)
        const response = await axios.get(`${baseUrl}/view/Approvals`, {
          headers: {
            Authorization: token,
          },
        });
        const data = response.data;
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setdatacounts((prev) => ({
          start: currentPage * itemsperpage + 1,
          end: currentPage * itemsperpage + itemsperpage,
          total: data.totalElements,
        }));
        setdatacounts((prev) => ({
          start: currentPage * itemsperpage + 1,
          end: currentPage * itemsperpage + itemsperpage,
          total: data.totalElements,
        }));
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/unauthorized")
        }
        console.error("Error fetching data:", error);
      }finally{
        setloading(false)
      }
    };

    fetchData();
  }, []);
  const RejectUser=async(id)=>{
    try{
      MySwal.fire({
        title: "Reject User?",
      text: "By rejecting, the user will be deleted. Are you sure you want to reject the user?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
    }).then(async (result) => {
      if(result.isConfirmed){
const response=await axios.post(`${baseUrl}/Reject/User/${id}`,{}, {
  headers: {
    Authorization: token,
  },
    });
MySwal.fire({
  title:"Rejected",
  icon:"success",
  text:"user Rejected Successfully"
}).then(()=>{
  fetchData();
})
      }else{
        return
      }
    })
    }catch(error){
console.log(error)
    }
  
  }
  const ApproveUser=async(id)=>{
    try{
      MySwal.fire({
        title: "Approve User?",
        text: `Are you sure you want to Approve The User?`,
        icon: "warning",
        showCancelButton: true,
       
        confirmButtonText: "Approve",
        cancelButtonText: "Cancel",
    }).then(async (result) => {
const response=await axios.post(`${baseUrl}/approve/User/${id}`,{}, {
  headers: {
    Authorization: token,
  },
    });
MySwal.fire({
  title:"Approved",
  icon:"success",
  text:"user Approved Successfully"
}).then(()=>{
  fetchData();
})
    })
    }catch(error){
console.log(error)
    }
  }
  const fetchData = async (page = 0) => {
    try {
      setloading(true)
      const response = await axios.get(`${baseUrl}/view/Approvals`, {
        headers: { Authorization: token },
        params: { pageNumber: page, pageSize: itemsperpage },
      });

      const data = response.data;
      setUsers(data.content); // Update users with content from pageable
      setTotalPages(data.totalPages);
      setdatacounts((prev) => ({
        start: currentPage * itemsperpage + 1,
        end: currentPage * itemsperpage + itemsperpage,
        total: data.totalElements,
      })); // Update total pages
      setdatacounts((prev) => ({
        start: currentPage * itemsperpage + 1,
        end: currentPage * itemsperpage + itemsperpage,
        total: data.totalElements,
      }));
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/unauthorized")
      }
      console.error("Error fetching data:", error);
    }finally{
      setloading(false)
    }
  };

  useEffect(() => {
    fetchData(currentPage); // Fetch data when the page or other dependencies change
  }, [currentPage, filterOption, searchQuery]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const filterData = () => {
    if (filterOption === "All") {
      return users;
    } else if (filterOption === "Active") {
      return users.filter((user) => user.isActive === true);
    } else if (filterOption === "Inactive") {
      return users.filter((user) => user.isActive === false);
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
  return (
    <div>
      <div className="page-header">
      <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <div className="page-header-title">
                <h5 className="m-b-10">Settings </h5>
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
                  <a href="#">
                   Approvals
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
              <div className="navigateheaders ">
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
              <div className="tableheader ">
                <h4> Approval list</h4>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="table table-hover table-bordered table-sm">
                    <thead className="thead-dark">
                      <tr>
                        <th scope="col">
                          <i
                            onClick={() => {
                              setfullsearch(!fullsearch);
                            }}
                            className={
                              fullsearch
                                ? "fa-solid fa-xmark"
                                : "fa-solid fa-magnifying-glass"
                            }
                          ></i>
                        </th>
                        <th scope="col">Username</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col"> Skills</th>

                        <th scope="col">Date of Birth</th>
                        <th scope="col">Role</th>

                        <th className="text-center" colSpan="2" scope="col">
                          Action
                        </th>
                      </tr>
                      {fullsearch ? (
                        <tr>
                          <td></td>

                          <td className="padnone">
                            <input
                              type="search"
                              name="username"
                              value={username}
                              onChange={handleChange}
                              placeholder="Search Username"
                            />
                          </td>
                          <td className="padnone">
                            <input
                              type="search"
                              name="email"
                              value={email}
                              onChange={handleChange}
                              placeholder="Search Email"
                            />
                          </td>

                          <td className="padnone">
                            <input
                              type="search"
                              name="phone"
                              value={phone}
                              onChange={handleChange}
                              placeholder="Search Phone"
                            />
                          </td>
                          <td className="padnone">
                            <input
                              type="search"
                              name="skills"
                              value={skills}
                              onChange={handleChange}
                              placeholder="Search Skills"
                            />
                          </td>
                          <td>
                            <div ></div>
                          </td>
                        </tr>
                      ) : (
                        <></>
                      )}
                    </thead>
                      {loading?(  
                      
                       <div className="outerspinner active"><div className="spinner"></div></div>
         ):(
                    <tbody>
                      {filterData().map((user, index) => (
                        <tr key={user.userId}>
                          <th scope="row">
                            {currentPage * itemsperpage + (index + 1)}
                          </th>
                          <td className="py-2">{user.username}</td>
                          <td className="py-2">
                            <Link
                              to={`/view/Trainer/profile/${user.email}`}
                              state={{ user }}
                            >
                              {user.email}
                            </Link>
                          </td>
                          <td className="py-2">{user.phone}</td>

                          <td className="py-2">{user.skills}</td>
                          <td className="py-2">{user.dob}</td>
                          <td className="py-2">{user.roleName}</td>

                          <td className="text-center padnone">
                           
                              <button
                                type="button"
                                onClick={()=>{ApproveUser(user.userId)}}
                                className="btn  btn-icon btn-success"
                                title="Approve User"
                              >
                                <i className="feather icon-check-circle"></i>
                              </button>
                          </td>
                          <td className="text-center padnone">
                           
                              <button
                                type="button"
                                title="Reject User"
                                onClick={()=>{RejectUser(user.userId)}}
                                className="btn  btn-icon btn-danger"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
         )}
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
                    ( {datacounts.start}- { datacounts.start + users.length-1 }) of {datacounts.total}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approvals;
