import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import baseUrl from "../api/utils";
import moment from "moment-timezone";
import EditReccuringMeet from "./EditReccuringMeet";

const EditMeeting = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  const token = sessionStorage.getItem("token");
  const Productversion = sessionStorage.getItem("LicenceVersion");
    const [reccurance, setreccurance] = useState("Daily");
  const [issubmitting, setissubmitting] = useState(false);
  const timezones = [
    { name: "Pacific/Midway", id: "Pacific/Midway" },
    { name: "Samoa", id: "Samoa" },
    { name: "Pacific/Pago_Pago", id: "Pacific/Pago_Pago" },
    { name: "Pacific/Honolulu", id: "Pacific/Honolulu" },
    { name: "America/Anchorage", id: "America/Anchorage" },
    { name: "America/Vancouver", id: "America/Vancouver" },
    { name: "America/Los_Angeles", id: "America/Los_Angeles" },
    { name: "America/Tijuana", id: "America/Tijuana" },
    { name: "America/Edmonton", id: "America/Edmonton" },
    { name: "America/Denver", id: "America/Denver" },
    { name: "America/Phoenix", id: "America/Phoenix" },
    { name: "America/Mazatlan", id: "America/Mazatlan" },
    { name: "America/Winnipeg", id: "America/Winnipeg" },
    { name: "America/Regina", id: "America/Regina" },
    { name: "America/Chicago", id: "America/Chicago" },
    { name: "America/Mexico_City", id: "America/Mexico_City" },
    { name: "America/Guatemala", id: "America/Guatemala" },
    { name: "America/El_Salvador", id: "America/El_Salvador" },
    { name: "America/Managua", id: "America/Managua" },
    { name: "America/Costa_Rica", id: "America/Costa_Rica" },
    { name: "America/Montreal", id: "America/Montreal" },
    { name: "America/New_York", id: "America/New_York" },
    { name: "America/Indianapolis", id: "America/Indianapolis" },
    { name: "America/Panama", id: "America/Panama" },
    { name: "America/Bogota", id: "America/Bogota" },
    { name: "America/Lima", id: "America/Lima" },
    { name: "America/Halifax", id: "America/Halifax" },
    { name: "America/Puerto_Rico", id: "America/Puerto_Rico" },
    { name: "America/Caracas", id: "America/Caracas" },
    { name: "America/Santiago", id: "America/Santiago" },
    { name: "America/St_Johns", id: "America/St_Johns" },
    { name: "America/Montevideo", id: "America/Montevideo" },
    { name: "America/Araguaina", id: "America/Araguaina" },
    {
      name: "America/Argentina/Buenos_Aires",
      id: "America/Argentina/Buenos_Aires",
    },
    { name: "America/Godthab", id: "America/Godthab" },
    { name: "America/Sao_Paulo", id: "America/Sao_Paulo" },
    { name: "Atlantic/Azores", id: "Atlantic/Azores" },
    { name: "Canada/Atlantic", id: "Canada/Atlantic" },
    { name: "Atlantic/Cape_Verde", id: "Atlantic/Cape_Verde" },
    { name: "UTC", id: "UTC" },
    { name: "Etc/Greenwich", id: "Etc/Greenwich" },
    { name: "Europe/Belgrade", id: "Europe/Belgrade" },
    { name: "Bratislava", id: "Europe/Bratislava" },
    { name: "Ljubljana", id: "Europe/Ljubljana" },
    { name: "CET", id: "CET" },
    { name: "Sarajevo", id: "Europe/Sarajevo" },
    { name: "Skopje", id: "Europe/Skopje" },
    { name: "Zagreb", id: "Europe/Zagreb" },
    { name: "Atlantic/Reykjavik", id: "Atlantic/Reykjavik" },
    { name: "Europe/Dublin", id: "Europe/Dublin" },
    { name: "Europe/London", id: "Europe/London" },
    { name: "Europe/Lisbon", id: "Europe/Lisbon" },
    { name: "Africa/Casablanca", id: "Africa/Casablanca" },
    { name: "Africa/Nouakchott", id: "Africa/Nouakchott" },
    { name: "Europe/Oslo", id: "Europe/Oslo" },
    { name: "Europe/Copenhagen", id: "Europe/Copenhagen" },
    { name: "Europe/Brussels", id: "Europe/Brussels" },
    { name: "Europe/Berlin", id: "Europe/Berlin" },
    { name: "Amsterdam", id: "Europe/Amsterdam" },
    { name: "Rome", id: "Europe/Rome" },
    { name: "Stockholm", id: "Europe/Stockholm" },
    { name: "Vienna", id: "Europe/Vienna" },
    { name: "Europe/Luxembourg", id: "Europe/Luxembourg" },
    { name: "Europe/Paris", id: "Europe/Paris" },
    { name: "Europe/Zurich", id: "Europe/Zurich" },
    { name: "Europe/Madrid", id: "Europe/Madrid" },
    { name: "Africa/Bangui", id: "Africa/Bangui" },
    { name: "Africa/Algiers", id: "Africa/Algiers" },
    { name: "Africa/Tunis", id: "Africa/Tunis" },
    { name: "Africa/Harare", id: "Africa/Harare" },
    { name: "Africa/Nairobi", id: "Africa/Nairobi" },
    { name: "Europe/Warsaw", id: "Europe/Warsaw" },
    { name: "Europe/Prague", id: "Europe/Prague" },
    { name: "Europe/Budapest", id: "Europe/Budapest" },
    { name: "Europe/Sofia", id: "Europe/Sofia" },
    { name: "Europe/Istanbul", id: "Europe/Istanbul" },
    { name: "Europe/Athens", id: "Europe/Athens" },
    { name: "Europe/Bucharest", id: "Europe/Bucharest" },
    { name: "Asia/Nicosia", id: "Asia/Nicosia" },
    { name: "Asia/Beirut", id: "Asia/Beirut" },
    { name: "Asia/Damascus", id: "Asia/Damascus" },
    { name: "Asia/Jerusalem", id: "Asia/Jerusalem" },
    { name: "Asia/Amman", id: "Asia/Amman" },
    { name: "Africa/Tripoli", id: "Africa/Tripoli" },
    { name: "Africa/Cairo", id: "Africa/Cairo" },
    { name: "Africa/Johannesburg", id: "Africa/Johannesburg" },
    { name: "Europe/Moscow", id: "Europe/Moscow" },
    { name: "Asia/Baghdad", id: "Asia/Baghdad" },
    { name: "Asia/Kuwait", id: "Asia/Kuwait" },
    { name: "Asia/Riyadh", id: "Asia/Riyadh" },
    { name: "Asia/Bahrain", id: "Asia/Bahrain" },
    { name: "Qatar", id: "Asia/Qatar" },
    { name: "Asia/Aden", id: "Asia/Aden" },
    { name: "Asia/Tehran", id: "Asia/Tehran" },
    { name: "Africa/Khartoum", id: "Africa/Khartoum" },
    { name: "Africa/Djibouti", id: "Africa/Djibouti" },
    { name: "Africa/Mogadishu", id: "Africa/Mogadishu" },
    { name: "Asia/Dubai", id: "Asia/Dubai" },
    { name: "Asia/Muscat", id: "Asia/Muscat" },
    { name: "Asia/Baku", id: "Asia/Baku" },
    { name: "Asia/Kabul", id: "Asia/Kabul" },
    { name: "Asia/Yekaterinburg", id: "Asia/Yekaterinburg" },
    { name: "Asia/Tashkent", id: "Asia/Tashkent" },
    { name: "Asia/Calcutta", id: "Asia/Calcutta" },
    { name: "Asia/Kathmandu", id: "Asia/Kathmandu" },
    { name: "Asia/Novosibirsk", id: "Asia/Novosibirsk" },
    { name: "Asia/Almaty", id: "Asia/Almaty" },
    { name: "Asia/Dacca", id: "Asia/Dacca" },
    { name: "Asia/Krasnoyarsk", id: "Asia/Krasnoyarsk" },
    { name: "Asia/Bangkok", id: "Asia/Bangkok" },
    { name: "Asia/Saigon", id: "Asia/Saigon" },
    { name: "Asia/Jakarta", id: "Asia/Jakarta" },
    { name: "Asia/Irkutsk", id: "Asia/Irkutsk" },
    { name: "Asia/Shanghai", id: "Asia/Shanghai" },
    { name: "Asia/Hong_Kong", id: "Asia/Hong_Kong" },
    { name: "Asia/Taipei", id: "Asia/Taipei" },
    { name: "Asia/Kuala_Lumpur", id: "Asia/Kuala_Lumpur" },
    { name: "Asia/Singapore", id: "Asia/Singapore" },
    { name: "Australia/Perth", id: "Australia/Perth" },
    { name: "Asia/Yakutsk", id: "Asia/Yakutsk" },
    { name: "Asia/Seoul", id: "Asia/Seoul" },
    { name: "Asia/Tokyo", id: "Asia/Tokyo" },
    { name: "Australia/Darwin", id: "Australia/Darwin" },
    { name: "Australia/Adelaide", id: "Australia/Adelaide" },
    { name: "Asia/Vladivostok", id: "Asia/Vladivostok" },
    { name: "Pacific/Port_Moresby", id: "Pacific/Port_Moresby" },
    { name: "Australia/Brisbane", id: "Australia/Brisbane" },
    { name: "Australia/Sydney", id: "Australia/Sydney" },
    { name: "Australia/Hobart", id: "Australia/Hobart" },
    { name: "Asia/Magadan", id: "Asia/Magadan" },
    { name: "Pacific/Noumea", id: "Pacific/Noumea" },
    { name: "Asia/Kamchatka", id: "Asia/Kamchatka" },
    { name: "Pacific/Fiji", id: "Pacific/Fiji" },
    { name: "Pacific/Auckland", id: "Pacific/Auckland" },
    { name: "Asia/Kolkata", id: "Asia/Kolkata" },
    { name: "Europe/Kiev", id: "Europe/Kiev" },
    { name: "America/Tegucigalpa", id: "America/Tegucigalpa" },
    { name: "Pacific/Apia", id: "Pacific/Apia" },
  ];
  const [Recurringenabled,setRecurringenabled]=useState(false);
  const[ReccuranceDescription,setReccuranceDescription]=useState("")
  //type 1=daily
  //type 2 =Weekly
  //type 3= Monthly
  //endDateTime=end date
  //endTimes =0 for no end date
  // endTimes=1-60 for occurances
  //repeatInterval=Repeat every days count
  //weeklyDays=(for type 2) 1-7 for representing sun-sat for sun,monday give as 1,2
 // monthlyDay= monthly of occurson day
 //monthlyWeek= -1 - Last week of the month.
        // 1 - First week of the month.
        // 2 - Second week of the month.
        // 3 - Third week of the month.
        // 4 - Fourth week of the month.
 //monthlyWeekDay=for sun-mon selection in occurs on in monthly field
  const[Reccuranceobject,setReccuranceobject]=useState({
   endDateTime :"",
    endTimes :'0',
    monthlyDay :'',
    monthlyWeek :'',
    monthlyWeekDay :'',
    repeatInterval :'1',
    type : '1',
  weeklyDays :'',
   })
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    ampm: "",
    hours:"",
    minutes:"",
  });

  const [zoomrequest, setzoomrequest] = useState({
    agenda: "",
    duration: "",
    password:"",
    recurrence:Reccuranceobject,
    settings: {
      audio: "",
      autoRecording: "",
      emailNotification: true,
      hostVideo: false,
      joinBeforeHost: true,
      meetingInvitees: [
        
      ],
      waitingRoom:false,
      muteUponEntry: true,
      participantVideo: false,
      pushChangeToCalendar: true,
    },
    startTime: "",
    timezone: "",
    topic: "",
    type: 2,
  });
  
    const [inviteesError, setInviteesError] = useState(false);
  //type:2=without reccurance
  //type:3= reccurance with no fixedd time
  // type:8 =reccurance with fixed time
  const handleReccuEnable = () => {
   
    setRecurringenabled((prevEnabled) => {
      const newEnabledState = !prevEnabled;
  
      // Update zoomrequest based on the new state of Recurringenabled.
      setzoomrequest((prev) => ({
        ...prev,
        type: newEnabledState ? 8 : 2, // Set type to 8 if enabled, otherwise 2.
    }));
  
      return newEnabledState;
    });
    setReccuranceDescription("")
  };
      const fetchItems = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/zoom/get/meet/${meetingId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        if (response.data) {
 
  if(response.data.recurrence){
            setReccuranceobject(response.data.recurrence)
            setRecurringenabled(true)
            }
  setzoomrequest(response.data);
  const startTime = response.data.startingTime; // UTC start time
  const starttimefordate=response.data.startTime;
  const localdate=new Date(starttimefordate);
  
  const localStartTime = new Date(startTime);

// Format the local date
const formattedDate = localStartTime.toLocaleDateString('en-CA'); // 'en-CA' gives you the "YYYY-MM-DD" format

  const time = localStartTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).slice(0, 5); // Get "hh:mm" format
  
  // Determine AM/PM
  const ampm = localStartTime.getHours() >= 12 ? 'PM' : 'AM';
  
  // Calculate hours and minutes for the duration
  let hours = 0;
  let minutes = 0;
  if (zoomrequest.duration) {
    hours = Math.floor(zoomrequest.duration / 60);
    minutes = zoomrequest.duration % 60;
  }
  
  // Populate form data
  setFormData({
    ...formData,
    date: formattedDate,
    time: time,
    ampm: ampm,
    hours: hours,
    minutes: minutes,
  });
  
  setSelectedEmails([...response.data.settings.groupinviteeDto]);
  getupdatedstartime(formattedDate,time,ampm)
  
  

          
        }
      } catch (error) {
        if(error.response && error.response.status===204){
          navigate('/notFound');
        }else{
        console.error(error);
        throw error
        }
      }
    };
  useEffect(() => {
    fetchItems()
  }, []);

  const handleAutoRecordingChange = (event) => {
    const val = event.target.checked ? "local" : "none";
    setzoomrequest((prevZoomRequest) => ({
      ...prevZoomRequest,
      settings: {
        ...prevZoomRequest.settings,
        autoRecording: val,
      },
    }));
  };
  const handleOptionsChange = (event) => {
    const { name, checked } = event.target;
    setzoomrequest((prevZoomRequest) => ({
      ...prevZoomRequest,
      settings: {
        ...prevZoomRequest.settings,
        [name]: checked,
      },
    }));
  };

  const handleEmailRemove = (emailToRemove) => {
    setSelectedEmails((prev) => {
      const updated = new Set(prev);
      updated.delete(emailToRemove);
      setzoomrequest((prevZoomRequest) => ({
        ...prevZoomRequest,
        settings: {
          ...prevZoomRequest.settings,
          groupinviteeDto:[...updated] ,
        },
      }));
      return [...updated];
    });
  };
  const handleEmailClick = (email) => {
   
    setSelectedEmails((prev)=>{
      const updated=new Set(prev);
      updated.add(email)
      setzoomrequest((prevZoomRequest) => ({
        ...prevZoomRequest,
        settings: {
          ...prevZoomRequest.settings,
          groupinviteeDto:[...updated] ,
        },
      }));
      return [...updated]
    })
    setInviteesError(false);
     setSearchQuery("");
     setUsers([]);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const token = sessionStorage.getItem("token"); // Adjust based on where you store the token
      const role = sessionStorage.getItem("role"); // Retrieve the role from session storage

      let url;
      
      if (role === "TRAINER") {
        url = `${baseUrl}/search/usersbyTrainer`;
      } else if (role === "ADMIN") {
        url = `${baseUrl}/search/users`;
      } else {
        console.error("Role is not defined or not recognized");
        return;
      }
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
          params: {
            query,
          },
        });
       
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error
      }
    } else {
      setUsers([]);
    }
  };
  
  const generateTimeOptions = () => {
    const times = [];
    const start = moment().startOf("day"); // Start at 00:00
    for (let i = 0; i < 24 * 2; i++) {
      // 24 hours with 30 minutes intervals
      times.push(start.format("hh:mm")); // Format as "h:mm" for 12-hour format without AM/PM
      start.add(30, "minutes");
    }
    return times;
  };
  
  const originalList = generateTimeOptions();
  const timeOptions = [...new Set(originalList)]; // Remove any duplicates, if necessary

  const getupdatedstartime = (date,time,ampm) => {
    
  
    const timezone = zoomrequest.timezone;
  
    // Convert 12-hour time to 24-hour time
    let [hours, minutes] = time.split(":").map(Number);
    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
  
    // Combine date and time into a single string
    const dateTimeString = `${date} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  
    // Convert to the specified timezone and format without 'Z'
    const formattedStartTime = moment.tz(dateTimeString, timezone).format("YYYY-MM-DDTHH:mm:ss");
  
    // Update zoomrequest state with the newly calculated startTime
    setzoomrequest((prevRequest) => ({
      ...prevRequest,
      startTime: formattedStartTime,
    }));
  
  };
  
  const updateStartTime = (event) => {
    const { name, value } = event.target;
    // Update formData for controlled inputs
    setFormData((prevData) => {
      const newFormData = {
        ...prevData,
        [name]: value,
      };
  
      const { date, time, ampm } = newFormData;
      const timezone = zoomrequest.timezone;
  
      if (!date || !time || !ampm || !timezone) return prevData;
  
      // Convert 12-hour time to 24-hour time
      let [hours, minutes] = time.split(":").map(Number);
      if (ampm === "PM" && hours < 12) {
        hours += 12;
      } else if (ampm === "AM" && hours === 12) {
        hours = 0;
      }
  
      // Combine date and time into a single string
      const dateTimeString = `${date} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  
      // Convert to the specified timezone and format without 'Z'
      const formattedStartTime = moment.tz(dateTimeString, timezone).format("YYYY-MM-DDTHH:mm:ss");
  
      // Update zoomrequest state with the newly calculated startTime
      setzoomrequest((prevRequest) => ({
        ...prevRequest,
        startTime: formattedStartTime,
      }));
  
  
      return newFormData;
    });
  };
  
  

  const handleTimeChange = (event) => {
    const hours = parseInt(document.getElementById("hrs").value, 10);
    const minutes = parseInt(document.getElementById("min").value, 10);
    const totalMinutes = hours * 60 + minutes;

    setzoomrequest((prevState) => ({
      ...prevState,
      duration: totalMinutes,
    }));
  };

  const handleChangeFields = (e) => {
    const { name, value } = e.target;

    setzoomrequest((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
  };
  
    // Normalize the date to ignore time portion
   
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedEmails.length === 0) {
    setInviteesError(true);
    return;
  } else {
    setInviteesError(false);
  }

     
      const updatedZoomRequest = {
        ...zoomrequest,
        recurrence:Reccuranceobject,
      };
      console.log("REQUEST=",updatedZoomRequest);
     
      setissubmitting(true);
      const response = await axios.patch(
        `${baseUrl}/api/zoom/meet/${meetingId}`,
        updatedZoomRequest,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setissubmitting(false)
      MySwal.fire({
        title: "updated!",
        text: "Meeting Updated Successfully",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
    fetchItems();
      });
    
    } catch (error) {
      setissubmitting(false);
      if (error.response && error.response.status === 400) {
        MySwal.fire({
          title: "Error!",
          text: `${error?.response?.data}`,
          icon: "error",
          confirmButtonText: "OK",
        });
      }else{
      // Handle network errors or other exceptions
      // MySwal.fire({
      //   title: "Error!",
      //   text: "Some Unexpected Error occurred. Please try again later.",
      //   icon: "error",
      //   confirmButtonText: "OK",
      // });
      throw error
      }
    }
  };
  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    if(newPassword.length>=1){
    setzoomrequest({
      ...zoomrequest,
      password: newPassword,
    });
  }
  };
  return (
    <div>
    <div className="page-header"></div>
    <div className="card">
      <div className="card-body">
        {/* <iframe src={`https://zoom.us/wc/72340865879/join?pwd=2V0wNf&uname=Akshaya`}width="100%" height="600px"></iframe> */}
      <div className="row">
      <div className="col-12">
      <div className={`outerspinner ${issubmitting? 'active' : ''}`}>
        <div className="spinner"></div>
      </div>
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
          <h4>Edit a Meeting</h4>
         
            <div className="form-group row">
              <label htmlFor="topic"  className="col-sm-2 col-form-label">
                Meeting Title <span className="text-danger">*</span>
              </label>
              <div className=" col-sm-9">
                <input
                  type="text"
                  id="topic"
                  value={zoomrequest.topic}
                  name="topic"
                  onChange={handleChangeFields}
                  className="form-control   "
                  placeholder="Title"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="agenda" className="col-sm-2 col-form-label">
                Meeting Descrition <span className="text-danger">*</span>
              </label>
              <div className=" col-sm-9">
                <input
                  type="text"
                  id="agenda"
                  name="agenda"
                  onChange={handleChangeFields}
                  value={zoomrequest.agenda === null ? "" : zoomrequest.agenda}
                  className="form-control   "
                  placeholder="Description"
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="timezone" className="col-sm-2 col-form-label">
                Time Zone <span className="text-danger">*</span>
              </label>
              <div className=" col-sm-9">
                <select
                  id="timezone"
                  className="form-control  "
                  name="timezone"
                  value={zoomrequest.timezone}
                  onChange={handleChangeFields}
                  required
                >
                  {timezones.map((code, index) => (
                    <option key={index} value={code.id}>
                      {code.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group row">
        <label className="col-sm-2 col-form-label">
          
        </label>
        <div className="col-sm-9" style={{display:"flex"}}>
          <input type="checkbox" className="check" onChange={handleReccuEnable} checked={Recurringenabled}/> 
          <p>Recurring meeting
          </p> <h5 className="pl-2">{ReccuranceDescription}</h5>
        </div>
      </div>
      {Recurringenabled && 
      <EditReccuringMeet 
      setReccuranceDescription={setReccuranceDescription}
       setzoomrequest={setzoomrequest}
       Reccuranceobject={Reccuranceobject} 
      setReccuranceobject={setReccuranceobject}
      reccurance={reccurance}
      setreccurance={setreccurance}/>}

            <div className="form-group row">
              <label htmlFor="when" className="col-sm-2 col-form-label">
                When <span className="text-danger">*</span>
              </label>
             
              <div className="datetimegrp col-sm-9">
                <input
                  type="date"
                  id="date"
                  name="date"
                  min={formattedDate}
                  value={formData.date || ""}
                  onChange={updateStartTime}
                  className="form-control  "
                  required
                />
                <select
                  id="time"
                  name="time"
                  value={formData.time || ""}
                  onChange={updateStartTime}
                  className="form-control  "
                >
                  {timeOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  id="ampm"
                  name="ampm"
                  value={formData.ampm || ""}
                  onChange={updateStartTime}
                  className="form-control  "
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {Productversion != null && Productversion === "FREE" ? (
              <div className="form-group row">
                <label htmlFor="duration" className="col-sm-2 col-form-label">
                  Duration <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9 ml-1 row">
  <input
    className="form-control col-sm-10"
    readOnly
    value={zoomrequest.duration ? zoomrequest.duration : 40}
  />
  <label className="col-form-label col-sm-2 d-flex align-items-center">min</label>
</div>

              </div>
            ) : (
              <div className="form-group row">
                <label htmlFor="duration" className="col-sm-2 col-form-label">
                  Duration <span className="text-danger">*</span>
                </label>
                
                <div className="datetimegrp col-sm-9">
                  <select
                    id="hrs"
                    value={formData.hours || ""}
                    name="hrs"
                    onChange={handleTimeChange}
                    className="form-control   "
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                  <p className="mt-3">hours</p>
                  <select
                    id="min"
                    name="min"
                    value={formData.minutes || ""}
                    onChange={handleTimeChange}
                    className="form-control   "
                  >
                    <option value="0">0</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                  <p className="mt-3">Minutes</p>
                </div>
              </div>
            )}

<div className="form-group row">
              <label htmlFor="invitees"className="col-sm-2 col-form-label">
                Invitees
                <span className="text-danger">*</span>
              </label>
              <div className="col-sm-9">
                <div className="inputlike">
                {selectedEmails.length >0 &&(
                  <div className="listemail"> {selectedEmails.map((email,index)=> 
                <div key={index}  className="selectedemail">
                    {email.name} <i onClick={() => handleEmailRemove(email)} className="fa-solid fa-xmark"></i>
                  </div>)}</div>)}
            
                <input
                  type="input"
                  id="customeinpu"
        className={`form-control ${inviteesError ? "is-invalid" : ""}`}
                  placeholder="search member or Batch..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {inviteesError && (
        <div className="invalid-feedback">
          Please add at least one invitee.
        </div>
      )}
                </div>
                {users.length > 0 && (
                  <div className="user-list">
                    {users.map((user,index) => (
                      <div key={index} className="usersingle">
                        <label id="must" className="p-1" htmlFor={user} onClick={() => handleEmailClick(user)}>
                          {user.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="options"className="col-sm-2 col-form-label">
                Security <span className="text-danger">*</span>
              </label>
              <div className="col-sm-9">
                <div className="zoomopt">
                <input
                    type="checkbox"
                    checked
                    disabled
                  /> 
<div style={{display:"flex"}}>
                  <p>Passcode</p>
                  <input
        type="text"
        name="password"
        value={zoomrequest.password}
        className="form-control form-control-sm col-sm-3 ml-3"
        onChange={handlePasswordChange}
      />
                </div>
                <div className="zoomopt">
                  <input
                    type="checkbox"
                    name="waitingRoom"
                    checked={zoomrequest.settings.waitingRoom}
                    onChange={handleOptionsChange}
                 
                  />
                  <p>Waiting Room</p>
                </div>
             </div>
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="video" className="col-sm-2 col-form-label">
                Video <span className="text-danger">*</span>
              </label>
              <div className="col-sm-9">
                <div className="zoomset">
                  <p>Host</p>
                  <input
                    type="radio"
                    name="hostVideo"
                    value="true" // Add a value to the input
                    checked={zoomrequest.settings.hostVideo }
                    onChange={(e) => {
                      setzoomrequest((prevZoomRequest) => ({
                        ...prevZoomRequest,
                        settings: {
                          ...prevZoomRequest.settings,
                          hostVideo: e.target.value === "true", // Update hostVideo based on the value
                        },
                      }));
                    }}
                  />
                  <p>On</p>
                  <input
                    type="radio"
                    name="hostVideo"
                    value="false" // Add a value to the input
                    checked={!zoomrequest.settings.hostVideo}
                    onChange={(e) => {
                      setzoomrequest((prevZoomRequest) => ({
                        ...prevZoomRequest,
                        settings: {
                          ...prevZoomRequest.settings,
                          hostVideo: e.target.value === "true",
                        },
                      }));
                    }}
                  />
                  <p>Off</p>
                </div>
                <div className="zoomset">
                  <p>Participant</p>
                  <input
                    type="radio"
                    name="participantVideo"
                    value="true" // Add a value to the input
                    checked={zoomrequest.settings.participantVideo}
                    onChange={(e) => {
                      setzoomrequest((prevZoomRequest) => ({
                        ...prevZoomRequest,
                        settings: {
                          ...prevZoomRequest.settings,
                          participantVideo: e.target.value === "true", // Update participantVideo based on the value
                        },
                      }));
                    }}
                  />
                  <p>On</p>
                  <input
                    type="radio"
                    name="participantVideo"
                    value="false" // Add a value to the input
                    checked={!zoomrequest.settings.participantVideo}
                    onChange={(e) => {
                      setzoomrequest((prevZoomRequest) => ({
                        ...prevZoomRequest,
                        settings: {
                          ...prevZoomRequest.settings,
                          participantVideo: e.target.value === "true", // Update hostVideo based on the value
                        },
                      }));
                    }}
                  />
                  <p>Off</p>
                </div>
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="options" className="col-sm-2 col-form-label">
                Options <span className="text-danger">*</span>
              </label>
              <div className="col-sm-9">
                <div className="zoomopt">
                  <input
                    type="checkbox"
                    name="joinBeforeHost"
                    checked={zoomrequest.settings.joinBeforeHost}
                    onChange={handleOptionsChange}
                  />
                  <p>Allow Participant to Join Anytime</p>
                </div>
                <div className="zoomopt">
                  <input
                    type="checkbox"
                    name="muteUponEntry"
                    checked={zoomrequest.settings.muteUponEntry}
                    onChange={handleOptionsChange}
                  />
                  <p>Mute Participant upon Entry</p>
                </div>
                <div className="zoomopt">
                {Productversion!=null && Productversion==="FREE" ? <div className="boxtype"></div> :(
                  <input
                    type="checkbox"
                    name="autoRecording"
                    checked={zoomrequest.settings.autoRecording === "local"}
                    onChange={handleAutoRecordingChange}
                  />)}
                  <p>Automatically Record Video On Local Computer</p>
                </div>
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
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={issubmitting}
            >
              Update
            </button>
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditMeeting;
