import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from 'react-router-dom';
import baseUrl from '../api/utils';
import axios from 'axios';
const ViewTrainers = () => {
  const navigate=useNavigate();
  const MySwal = withReactContent(Swal);
    const [users, setUsers] = useState([]);
    const token=sessionStorage.getItem("token");
    const userRole = sessionStorage.getItem('role');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const[searchQueryInstitution,setSearchQueryInstitution]=useState('');
    const [filterOption, setFilterOption] = useState("All");
    const [searchQuery, setSearchQuery] = useState('');
    const itemsperpage=10;
    const [datacounts,setdatacounts]=useState({
      start:"",
      end:"",
      total:"",
    })
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [skills, setSkills] = useState('');
   const [fullsearch,setfullsearch]=useState(false);
   
  
    // Function to call the search API
    const searchUsers = async () => {
      try {
        const response = await axios.get(`${baseUrl}/trainer/search`, {
          headers:{
            'Authorization':token
        },
          params: {
           
            username: encodeURIComponent(username),
        email: encodeURIComponent(email),
        phone: encodeURIComponent(phone),
        dob: encodeURIComponent(dob),
        skills: encodeURIComponent(skills),
            institutionName,
            page:currentPage,
            size:10
          }
        });
        if(response.status===200){
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages);
        }
      } catch (error) {
        throw error
        console.error('Error fetching users:', error);
      }
    };
  
    // Function to handle changes and call search
    const handleChange = (e) => {
      const { name, value } = e.target;
      if(value===""){
        fetchData()
      }
      switch (name) {
        case 'username':
          setUsername(value);
          break;
          case 'dob':
            setDob(value);
            console.log(dob);
            break;
        case 'email':
          setEmail(value);
          break;
        case 'phone':
          setPhone(value);
          break
          case 'institutionName':
            setInstitutionName(value);
            break;
          case 'skills':
            setSkills(value);
            break;
         
          default:
            break;
        }
      };
      useEffect(() => {
        // Call searchUsers whenever any of the dependencies change
        searchUsers();
      }, [username, email, phone, dob, institutionName, skills, currentPage]);
    
  const filterData = () => {
    if (filterOption === "All") {
      return users;
    } else if (filterOption === "Active") {
      return users.filter(user => user.isActive === true);
    }else if (filterOption === "Inactive") {
      return users.filter(user => user.isActive === false);
    }
  };
    useEffect(() => {
        // Simulating fetching data from the server
        const fetchData = async () => {
          try {
            // Fetch data from server
            const response = await axios.get(`${baseUrl}/ViewAll/Trainers`,{
              headers:{
                Authorization:token
              }
            });
            const data = response.data;
            setUsers(data.content); 
             setTotalPages(data.totalPages);
            setdatacounts((prev)=>({
               start:currentPage * itemsperpage + 1,
               end:currentPage * itemsperpage + itemsperpage,
               total:data.totalElements,
             }));
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
      }, []);
      const fetchData = async (page = 0) => {
        try {
          const response = await axios.get(`${baseUrl}/ViewAll/Trainers`, {
            headers: { Authorization: token },
           params: { pageNumber: page, pageSize: itemsperpage } 
        });
        
          const data = response.data;
          setUsers(data.content); // Update users with content from pageable
           setTotalPages(data.totalPages);
            setdatacounts((prev)=>({
               start:currentPage * itemsperpage + 1,
               end:currentPage * itemsperpage + itemsperpage,
               total:data.totalElements,
             })); // Update total pages
        } catch (error) {
          if (error.response && error.response.status === 401) {
            navigate("/unauthorized")
          }else{
          console.error('Error fetching data:', error);
          throw error
          }
        }
      };
    
      useEffect(() => {
        fetchData(currentPage); // Fetch data when the page or other dependencies change
      }, [currentPage, filterOption, searchQuery]);
    
      const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
      };
    
     const renderPaginationButtons = () => {
        const buttons = [];
        for (let i = 0; i < totalPages; i++) {
          buttons.push(
            <li className={`page-item ${i === currentPage ? "active" : ""}`} key={i}>
              <a
                className="page-link"
                href="#"
                onClick={() => handlePageChange(i)}
              >
                {i + 1}
              </a>
            </li>
          );
        }
                return buttons;
      };
      const handleDelete=async(username,email)=>{
        MySwal.fire({
            title: "Delete Trainer ?",
            text: `Are you sure you want to Delete Trainer ${username}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                if (email != null) {
                  const response = await axios.delete(`${baseUrl}/secret/Delete/Trainer/${email}`,{
                  
                    headers: {
                      'Authorization': token
                    }
                  });
                  if (response.status===200) {
                    MySwal.fire({
                      title: "Deleted",
                      text: `Trainer ${username} Deleted successfully`,
                      icon: "success",
                      confirmButtonText: "OK",
                  }).then(() => {
                      fetchData();
                  });
                }
              }
                
              } catch (error) {
                if(error.response && error.response.status===404){
                  MySwal.fire({
                    icon: 'error',
                    title: '404',
                    text: 'Trainer not found'
                });
                }else{
              //   MySwal.fire({
              //     icon: 'error',
              //     title: 'ERROR',
              //     text: 'Error Deleting Trainer'
              // });
              throw error
              }
            }
            } 
          });
      };

      const handleDeactivate = async (userId, username, email) => {
        const formData = new FormData();
        formData.append('email', email);
      
        MySwal.fire({
          title: "De Activate ?",
          text: `Are you sure you want to DeActivate Trainer ${username}`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "De Activate",
          cancelButtonText: "Cancel",
          input: 'text',
          inputAttributes: {
            autocapitalize: 'off',
            placeholder: 'Enter reason for deactivation (required)',
            required: true
          },
          preConfirm: (reason) => { // Handle user input before confirmation
            return new Promise((resolve, reject) => {
              if (reason === "") {
                Swal.showInputError('Please enter a reason for deactivation.');
                reject(); // Reject confirmation if reason is empty
              } else {
                formData.append('reason', reason);
                resolve(); // Allow confirmation if reason is provided
              }
            });
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              if (userId != null) {
                const response = await axios.delete(`${baseUrl}/admin/deactivate/trainer`, {
                  data: formData,
                  headers: {
                    'Authorization': token
                  }
                });
      
                if (response.status === 200) {
                  MySwal.fire({
                    title: "De Activated",
                    text: `Trainer ${username} De Activated successfully`,
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                    confirmButtonButtonText: "OK"
                  }).then(() => {
                    fetchData();
                  });
                } else {
                  // Handle other backend errors (e.g., 400 Bad Request)
                  MySwal.fire('Error', `Deactivation failed with status ${response.status}`, 'error');
                }
              } else {
                // Handle case where userId is null (if applicable)
                MySwal.fire('Error', 'Invalid user ID', 'error');
              }
            } catch (error) {
              if (error.response && error.response.status === 404) {
                MySwal.fire({
                  icon: 'error',
                  title: '404',
                  text: 'Traier not found'
                });
              } else {
                // MySwal.fire({
                //   icon: 'error',
                //   title: 'ERROR',
                //   text: 'Error Deactivating trainer'
                // });
                throw error
                console.error('Error during deactivation:', error); // Log detailed error for debugging
              }
            }
          }
        });
      };
      const handleActivate =async (userId,username,email)=>{
        const formData = new FormData();
        formData.append('email', email);
        MySwal.fire({
          title: " Activate ?",
          text: `Are you sure you want to Activate trainer ${username}`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Activate",
          cancelButtonText: "Cancel",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              if (userId != null) {
                const response = await axios.delete(`${baseUrl}/admin/Activate/trainer`,{
                 data:formData,
                  headers: {
                    'Authorization': token
                  }
                });
                if (response.status===200) {
                  MySwal.fire({
                    title: "Activated",
                    text: `Trainer ${username}  Activated successfully`,
                    icon: "success",
                    confirmButtonText: "OK",
                }).then(() => {
                    fetchData();
                });
              }
            }
              
            } catch (error) {
              if(error.response && error.response.status===404){
                MySwal.fire({
                  icon: 'error',
                  title: '404',
                  text: 'Trainer not found'
              });
              }else{
            //   MySwal.fire({
            //     icon: 'error',
            //     title: 'ERROR',
            //     text: 'Error  Activated Trainer'
            // });
            throw error
            }
          }
          } 
        });
      };
      
 
    
  return (
    <div>
      <div className="page-header"></div>
      <div className='row'>
        <div className='col-sm-12'>
          <div className='card'>
            <div className='card-header'>
    <div className="tableheader2">
       <h4>Trainers Details</h4>
       
        <select
                    className="selectstyle btn btn-success   text-left "
                   
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                  >
                    <option  className='bg-light text-dark ' value="All">All</option>
                    <option className='bg-light text-dark' value="Active">Active</option>
                    <option className='bg-light text-dark' value="Inactive">Inactive</option>
                  </select>
       
       </div>
      </div>
      <div className='card-body'>
      <div className="table-container">
        <table className="table table-hover table-bordered table-sm">
          <thead className='thead-dark'>
            <tr>
            <th scope="col"><i onClick={()=>{setfullsearch(!fullsearch)}} className={fullsearch ? 'fa-solid fa-xmark' :'fa-solid fa-magnifying-glass'}></i></th>
            <th scope="col">Username</th>
              <th scope="col">Email</th>
              <th scope='col'>Instituition Name</th>
              <th scope="col">Phone</th>
              <th scope="col"> Skills</th>
              <th scope="col">Date of Birth</th>
              <th scope="col">Status</th>

              <th colSpan="3" scope="col">Action</th>
            </tr>
            {fullsearch ?  <tr>
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
                name="institutionName"
                value={institutionName}
                onChange={handleChange}
                placeholder="Search Institution"
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
           <td><div></div></td>
          </tr> :<></>}
          </thead>
          <tbody>
            
        
          {filterData().map((user, index) => (
              <tr key={user.userId}>
                <th scope="row">{(currentPage * itemsperpage) + (index + 1)}</th>
                <td className='py-2'>{user.username}</td>
                <td className='py-2'>{user.email}</td>
                <td className='py-2'>{user.institutionName}</td>
                <td className='py-2'>{user.phone}</td>
                <td className='py-2'>{user.skills}</td>
                <td className='py-2'>{user.dob}</td>
                <td className='py-2' >{user.isActive===true? <div className='Activeuser'><i className="fa-solid fa-circle pr-3"></i>Active</div>:<div className='InActiveuser' ><i className="fa-solid fa-circle pr-3"></i>In Active</div>}</td>
                <td className='text-center'>
                {/* <Link to={`/trainer/edit/${user.email}`} className='hidebtn' >
                    <i className="fas fa-edit"></i>
                    </Link> */}
                    <button className='hidebtn icontrash' onClick={()=>handleDelete(user.username,user.email)}><i className="fas fa-trash"></i></button>
                    </td>
               
                <td  className='text-center'>
                {user.isActive===true?
                  <button className='hidebtn ' onClick={()=>handleDeactivate(user.userId,user.username,user.email)}>
                  <i className="fa-solid fa-lock"></i>
                  </button>:
                  <button  className='hidebtn ' onClick={()=>handleActivate(user.userId,user.username,user.email)}>
                  <i className="fa-solid fa-lock-open"></i>
                  </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       
      </div>
      <div className='cornerbtn'>
        <ul className="pagination">
           
        <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`} key="prev">
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
            <li className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`} key="next">
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
          <div><label className='text-primary'>( {datacounts.start}- { datacounts.start + users.length-1 }) of {datacounts.total}</label></div>
          </div>
          </div>
          </div>
          </div>
    </div>
  </div>
  
  )
}

export default ViewTrainers
