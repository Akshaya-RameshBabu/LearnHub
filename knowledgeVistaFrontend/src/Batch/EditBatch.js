import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import baseUrl from "../api/utils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const EditBatch = () => {
    const {id}= useParams();
    const navigate = useNavigate();
    const MySwal = withReactContent(Swal);
   const [searchQuerycourse,setSearchQuerycourse]=useState('')
   const [courses, setCourses] = useState({});
   const[selectedCourse,setSelectedCourse]=useState([])
   const [trainers,setTrainers]=useState([]);
   const [searchQueryTrainer,setSearchQueryTrainer]=useState('')
   const[selectedTainers,setselectedTrainers]=useState([])
   const token = sessionStorage.getItem("token");
   const role=sessionStorage.getItem("role")
   const[batch,setbatch]=useState({
    id:"",
    batchId:"",
     batchTitle:"",
     startDate:"",
     endDate:"",
     courses:selectedCourse,
     trainers:selectedTainers,
     noOfSeats:"",
     amount:"",
     BatchImage:null,
     base64Image:null
   })
   const [errors, setErrors] = useState({
     batchTitle: "",
     startDate: "",
     endDate: "",
     noOfSeats: "",
     amount: "",
     BatchImage:null,
     base64Image:null
   });

useEffect(()=>{
    const fetchBatchbyId = async ()=>{
    try{
        if(id){
        const response = await axios.get(`${baseUrl}/Batch/get?id=${id}`, {
            headers: {
              Authorization: token,
            },
          });

      setbatch(response?.data)
      if(response?.data?.batchImage!=null){
      setbatch((prev)=>({
        ...prev,
        BatchImage:response?.data.batchImage,
        base64Image:`data:image/jpeg;base64,${response?.data?.batchImage}`
      }))
    }
    if(response?.data?.trainers?.length>0){
      setselectedTrainers(response?.data?.trainers)
    }
    if(response?.data?.courses?.length>0){
      setSelectedCourse(response?.data?.courses)
    }
        }
    }catch(error){
        console.log(error)
    }}
    fetchBatchbyId()
},[])

   const convertImageToBase64 = (file) => {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onload = () => resolve(reader.result);
       reader.onerror = (error) => reject(error);
     });
   };
   const handleFileChange = (e) => {
     const file = e.target.files[0];
 
     // Define allowed MIME types for images
     const allowedImageTypes = ["image/jpeg", "image/png"];
 
     // Check file type (MIME type)
     if (file &&  !allowedImageTypes.includes(file.type)) {
       setErrors((prevErrors) => ({
         ...prevErrors,
         BatchImage: "Please select an image of type JPG or PNG",
       }));
       return;
     }
 
     // Check file size (should be 1 MB or less)
     if (file && file.size > 50 * 1024) {
       setErrors((prevErrors) => ({
         ...prevErrors,
         BatchImage: "Image size must be 50 kb or smaller",
       }));
       return;
     }
 
     // Update formData with the new file
     setbatch((prevFormData) => ({
       ...prevFormData,
       BatchImage: file,
     }));
 
     // Convert the file to base64
     convertImageToBase64(file)
       .then((base64Data) => {
         // Set the base64 encoded image in the state
         setbatch((prevFormData) => ({
           ...prevFormData,
           base64Image: base64Data,
         }));
         setErrors((prevErrors) => ({
           ...prevErrors,
           BatchImage: "",
         }));
       })
       .catch((error) => {
         console.error("Error converting image to base64:", error);
         setErrors((prevErrors) => ({
           ...prevErrors,
           BatchImage: "Error converting image to base64",
         }));
       });
   };
   const handleCourseClick = (course) => {
    
     setSelectedCourse((prevSelected) => {
       // Check if course is already selected
       const exists = prevSelected.find((courseprev) => courseprev.courseId === course.courseId);
       let updatedCourses;
       if (exists) {
         // Remove the course if already selected
         updatedCourses= prevSelected
       } else {
         // Add the course if not selected
         updatedCourses= [...prevSelected, { courseId: course.courseId, courseName: course.courseName }];
       }
  
     setbatch((prevBatch) => ({
       ...prevBatch,
       courses:updatedCourses,
       amount: prevBatch.amount +  course.amount, // Update batch amount
     }));
     return updatedCourses;
   })
     setCourses({});
     setSearchQuerycourse('')
   };
   const handletrainerclick = (trainer) => {
    
     setselectedTrainers((prevSelected) => {
       // Check if trainer is already selected
       const exists = prevSelected.find((trainerprev) => trainerprev.userId === trainer.userId);
       let updatedtrainer
       if (exists) {
         // Remove the trainer if already selected
         updatedtrainer= prevSelected
       } else {
         // Add the trainer if not selected
         updatedtrainer= [...prevSelected, { userId: trainer.userId, username: trainer.username }];
       }
       setbatch((prev)=>({
         ...prev,
         trainers:updatedtrainer
       }))
       return updatedtrainer
     });
 
     setTrainers({});
     setSearchQueryTrainer('')
   };
   const handleCourseRemove = (course) => {
    
     setSelectedCourse((prevSelected) => {
       // Check if course is already selected
       const exists = prevSelected.find((courseprev) => courseprev.courseId === course.courseId);
        let updatedCourses
       if (exists) {
        
         updatedCourses= prevSelected.filter((courseprev) => courseprev.courseId !== course.courseId);
         setbatch((prevBatch) => ({
           ...prevBatch,
           courses:updatedCourses,
           amount: prevBatch.amount -  course.amount, // Update batch amount
         }));
       } 
       return updatedCourses
     });
     
   };
   const handletrainerRemove = (trainer) => {
    
     setselectedTrainers((prevSelected) => {
       // Check if trainer is already selected
       const exists = prevSelected.find((trainerprev) => trainerprev.userId === trainer.userId);
 
       if (exists) {
         // Remove the trainer if already selected
         let updatedtrainer= prevSelected.filter((trainerprev) => trainerprev.userId !== trainer.userId);
         setbatch((prev)=>({
           ...prev,
           trainers:updatedtrainer
         }))
         return updatedtrainer
       } 
     });
     
   };
   const searchCourses = async (e) => {
     try {
       setSearchQuerycourse(e.target.value)
       const response = await axios.get(`${baseUrl}/searchCourse`, {
         params: { courseName: e.target.value },
         headers: {
           Authorization: token,
         },
       });
       setCourses(response.data);
     } catch (error) {
       console.error("Error fetching courses:", error);
     }
   };
   const searchTrainers = async (e) => {
     try {
       setSearchQueryTrainer(e.target.value)
       const response = await axios.get(`${baseUrl}/searchTrainer`, {
         params: { userName: e.target.value },
         headers: {
           Authorization: token,
         },
       });
       setTrainers(response.data);
     } catch (error) {
       console.error("Error fetching courses:", error);
     }
   };
  
   
   const handleBatchChange = (e) => {
     const { name, value } = e.target;
   
     // Initialize an empty error object
     let errorObj = { ...errors };
   
     // Check for errors based on the name of the field being updated
     switch (name) {
      case "batchTitle":
        if (!value.trim()) {
          errorObj.batchTitle = "Batch title cannot be empty!";
        } else if (/[\/\\]/.test(value)) {
          errorObj.batchTitle = "Batch title cannot contain '/' or '\\'";
        } else {
          errorObj.batchTitle = "";
          setbatch((prev) => ({
            ...prev,
            [name]: value,
          }));
        }
        break;
   
       case "startDate":
         if (value && batch.endDate && new Date(value) > new Date(batch.endDate)) {
           errorObj.startDate = "Start date should be smaller than end date!";
         } else {
           errorObj.startDate = "";
           setbatch((prev) => ({
             ...prev,
             [name]: value,
           }));
         }
         break;
   
       case "endDate":
         if (value && batch.startDate && new Date(value) < new Date(batch.startDate)) {
           errorObj.endDate = "End date should be greater than start date!";
         } else {
           errorObj.endDate = "";
           setbatch((prev) => ({
             ...prev,
             [name]: value,
           }));
         }
         break;
   
       case "noOfSeats":
         if (value && value <= 0) {
           errorObj.noOfSeats = "Number of seats cannot be zero or negative!";
         } else {
           errorObj.noOfSeats = "";
           setbatch((prev) => ({
             ...prev,
             [name]: value,
           }));
         }
         break;
   
       case "amount":
         // Optionally add validation for amount if needed
         if (value && value < 0) {
           errorObj.amount = "Amount cannot be negative!";
         } else {
           errorObj.amount = "";
           setbatch((prev) => ({
             ...prev,
             [name]: value,
           }));
         }
         break;
   
       default:
         break;
     }
   
     
   
     // Update the errors state
     setErrors(errorObj);
   };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
   
     const newErrors = {};
   
     // Validation checks
     if (!batch?.batchTitle) newErrors.batchTitle = "Batch title is required.";
     if (!batch?.startDate) newErrors.startDate = "Start date is required.";
     if (!batch?.endDate) newErrors.endDate = "End date is required.";
     if (!batch?.noOfSeats) newErrors.noOfSeats = "Number of seats is required.";
     if (!batch?.amount) newErrors.amount = "Amount is required.";
     if(!batch?.courses?.length<0)newErrors.courses="select atleast one Course"
      if(!batch?.trainers?.length<0)newErrors.trainers="select atleast one trainer"
     setErrors(newErrors);
     if (Object.keys(newErrors)?.length > 0) {
       return;
     }
   
     const formData = new FormData();
     formData.append("batchTitle", batch.batchTitle);
     formData.append("startDate", batch.startDate);
     formData.append("endDate", batch.endDate);
     formData.append("noOfSeats", batch.noOfSeats);
     formData.append("amount", batch.amount);
     formData.append("courses", JSON.stringify(batch.courses)); // Sending courses as a JSON string
     formData.append("trainers", JSON.stringify(batch.trainers));
  
     // Append batch image if exists
     if (batch.BatchImage) {
       formData.append("batchImage", batch.BatchImage);
     }
     
     try {
      if(id){
        const response = await axios.patch(`${baseUrl}/batch/Edit/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token
          }
        });        
   
       if (response.status === 200) {

         MySwal.fire({
           title: "Batch Updated",
           text: "batch Updated sucessfully !",
           icon: "success",
         })
         setbatch({
           batchTitle: "",
           startDate: "",
           endDate: "",
           courses: [],
           trainers: [],
           noOfSeats: "",
           amount: "",
         });
         setSelectedCourse([]);
         setselectedTrainers([])
         setErrors({});
         if(response?.data){
          navigate(`/batch/save/partpay/${batch.batchTitle}/${id}`);}
          else{
         navigate("/batch/viewall")
          }
       }else if(response.status===204){
        setbatch({
          batchTitle: "",
          startDate: "",
          endDate: "",
          courses: [],
          trainers: [],
          noOfSeats: "",
          amount: "",
        });
        navigate("/notFound");
       }
      }
     } catch (error) {
      if(error?.response?.status===401){
        navigate("/unAuthorized")
      } if(error?.response?.status===403){
        MySwal.fire({
          icon: "warning",
          title: "FORBITTEN",
          text: "You Cannot Edit This Batch"
        }).then((result) => {
          navigate(-1);
        }
        );
      
      }else{
       console.error("Error Updating batch:", error);
      }
     }
   };
 
  return (
    <div>
      <div className="page-header"></div>
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

              <h4>Edit batch </h4>
              <div className="col-10">
                <div className="form-group row">
                  <label
                    htmlFor="courseName"
                    className="col-sm-3 col-form-label"
                  >
                    batch Title <span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className={`form-control ${errors.batchTitle && "is-invalid"} `}
                      placeholder="Batch Title"
                      value={batch.batchTitle}
                      name="batchTitle"
                      onChange={handleBatchChange}
                    />
                    <div className="invalid-feedback">{errors.batchTitle}</div>
                  </div>
                </div>
                <div className="form-group row p-3">
                  <div className="col-sm-7">
                    <div className="row">
                      <label
                        htmlFor="Duration"
                        className="col-form-label col-sm-5 p-0"

                      >
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <div className="col">
                        <input type="date" 
                         min={new Date().toISOString().split("T")[0]}
                        className={`form-control ${errors.startDate && "is-invalid"} `} 
                        value={batch.startDate} name="startDate" onChange={handleBatchChange} />
                        <div className="invalid-feedback">{errors.startDate}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-5">
                    <div className="row">
                      <label className=" col-form-label col-sm-3">
                        End Date <span className="text-danger">*</span>
                      </label>
                      <div className="col">
                        <input type="date"
                         className={`form-control ${errors.endDate && "is-invalid"} `} 
                         value={batch.endDate}
                          min={batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}  
                          name="endDate" onChange={handleBatchChange}/>
                        <div className="invalid-feedback">{errors.endDate}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Courses
                  </label>
                  <div className="col-sm-9">
                  <div className="inputlike">
                  {selectedCourse?.length > 0 && (
        <div className="listemail">
          {selectedCourse.map((course) => (
            <div key={course.courseId} className="selectedemail">
              {course.courseName}{" "}
              <i
                onClick={() => handleCourseRemove(course)}
                className="fa-solid fa-xmark"
              ></i>
            </div>
          ))}
        </div>
      )}

                      <input
                        type="input"
                        id="customeinpu"
                        className={`form-control ${errors.trainers && "is-invalid"} `} 
                        placeholder="search Course..."
                        onChange={searchCourses}
                        value={searchQuerycourse}
                      />
                      <div className="invalid-feedback">{errors.courses}</div>
                    </div>
                    {courses?.length > 0 && (
        <div className="user-list">
          {courses.map((course) => (
            <div key={course.courseId} className="usersingle">
              <label
                id="must"
                className="p-1 w-100"
                htmlFor={course.courseName}
                onClick={() => handleCourseClick(course)}
              >
                {course.courseName}
              </label>
            </div>
          ))}
        </div>
      )}
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    Trainers
                 
                  </label>
                  <div className="col-sm-9">
                    <div className="inputlike">
                    {selectedTainers?.length > 0 && (
        <div className="listemail">
          {selectedTainers.map((trainers) => (
            <div key={trainers.userId} className="selectedemail">
              {trainers.username}{" "}
              <i
                onClick={() => handletrainerRemove(trainers)}
                className="fa-solid fa-xmark"
              ></i>
            </div>
          ))}
        </div>
      )}

                      <input
                        type="input"
                        id="customeinpu"
                        placeholder="search trainers..."
                        className={`form-control ${errors.trainers && "is-invalid"} `} 
                        value={searchQueryTrainer}
                        onChange={searchTrainers}
                      />
                      <div className="invalid-feedback">{errors.trainers}</div>
                    </div>
                    {trainers?.length > 0 && (
        <div className="user-list">
          {trainers.map((trainer) => (
            <div key={trainer.userId} className="usersingle">
              <label
                id="must"
                className="p-1 w-100"
                htmlFor={trainer.username}
                onClick={() => handletrainerclick(trainer)}
              >
                {trainer.username}
              </label>
            </div>
          ))}
        </div>
      )}
                  </div>
                </div>

                <div className="form-group row" >
                <label htmlFor="BatchImage" 
                className="col-sm-3 col-form-label">
                  batch Image 
                </label>
                <div className="col-sm-9 ">
                  <div className="custom-file">
                  <input
                    type="file"
                    className={`custom-file-input 
                      ${errors.BatchImage && "is-invalid"}`}
                    onChange={handleFileChange}
                    id="BatchImage"
                    name="BatchImage"
                    accept="image/*"
                  />
                  <label className="custom-file-label" 
                  htmlFor="BatchImage">
                    Choose file...
                  </label>
                  <div className="invalid-feedback">{errors.BatchImage}</div>
                </div>
                </div>
              </div>
              {batch.base64Image && (
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label"></label>
                  <div className="col-sm-9">
                    <img
                      src={batch.base64Image}
                      alt="Selected"
                      style={{ width: "100px", height: "100px" }}
                    />
                  </div>
                </div>
              )}

                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">
                    No of Seats <span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      name="noOfSeats"
                      placeholder="No of Seats"
                      className={`form-control ${errors.noOfSeats && "is-invalid"} `}
                      value={batch.noOfSeats}
                      onChange={handleBatchChange}
                    />
                    <div className="invalid-feedback">{errors.noOfSeats}</div>
                  </div>
                </div>
                <div className="form-group row">
                  <label
                    htmlFor="courseAmount"
                    className="col-sm-3 col-form-label"
                  >
                    Batch Amount <span className="text-danger">*</span>
                  </label>
                  {role==="ADMIN" ? (
                  <div className="col-sm-9">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Amount"
                      name="amount"
                      className={`form-control ${errors.amount && "is-invalid"} `}
                      value={batch.amount}
                      onChange={handleBatchChange}
                    />
                    <div className="invalid-feedback">{errors.amount}</div>
                  </div>):(<div className="col-sm-9">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Amount"
                      name="amount"
                      readOnly
                      className="form-control"
                      value={batch.amount}
                    />
                  </div>)}

                  {role === "ADMIN" && batch?.paytype && (
  <div className="form-group row">
    <div className="col-sm-3 col-form-label">Partial Pay</div>
    <div className="col-sm-9 mt-2">
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault(); // Prevent default anchor behavior

         navigate(
             `/batch/save/partpay/${batch.batchTitle}/${batch.id}`);

         
        }}
      >
        Installment Settings
      </a>
    </div>
  </div>
)}

                </div>
              </div>
              <div className="cornerbtn">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    navigate(-1);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditBatch