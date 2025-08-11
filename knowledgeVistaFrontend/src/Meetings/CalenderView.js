
import React, { useEffect, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment, { months } from 'moment';
import baseUrl from '../api/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const localizer = momentLocalizer(moment);

const CalenderView = () => {
  
  const MySwal = withReactContent(Swal);
  const [events, setEvents] = useState([]);
  const[loading,setloading]=useState(false)
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setloading(true)
        const response = await axios.get(`${baseUrl}/api/zoom/getMyMeetings`, {
          headers: {
            'Authorization': token,
          },
        });
      
         if(response.data){
          const fetchedEvents = response.data.map((meeting) => {
            const utcStartTime = new Date(meeting.startTime); // Ensure meeting.startTime is a valid UTC date string

            // Convert UTC start time to local time
            const localStartTime = new Date(utcStartTime.toLocaleString()); 
          
            // Add duration to start time to get end time
            const durationInMinutes = meeting.duration || 0; // Default to 0 if duration is not provided
            const localEndTime = new Date(localStartTime.getTime() + durationInMinutes * 60000); // 60000 ms = 1 min
            const starttime= localStartTime.toISOString();
            const endtime=localEndTime.toISOString()
            return {
              id: meeting.meetingId,
              start: new Date(localStartTime), // Ensure this is a Date object or ISO string
              end: new Date(localEndTime),
              joinUrl: meeting.joinUrl,
              title: meeting.topic||"",
            };
        });
        setEvents(fetchedEvents);
      }
      } catch (error) {
        console.error(error);
      }finally{
        setloading(false)
      }
    };

    fetchItems();
  }, []);
  const [meetingId, setMeetingId] = useState('');

  // Handle input change
  const handleChange = (e) => {
    setMeetingId(e.target.value);
  };

  // Handle form submission
  const handleJoin = (e) => {
   
      if (meetingId) {
        const joinUrl = `https://zoom.us/j/${meetingId}`;
        window.open(joinUrl, '_blank');
      }
    
  };

   const handlClickJoinUrl = async (event) => {
    try {
      console.log("hii in handlClickJoinUrl",event)
        const response =await axios.get(`${baseUrl}/api/zoom/Join/${event.id}`, {
          headers: {
            'Authorization': token,
          },
        });
  
       console.log(response.data);
       if (typeof response.data === 'string' && response.data.startsWith('http')) {
        window.open(response.data, '_blank');
    }
      
    } catch (error) {
      console.error(error);
      // Optionally, show an error message
      // MySwal.fire('Error!', 'An error occurred while deleting the meeting.', 'error');
      throw error
    }
  };
  const eventStyleGetter = (event) => {
    // Define an array of colors
    const colors = ['#D5C1FF', '#D7F1BD', '#FFC1EE', '#FFDDC1'];
  
    const index = event.id % colors.length; 
  
    return {
      style: {
        backgroundColor: colors[index], // Use the color from the array
        color: 'black',
        height: '30px'
        
      }
    };
  };
  

  return (
    <div>
    <div className="page-header"></div>
    <div className='row'>
      <div className='col-sm-12'>
        <div className='card'>
      
        <div className='card-body'>
        <div className="navigateheaders ">
          <div onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <div></div>
          <div onClick={() => navigate("/dashboard/course")}>
            <i className="fa-solid fa-xmark"></i>
          </div>
        </div>
        {loading &&(    <div className="outerspinner active">
                <div className="spinner"></div>
            </div>)}
        <div className='calenderheadergrp'>
          <h4>Calendar</h4>
          <div className='d-flex'>
          <input
        type="text"
        className="form-control tabinp"
        placeholder="Join With Id"
        value={meetingId}
        onChange={handleChange}
      />
      {meetingId.length>0 &&<button className="hidebtn" onClick={handleJoin}>
      <i className="fa-solid fa-right-to-bracket"></i>
      </button>}
      </div>
          <button onClick={()=>{window.location.href="/meeting/Shedule"}} className='btn btn-primary'>New Meet</button>
        </div>
        <Calendar
          events={events}
          localizer={localizer}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handlClickJoinUrl}
        />
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default CalenderView;