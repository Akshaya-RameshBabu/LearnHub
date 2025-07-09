import React, { useEffect, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import baseUrl from '../api/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const localizer = momentLocalizer(moment);

const CalenderView = () => {
  const MySwal = withReactContent(Swal);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");
  
  const getAuthToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/zoom/getMyMeetings`, {
          headers: {
            Authorization: token,
          },
        });

        if (response.data) {
          const fetchedEvents = response.data.map((meeting) => {
            const utcStartTime = new Date(meeting.startTime);
            const localStartTime = new Date(utcStartTime.toLocaleString());
            const durationInMinutes = meeting.duration || 0;
            const localEndTime = new Date(localStartTime.getTime() + durationInMinutes * 60000);
            return {
              id: meeting.meetingId,
              title: meeting.topic || "",
              start: new Date(localStartTime),
              end: new Date(localEndTime),
              joinUrl: meeting.joinUrl,
            };
          });
          setEvents(fetchedEvents);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchItems();
  }, []);

  const handleJoin = () => {
    if (meetingId) {
      const joinUrl = `https://zoom.us/j/${meetingId}`;
      window.open(joinUrl, "_blank");
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      const result = await MySwal.fire({
        title: "Delete Meeting?",
        text: `Are you sure you want to delete "${event.title}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await axios.delete(`${baseUrl}/api/zoom/delete/${event.id}`, {
          headers: { Authorization: token },
        });
        setEvents(events.filter(e => e.id !== event.id));
        MySwal.fire("Deleted!", "Meeting has been deleted.", "success");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const eventStyleGetter = (event) => {
    const colors = ['#D5C1FF', '#D7F1BD', '#FFC1EE', '#FFDDC1'];
    const index = event.id % colors.length;
    return {
      style: {
        backgroundColor: colors[index],
        color: 'black',
        height: '30px'
      }
    };
  };

  return (
    <div>
      <div className="page-header"></div>
      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-body">
              <div className="navigateheaders">
                <div onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-arrow-left"></i>
                </div>
                <div></div>
                <div onClick={() => navigate("/dashboard/course")}> 
                  <i className="fa-solid fa-xmark"></i>
                </div>
              </div>
              <div className="calenderheadergrp">
                <h4>Calendar</h4>
                <div className="d-flex">
                  <input
                    type="text"
                    className="form-control tabinp"
                    placeholder="Join With Id"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                  />
                  {meetingId.length > 0 && (
                    <button className="hidebtn" onClick={handleJoin}>
                      <i className="fa-solid fa-right-to-bracket"></i>
                    </button>
                  )}
                </div>
                <button onClick={() => (window.location.href = "/meeting/Shedule")}
                  className="btn btn-primary">
                  New Meet
                </button>
              </div>
              <Calendar
                events={events}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => window.open(event.joinUrl, "_blank")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalenderView;


// import React, { useEffect, useState } from 'react';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import { Calendar, momentLocalizer } from 'react-big-calendar';
// import moment, { months } from 'moment';
// import baseUrl from '../api/utils';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import CustomEvent from './CustomeEvent'; // Import the custom event component
// import Swal from "sweetalert2";
// import withReactContent from "sweetalert2-react-content";
// import { event } from 'jquery';
// const localizer = momentLocalizer(moment);

// const CalenderView = () => {
  
//   const MySwal = withReactContent(Swal);
//   const [events, setEvents] = useState([]);
//   const navigate = useNavigate();
//   const token = sessionStorage.getItem('token');

//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//       //   const id="71115826084"
//       //  const res=await axios.get(`${baseUrl}/getzoom/${id}`,{
//       //   headers: {
//       //     'Authorization': token,
//       //   },
//       //  })
//       //  console.log("meetDetails",res)
//         const response = await axios.get(`${baseUrl}/api/zoom/getMyMeetings`, {
//           headers: {
//             'Authorization': token,
//           },
//         });
      
//          if(response.data){
//           const fetchedEvents = response.data.map((meeting) => {
//             const utcStartTime = new Date(meeting.startTime); // Ensure meeting.startTime is a valid UTC date string

//             // Convert UTC start time to local time
//             const localStartTime = new Date(utcStartTime.toLocaleString()); 
          
//             // Add duration to start time to get end time
//             const durationInMinutes = meeting.duration || 0; // Default to 0 if duration is not provided
//             const localEndTime = new Date(localStartTime.getTime() + durationInMinutes * 60000); // 60000 ms = 1 min
//             const starttime= localStartTime.toISOString();
//             const endtime=localEndTime.toISOString()
//             return {
//               id: meeting.meetingId,
//               start: new Date(localStartTime), // Ensure this is a Date object or ISO string
//               end: new Date(localEndTime),
//               joinUrl: meeting.joinUrl,
//               title: meeting.topic||"",
//             };
//         });
//         setEvents(fetchedEvents);
//       }
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     fetchItems();
//   }, []);
//   const [meetingId, setMeetingId] = useState('');

//   // Handle input change
//   const handleChange = (e) => {
//     setMeetingId(e.target.value);
//   };

//   // Handle form submission
//   const handleJoin = (e) => {
   
//       if (meetingId) {
//         const joinUrl = `https://zoom.us/j/${meetingId}`;
//         window.open(joinUrl, '_blank');
//       }
    
//   };

  
//   const handleDeleteEvent = async (event) => {
//     try {
//       const result = await MySwal.fire({
//         title: "Delete Meeting?",
//         text: `Are you sure you want to delete this Meeting ${event.title}?`,
//         icon: "warning",
//         showCancelButton: true,
//         confirmButtonColor: "#d33",
//         confirmButtonText: "Delete",
//         cancelButtonText: "Cancel",
//       });
  
//       if (result.isConfirmed) {
//         await axios.delete(`${baseUrl}/api/zoom/delete/${event.id}`, {
//           headers: {
//             'Authorization': token,
//           },
//         });
  
//         // Remove the deleted event from the state
//         setEvents(events.filter(e => e.id !== event.id));
        
//         MySwal.fire({
//           title: "Deleted!",
//           text: " Meeting has been deleted.",
//           icon: "success",
//         })
//       }
      
//     } catch (error) {
//       console.error(error);
//       // Optionally, show an error message
//       // MySwal.fire('Error!', 'An error occurred while deleting the meeting.', 'error');
//       throw error
//     }
//   };
  

//   const eventStyleGetter = (event) => {
//     // Define an array of colors
//     const colors = ['#D5C1FF', '#D7F1BD', '#FFC1EE', '#FFDDC1'];
  
//     const index = event.id % colors.length; 
  
//     return {
//       style: {
//         backgroundColor: colors[index], // Use the color from the array
//         color: 'black',
//         height: '30px'
        
//       }
//     };
//   };
  

//   return (
//     <div>
//     <div className="page-header"></div>
//     <div className='row'>
//       <div className='col-sm-12'>
//         <div className='card'>
      
//         <div className='card-body'>
//         <div className="navigateheaders ">
//           <div onClick={() => navigate(-1)}>
//             <i className="fa-solid fa-arrow-left"></i>
//           </div>
//           <div></div>
//           <div onClick={() => navigate("/dashboard/course")}>
//             <i className="fa-solid fa-xmark"></i>
//           </div>
//         </div>
//         <div className='calenderheadergrp'>
//           <h4>Calendar</h4>
//           <div className='d-flex'>
//           <input
//         type="text"
//         className="form-control tabinp"
//         placeholder="Join With Id"
//         value={meetingId}
//         onChange={handleChange}
//       />
//       {meetingId.length>0 &&<button className="hidebtn" onClick={handleJoin}>
//       <i className="fa-solid fa-right-to-bracket"></i>
//       </button>}
//       </div>
//           <button onClick={()=>{window.location.href="/meeting/Shedule"}} className='btn btn-primary'>New Meet</button>
//         </div>
//         <Calendar
//           events={events}
//           localizer={localizer}
//           startAccessor="start"
//           endAccessor="end"
//           style={{ height: 500 }}
//           components={{
//             event: (props) => <CustomEvent {...props} onDelete={handleDeleteEvent} />
//           }}
//           eventPropGetter={eventStyleGetter}
//         />
//         </div>
//       </div>
//       </div>
//       </div>
//     </div>
//   );
// };

// export default CalenderView;