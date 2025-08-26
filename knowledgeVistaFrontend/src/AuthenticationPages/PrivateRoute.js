import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom';
import baseUrl from '../api/utils';
import axios from 'axios';
const PrivateRoute = ({sysadmin, authenticationRequired, authorizationRequired,onlyadmin,onlyuser, onlytrainer,children ,licence,sysandadmin}) => {
    
  const token=sessionStorage.getItem("token")
  const [isvalid, setIsvalid] = useState();
    useEffect(() => {
        const fetchData = async () => {
          try {  
            if(userRole!=="SYSADMIN" && token) {
            const response = await axios.get(`${baseUrl}/api/v2/GetAllUser`,{
              headers:{
                "Authorization":token,
                }
              });
          
            const data = response.data;
            setIsvalid(data.valid);
          
            }
        } catch (error) {
          if (error.response && error.response.status !== 200) {
            console.error('Error fetching data:', error);
          }
          // console.error('Error fetching data:', error);
          throw error
        }
      };
      fetchData();
      }, []);
     const isAuthenticated = sessionStorage.getItem('token') !== null;
     const userRole = sessionStorage.getItem('role'); 
   
    
    // Check if authentication is required and user is authenticated
    if (authenticationRequired && !isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Check if authorization is required and user has the ADMIN role
    if (authorizationRequired ) {
      if(userRole === "USER")  {
      return <Navigate to="/unauthorized" />;
      }else if(userRole===null){
        return <Navigate to="/login" />;
      }
    }
    
     if(onlyadmin && (userRole ==="TRAINER" || userRole==="USER")){
       
            
    return <Navigate to="/unauthorized" />;
    }   
    if(sysadmin && (userRole ==="TRAINER" || userRole==="USER"|| userRole==="ADMIN")){
      return <Navigate to="/unauthorized" />;
      } 

    if(onlytrainer && (userRole ==="ADMIN" || userRole==="USER") ){
         
    return <Navigate to="/unauthorized" />;
    }



    if(onlyuser && (userRole ==="ADMIN" || userRole==="TRAINER")){
        
        return <Navigate to="/unauthorized" />;

    } 
if (sysandadmin && (userRole !== "ADMIN" && userRole !== "SYSADMIN")) {
    return <Navigate to="/unauthorized" />;
}



    if (userRole === "ADMIN") {
        if (isvalid===false) {
            if (licence) {
            return <>{children}</>; // Allow access with valid license
            } else {
            return <Navigate to="/licenceDetails" />;
            }
    }
      } else if (userRole === "TRAINER") {
        if (isvalid===false) {
          return <Navigate to="/LicenceExpired" />;
        }
      }
   
    // If authentication and authorization checks pass, render the children
    return <>{children}</>;
 

}

export default PrivateRoute