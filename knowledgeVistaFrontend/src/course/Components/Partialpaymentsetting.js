import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import baseUrl from "../../api/utils";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Partialpaymentsetting = () => {
  
    const [installmentData, setInstallmentData] = useState([]);
        const MySwal = withReactContent(Swal);
    const [durations, setDurations] = useState([]);
  const [noOfInstallments, setNoOfInstallments] = useState(2);
  const [noofDuration, setnoofDuration] = useState(1);
  const[batchAmount,setbatchAmount]=useState();
   const {batchTitle,batchId}=useParams();
    const [enablechecked, setenablechecked] = useState(false);
    const token=sessionStorage.getItem("token")
  const navigate = useNavigate();
  const[batch,setbatch]=useState({
        batchName:"",
        amount:"",
        id:""
      })
    useEffect(() => {
        const fetchpartpaydata = async () => {
            try {
                const response = await axios.get(`${baseUrl}/viewPaymentList/${batchId}`, {
                    headers: {
                        "Authorization": token
                    }
                });
                const data = await response.data;
              
                if (response.status===200) {
                    setbatch((prev)=>({
                      ...prev,
                      batchName: data?.batchTitle,
                      amount:data?.batchAmount,
                      batchId:data?.batchId
                 } ))
                 setbatchAmount(data?.batchAmount)
                 if(data?.batchInstallments.length>0){
                    setInstallmentData(data?.batchInstallments)
                    setNoOfInstallments(data?.batchInstallments.length)
                 }
                
                }   
            } catch (error) {
              if(error.response){
                if(error.response.status===401){
                  MySwal.fire({
                    title: "Un Authorized",
                    text: error.response.data ? error.response.data : "error occured",
                    icon: "error",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      navigate(-1);
                       }
                  });
                }else if(error.response.status===404){
                  setenablechecked(false)
                  MySwal.fire({
                    title: "Not Found",
                    text: error.response.data ? error.response.data : "error occured",
                    icon: "warning",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      navigate(-1);
                       }
                  });
                }
              }else{
                // MySwal.fire({
                //   title: "Error!",
                //   text: "An error occurred . Please try again later.",
                //   icon: "error",
                //   confirmButtonText: "OK",
                // });
                throw error
              }
            }
        }
    
        fetchpartpaydata(); // Call the async function
    
        // Add any dependencies if needed
    }, []);
  // Calculate initial installment data on component mount or noOfInstallments change
  useEffect(() => {
    if (noOfInstallments >= 1) {
      let newInstallmentData = [];
      let newDurations = [];

      for (let i = 0; i < noOfInstallments; i++) {
        newInstallmentData.push({
          InstallmentNumber: `${i + 1}`,
          InstallmentAmount: batchAmount / noOfInstallments,
          DurationInDays: i === 0 ? 0 : 15,
        });

        if (i < noOfInstallments - 1) {
          newDurations.push(15);
        }
      }

      setInstallmentData(newInstallmentData);
      setDurations(newDurations);
    } else {
      setInstallmentData([]);
      setDurations([]);
    }
  }, [noOfInstallments, batchAmount]);
  const handleSubmit = async () => {
    if (!enablechecked) {
     navigate("/batch/viewall")
    }
  console.log(installmentData);
    try {
      const response = await axios.post(
        `${baseUrl}/Batch/Save/PartPayDetails`, 
        installmentData, // Send only installmentDetails as request body
        {
          headers: {
            "Authorization": token
          },
          params: { batchId: batchId } // Send batchId as RequestParam
        }
      );
  
      if (response.status===200) {
        MySwal.fire({
          title: "Saved ",
          text: "Installments Saved  sucessfully !",
          icon: "success",
        })
        navigate("/batch/viewall")
      }
    } catch (error) {
      console.error("Error saving installments:", error);
        MySwal.fire({
                                toast:true,
                          position: 'top-end', 
                          icon: 'error',
                          title: 'Something Went Wrong Please Try again later !',
                          showConfirmButton: false,
                          timer: 3000,
                          timerProgressBar: true,
                          didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer);
                            toast.addEventListener('mouseleave', Swal.resumeTimer);
                          }
                        });
    }
  };
  
  const installmentChange = (e, index) => {
    const newInstallmentAmount = parseFloat(e.target.value);
    if (newInstallmentAmount > 0) {
      const updatedInstallmentData = [...installmentData];
      updatedInstallmentData[index].InstallmentAmount = newInstallmentAmount;

      // Recalculate remaining installments if needed
      if (index < noOfInstallments - 1) {
        let remainingAmount = batchAmount; // Start with total course amount
        for (let i = 0; i <= index; i++) {
          // Subtract updated amounts of previous installments
          remainingAmount -= updatedInstallmentData[i].InstallmentAmount;
        }
        const remainingInstallments = noOfInstallments - index - 1;
        const remainingInstallmentAmount =
          remainingAmount / remainingInstallments;
        for (let i = index + 1; i < noOfInstallments; i++) {
          updatedInstallmentData[i].InstallmentAmount =
            remainingInstallmentAmount;
        }
      }

      setInstallmentData(updatedInstallmentData);
    }
  };

  const installmentnoChange = (e) => {
    const newNoOfInstallments = parseInt(e.target.value, 10);
    if (newNoOfInstallments >= 2) {
      setNoOfInstallments(newNoOfInstallments);
      setnoofDuration(newNoOfInstallments - 1);
    }
  };

  function getOrdinalSuffix(num) {
    const ones = num % 10;
    const tens = Math.floor(num / 10) % 10;
    if (tens === 1) {
      return num + "th";
    } else {
      switch (ones) {
        case 1:
          return num + "st";
        case 2:
          return num + "nd";
        case 3:
          return num + "rd";
        default:
          return num + "th";
      }
    }
  }
  return (
    <div>
    <div className="page-header"></div>
    <div className="card">
      <div className="card-body">
      
          <div className="row">
            <div className="col-12">
        <div className="navigateheaders">
          <div
            onClick={() => {
             navigate(-1)
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
        <h4> Partial Payment Settings for {batch.batchName}</h4>

        <hr />
        <h6 className="checkboxes-lg">
          <input
            type="checkbox"
            className="mr-2"
            name="check"
            disabled={batchAmount <= 0}
            checked={enablechecked}
            onChange={() => {
              if(batchAmount!=0){
              setenablechecked(!enablechecked);
              }
            }}
          />
          <span htmlFor="check" style={{ display: "inline" }}>
            Enable Partial Payment
          </span>
          </h6>
        
        {enablechecked ? (
          <>
  <div className="row">
    <div className="col-md-6">
      <div className="form-group row">
        <label className="col-sm-4 col-form-label">Batch Amount</label>
        <div className="col-sm-8">
          <input type="number" className="form-control" value={batch.amount} />
        </div>
      </div>
    </div>

    <div className="col-md-6">
      <div className="form-group row">
        <label className="col-sm-4 col-form-label">No of Installments</label>
        <div className="col-sm-8">
          <input
            type="number"
            className="form-control"
            value={noOfInstallments}
            onChange={installmentnoChange}
          />
        </div>
      </div>
    </div>
  </div>

            <div className="row mt-3" style={{marginBottom:"10px",minHeight:"250px" }}>
              <div className="col-md-6">
                {installmentData.map((installment, index) => (
                  <div key={index}>
                    <div className="form-group row pt-2">
                      <label  className="col-sm-4 col-form-label"> installment{installment.InstallmentNumber}</label>
                      <div className="col-sm-8">
                      <input
                        type="number"
                          className="form-control"
                        value={installment.InstallmentAmount}
                        onChange={(e) => installmentChange(e, index)}
                      />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-5 col-md-6">
                {durations.map((duration, index) => (
                  <div className="form-group row pt-2" key={index}>
                    <label  className="col-sm-4 col-form-label">
                      Duration for {getOrdinalSuffix(index + 2)} installment
                    </label>
                    <div className="col-sm-8">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="number"
                          className="form-control"
                        value={duration}
                        onChange={(e) => {
                          const updatedDurations = [...durations];
                          updatedDurations[index] = parseInt(
                            e.target.value,
                            10
                          );
                          if (e.target.value > 0) {
                            setDurations(updatedDurations);
                            const installmentdata = [...installmentData];
                            installmentdata[index + 1].DurationInDays =
                              parseInt(e.target.value, 10);
                          }
                        }}
                      />
                      <label style={{ marginLeft: "5px" }}>Days</label>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="row">
    <div className="col-md-6">
      <div className="form-group row">
                <label  className="col-sm-4 col-form-label">Batch Amount</label>
                <div className="col-sm-8">
                <input type="number" className="form-control" value={batch.amount} />
                </div>
                </div>
              </div>
              <div className="col-md-6">
              <div className="form-group row">
                <label  className="col-sm-4 col-form-label"> No of Installments </label>
                <div className="col-sm-8">
                <input
                  type="number"
                  className="form-control"
                  value=" "
                  readOnly
                />
                </div>
              </div>
            </div>
            </div>
            <div className="row mt-3" style={{marginBottom:"10px",minHeight:"250px"}}>
            <div className="col-md-6">
                <div className="form-group row pt-2">
                  <label  className="col-sm-4 col-form-label"> Installment 1</label>
                  <div className="col-sm-8">
                  <input type="number" className="form-control" readOnly />
                </div>
                </div>
                <div className="form-group row pt-2">
                <label  className="col-sm-4 col-form-label"> Installment 2</label>
                  <div className="col-sm-8">
                  <input type="number" className="form-control" readOnly />
                </div>
                </div>
              </div>

              <div className="pt-5 col-md-6">
                <div className="form-group row pt-5">
                  <label  className="col-sm-4 col-form-label">Duration for 2 nd installment</label>
                  <div className="col-sm-8">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input type="number" className="form-control" readOnly />
                    <label style={{ marginLeft: "5px" }}>Days</label>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="cornerbtn">
          <button
            className="btn btn-secondary"
            onClick={() => {
              navigate(-1)
            }}
          >
            cancel
          </button>
         {enablechecked ? <button
            className="btn btn-primary"
          onClick={handleSubmit}
          >
            Save
          </button>:<button className="btn btn-primary" onClick={()=>{navigate("/batch/viewall")}}>Skip</button>}
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default Partialpaymentsetting;
