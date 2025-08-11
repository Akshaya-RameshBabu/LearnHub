import axios from 'axios';
import React, { useEffect, useState } from 'react';
import baseUrl from '../api/utils';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ListMeeting = () => {
  const [meetings, setMeetings] = useState([]);
  const token = sessionStorage.getItem('token');
  const[date,setdate]=useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, [date]);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/zoom/getMyMeetingswithdate`, {
        params:{
          date:date,
        },
        headers: {
          'Authorization': token,
        },
      });

      if (response.status === 200) {
        setMeetings(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handlClickJoinUrl = async (meetingId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/zoom/Join/${meetingId}`, {
        headers: {
          'Authorization': token,
        },
      });

      if (typeof response.data === 'string' && response.data.startsWith('http')) {
        window.open(response.data, '_blank');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      const result = await Swal.fire({
        title: "Delete Meeting?",
        text: `Are you sure you want to delete "${event.topic}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await axios.delete(`${baseUrl}/api/zoom/delete/${event.meetingId}`, {
          headers: {
            'Authorization': token,
          },
        });

        setMeetings(meetings.filter((e) => e.meetingId !== event.meetingId));

        Swal.fire({
          title: "Deleted!",
          text: "Meeting has been deleted.",
          icon: "success",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (meetingId) => {
    navigate(`/meet/edit/${meetingId}`);
  };

  return (
    <div>
      <div className="page-header"></div>

      <div className="row">
        <div className="col-sm-12">
          <div className="card">
            <div className="card-body">

              {/* ✅ Navigate Headers */}
              <div className="navigateheaders ">
                <div onClick={() => navigate(-1)} className='pointer'>
                  <i className="fa-solid fa-arrow-left"></i>
                </div>
                <div></div>
                <div onClick={() => navigate("/dashboard/course")} className='pointer'>
                  <i className="fa-solid fa-xmark"></i>
                </div>
              </div>
              <div className='tableheader'>
<h4 >My Meetings</h4>
<input type='date' value={date} onChange={(e)=>{setdate(e.target.value)}} className="form-control col-sm-4"/></div>
<div className='pt-4 vh-65'>
              {/* ✅ Meeting Cards */}
              {meetings.length === 0 ? (
                <p className="text-muted">No meetings found for the date {date}.</p>
              ) : (
                meetings.map((meeting, index) => (
                  <div
                    key={index}
                    className="list-group-item"
                  >
                    <div>
                      <h5 className="fw-semibold mb-1">{meeting.topic}</h5>
                      <p className="mb-1 text-muted">Duration: {meeting.duration} min</p>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlClickJoinUrl(meeting.meetingId)}
                      >
                        <i className="fas fa-sign-in-alt me-1"></i> Join
                      </button>
                      <button
                        className="hidebtn"
                        onClick={() => handleEdit(meeting.meetingId)}
                      >
                        <i className="fas fa-edit text-success"></i>
                      </button>
                      <button
                        className="hidebtn "
                        onClick={() => handleDeleteEvent(meeting)}
                      >
                        <i className="fas fa-trash-alt text-danger"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListMeeting;
