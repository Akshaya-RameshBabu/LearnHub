import React, { useEffect, useState } from "react";
import baseUrl from "../../api/utils.js";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import errorimg from "../../images/errorimg.png";
import Header from "../../Common Components/Header";
import pcoded from "../../assets/js/pcoded.js"
import Sidebar from "../../Common Components/Sidebar.js";
import { useNavigate } from "react-router-dom";
import SelectPaymentGateway from "../Payments/SelectPaymentGateway.js";
const ViewCourseVps = (filter,handleFilterChange) => {
  useEffect(() => {
      pcoded();  
      },[]);
  const MySwal = withReactContent(Swal);
  const [searchQuery, setSearchQuery] = useState("");
  const [course, setCourse] = useState([]);  
  const [submitting,setsubmitting]=useState(false);
  const[notfound,setnotfound]=useState(false);
  const islogedin=sessionStorage.getItem("token")!==null;
  const navigate=useNavigate();
  const Currency=sessionStorage.getItem("Currency")
  const[orderData,setorderData]=useState({
    userId:"",
    courseId:"",
    amount:"" ,
    courseAmount:"",
    coursename:"",
    installment:"",
    paytype:"",
    url:""
})
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        
          setsubmitting(true); // Show loading indicator
          const response = await axios.get(`${baseUrl}/course/viewAllVps`);
          setsubmitting(false); // Hide loading indicator
          const data = response.data;
          setCourse(data); // Set the fetched course data
        
      } catch (error) {
        setnotfound(true)
        console.error('Error fetching courses:', error);
        throw error
      }
    };

   
      fetchCourse();
    
  }, []); // This effect depends on the `showInLandingPage` state

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const filteredCourses = course.filter((item) => {
    const name = item.courseName ? item.courseName.toLowerCase() : "";
    return name.includes(searchQuery.toLowerCase());
  });

  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const pendingPayment = JSON.parse(sessionStorage.getItem("pendingPayment"));
  
    if (pendingPayment) {
      const { courseId, paytype } = pendingPayment;
  
      // Clear pending payment data from localStorage
      sessionStorage.removeItem("pendingPayment");
      const userId = sessionStorage.getItem("userid");
      // Resume the payment process
      handlepaytype(courseId, userId, paytype);
    }
  }, []);  // Empty dependency array ensures this only runs once when the component mounts
  
 
  const handlepaytype =(courseId, userId,paytype)=>{
   
    if (!token) {
      // Save payment data to localStorage or sessionStorage
      sessionStorage.setItem("pendingPayment", JSON.stringify({ courseId,  paytype }));
     
      navigate("/login");
      return;
    }
    let url = "";
    if (paytype === "FULL") {
      url = "/Full/getOrderSummary";
      FetchOrderSummary(courseId, userId, url);
    } else {
      MySwal.fire({
        icon: "question",
        title: "Payment Type?",
        text: "Want To Pay the Amount Partially or Fully? ",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: "#4e73df",
        denyButtonColor: "#4e73df",
        confirmButtonText: `Pay Fully `,
        denyButtonText: `Pay in  Part`,
      }).then((result) => {
        if (result.isConfirmed) {
          url = "/Full/getOrderSummary";
          FetchOrderSummary(courseId, userId, url);
        } else if (result.isDenied) {
          url = "/Part/getOrderSummary";

          FetchOrderSummary(courseId, userId, url);
        }
      });
    }
  };
  const FetchOrderSummary=async(courseId, userId, url) =>{
    try {
          setsubmitting(true);
          const data = JSON.stringify({
            courseId: courseId,
            userId: userId,
          });
    
          const response = await axios.post(`${baseUrl}${url}`, data, {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          });
          setsubmitting(false);

setorderData(response.data)
        }catch(error){
          setsubmitting(false);
              if(error.response && error.response.status===400){
              MySwal.fire({
                icon: "error",
                title: "Error creating order:",
                text: error.response.data ? error.response.data : "error occured",
              });
            }else{
              throw error
            }
        }
  }
 
  
 

const handleClick = async (event, id,amount,url,paytype) => {
  if (!token) {
    // Save payment data to localStorage or sessionStorage
    sessionStorage.setItem("pendingPayment", JSON.stringify({ id,  paytype }));
   
    navigate("/login");
    return;
  }
  event.preventDefault();
if(amount===0){
navigate(url);
}else{
  try {
    if(token){
    const formdata=JSON.stringify({ courseId: id})
      const response = await axios.post(`${baseUrl}/CheckAccess/match`, formdata,{

          headers: {
              'Content-Type': 'application/json',
              "Authorization":token
          } 
      });
    
      if (response.status===200) {
          const message = response.data;
          navigate(message);
      } 
    }
  } catch (error) {
    if(error.response.status===401){
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: "cannot Access Course "
    });
    
    }else{
    
  //   MySwal.fire({
  //     icon: 'error',
  //     title: 'Not Found',
  //     text: error
  // });
  throw error
}
  }
}
};

return (
  <>
    {islogedin && <Sidebar  filter={filter}
    handleFilterChange={handleFilterChange}/>}
    <Header searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        setSearchQuery={setSearchQuery} />
  
    
     <div className="pcoded-main-container"   
     style={{ marginLeft: islogedin ? undefined : '0px' }}>
     <div className="pcoded-content" >
    <div className="page-header"></div>
    
    {filteredCourses && filteredCourses.length > 0 ? (
      <div>
         {orderData.amount && (
        <SelectPaymentGateway orderData={orderData} setorderData={setorderData}/>
      )}
        <h4 style={{color:"white"}}>Courses For You</h4>
        < div className="row ">
        { filteredCourses
  .map((item, index) => (
    <div className="course" key={index}>
      <div className="card mb-3">
        <img
          className="img-fluid card-img-top"
          src={`data:image/jpeg;base64,${item.courseImage}`}
          onError={(e) => {
            e.target.src = errorimg; // Use the imported error image
          }}
          alt="Course"
        />

        <div className="card-body">
          <h5
            className="courseName"
            title={item.courseName}
            style={{ cursor: "pointer" }}
            onClick={(e) =>
              handleClick(
                e,
                item.courseId,
                item.amount,
                item.courseUrl,
                item.paytype
              )
            }
          >
            {item.courseName}
          </h5>
          <p title={item.courseDescription} className="courseDescription">
            {item.courseDescription}
          </p>
          <div>
            {item.amount === 0 ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.courseUrl);
                }}
                className="btn btn-sm btn-outline-success"
              >
                Enroll for Free
              </a>
            ) : (
              <div className="amountGrid">
                <div className="amt">
                  <i
                    className={
                      Currency === "INR"
                        ? "fa-solid fa-indian-rupee-sign pr-1"
                        : "fa-solid fa-dollar-sign pr-1"
                    }
                  ></i>
                  <span>{item.amount}</span>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    handlepaytype(item.courseId, userId, item.paytype)
                  }
                >
                  Enroll Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ))}

        </div>
      </div>
    ) : notfound ? (
      <h1>No Course Found</h1>
    ) : null}
    </div>
    </div>
  </>
);

};

export default ViewCourseVps;