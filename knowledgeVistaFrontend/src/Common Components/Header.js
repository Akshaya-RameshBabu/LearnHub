import React, { useContext, useEffect, useState } from 'react'
import logo from "../images/LearnHubLogo.png"
import Notification from './Notification'
import baseUrl from '../api/utils'
import axios from 'axios'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import errorimg from "../images/errorimg.png"
import undraw_profile from "../images/profile-white.png";
import { GlobalStateContext } from "../Context/GlobalStateProvider";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Header = ({searchQuery,handleSearchChange}) => {
 
  const navigate=useNavigate();
  const { siteSettings } = useContext(GlobalStateContext);
    const islogedin=sessionStorage.getItem("token")!==null;
  const location = useLocation();
  const [data,setdata]=useState({
    name:"",
    profileImage:null
  })
  const[count,setcount]=useState(0);
  const token =sessionStorage.getItem("token");
 const role=sessionStorage.getItem("role");

  useEffect(() => {
    
    const cachedData = sessionStorage.getItem("profileData");

  if (cachedData) {
    setdata(JSON.parse(cachedData));
   

  } else {
    // Fetch data from API if not cached
    const fetchItems = async () => {
      try {
        if (token) {
          const response = await axios.get(`${baseUrl}/Edit/profiledetails`, {
            headers: {
              Authorization: token,
            },
          });

          if (response.status === 200) {
            const fetchedData = response.data;
            setdata(fetchedData);

            // Cache the data in sessionStorage
            sessionStorage.setItem("profileData", JSON.stringify(fetchedData));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchItems();
  }
}, []);  
    const fetchUnreadCount = async () => {
        try {
          if(role!=="SYSADMIN" &&token) {
          const response = await axios.get(`${baseUrl}/unreadCount`, {
            headers: {
              Authorization: token,
            },
          });
      
          if (response.status === 200) {
            const data = response.data;
            setcount(data);
          }
        }
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      };
      useEffect(() => {
      
      
        // Fetch initially
        fetchUnreadCount();
      
        // Cleanup for interval
      }, [count]);
    const handlemarkallasRead =async (notificationIds)=>{
        try{
        const markread=  await axios.post(`${baseUrl}/MarkAllASRead`, notificationIds, {
            headers: {
              Authorization: token,
            },
            
          });
          if(markread.status===200){
      
            fetchUnreadCount();
          }
        }catch (error) {
          console.error("Error fetching unread count:", error);
        }
       }
       const MySwal = withReactContent(Swal);
  const imageSource = data.profileImage ? `data:image/jpeg;base64,${data.profileImage}` : undraw_profile;
  
  const handleLogout = async () => {
    Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
         if (!token) {
          console.error("Token not found");
          return;
        }
  
        try {
          const response = await axios.post(`${baseUrl}/logoutuser`,{}, {
            headers: {
              Authorization: token 
            }
          });
  
          if (response.status===200) {
            sessionStorage.clear(); 
            localStorage.clear();
            navigate("/login")
            return;
          }
         
        } catch (error) {
          MySwal.fire({
            title: "Error!",
            text: "An error occurred while logging out. Please try again later.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    });
  };
  
  

  return (
    <header className="navbar pcoded-header navbar-expand-lg navbar-light header-blue"
    //style={{position:"fixed", paddingBottom:"5px"}}
  >
		
			
    <div className="m-header" >
    {islogedin && <a className="mobile-menu" id="mobile-collapse" href="#!"><span></span></a>}
        <a href={siteSettings.siteUrl? siteSettings.siteUrl:"#"} className="b-brand">
            <img  src={siteSettings.sitelogo?`data:image/jpeg;base64,${siteSettings.sitelogo}` : logo} alt="logo" className="logo"/>
        </a>

    </div>
    <div className="collapse navbar-collapse">
    {["/","/dashboard/course","/AssignedCourses", '/mycourses',"/course/admin/edit"].includes(location.pathname) && (
        <ul className="navbar-nav ">

            <li className="nav-item">
                <a href="#!" className="pop-search"><i className="feather icon-search"></i></a>
                <div className="search-bar">
                    <input type="text" 
                    className="form-control border-0 shadow-none" 
                     name="search"
                     id="search"
                     value={searchQuery}
                     onChange={handleSearchChange}
                     placeholder="Search Course...."
                    />
                    <button type="button" className="close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            </li>
        </ul>
    )}
        {islogedin &&    
        <ul className="navbar-nav ml-auto p-1 ">
        
        {role!=="SYSADMIN" &&     <li className='mr-2'>
                <div className="dropdown">
                    <a className="dropdown-toggle"
                     href="#" data-toggle="dropdown">
                 <i className="icon feather icon-bell " style={{fontSize:"1.3rem"}}></i><> {count > 0 ?<span className="notification-count badge badge-danger">{count}</span>:
                 <></>}</>
                        </a>
              <div className="dropdown-menu dropdown-menu-right notification">
        <Notification handlemarkallasRead={handlemarkallasRead}/>
      </div>
                                   </div>
            </li>}
            <li className='mr-2'> <strong>{data.name.length > 20 ? data.name.substring(0, 20) : data.name}</strong></li>
            <li>
                <div className="dropdown drp-user">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                   
                        <div className="pro-head mr-1 ">
                            <img  src={imageSource}

              onError={(e) => {
                e.target.src = errorimg; // Use the imported error image
              }} 
              className="img-profile  " alt="User-Profile-Image"/>
                           
                           
                        </div>
                    </a>
                    <div className="dropdown-menu dropdown-menu-right profile-notification">
                      
                        <ul className="pro-body">
                        {role!=="SYSADMIN" && <li><a href="/course/dashboard/profile" className="dropdown-item"><i className="feather icon-user"></i> Profile</a></li>}
                            <li><a href="#"   onClick={handleLogout} className="dropdown-item"><i className="feather icon-log-out"></i> Logout</a></li>
                             </ul>
                    </div>
                </div>
            </li>
            
        </ul>}
        {!islogedin && <div className=" ml-auto p-2" style={{gridColumn:"4", width:"250px",display:"flex",alignItems:"end",justifyContent:"flex-end"}}>
            <button
              className="btn btn-sm btn-success mr-2"
              onClick={() => {
                navigate("/login")
              }}
            >
              Sign In{" "}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                navigate("/StudentRegistration")
              }}
            >
              Sign up
            </button>
          </div>}
    </div>
    

</header>
  )
}

export default Header