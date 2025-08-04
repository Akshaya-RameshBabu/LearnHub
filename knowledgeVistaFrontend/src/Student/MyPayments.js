import React, { useEffect, useState } from 'react'
import baseUrl from '../api/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyPayments = () => {
  const navigate=useNavigate();
    const token=sessionStorage.getItem("token")
    const[paymenthistory,setpaymenthistory]=useState([{
       id:"",
       orderId:"",
       userId:"",
       courseId:"",
       batchId:"",
       batchName:"",
       courseName:"",
	    paymentId:"",
	    installmentnumber:"",
        status:"",
        amountReceived:"",
         amountNeedTopay:"",
	    date:"",   
      paymentType:""
    }]);

    const filterData = () => {
      if (filterOption === "All") {
        return paymenthistory;
      } else if (filterOption === "created") {
        return paymenthistory.filter(pay => pay.status === "created");
      } else if (filterOption === "attempted") {
        return paymenthistory.filter(pay => pay.status === "attempted");
      } else if(filterOption==="paid"){
      return paymenthistory.filter(pay=>pay.status==="paid")
      }
      else if(filterOption==="search"){
        return paymenthistory.filter(pay => pay.courseName && pay.courseName.toLowerCase().includes(searchQuery.toLowerCase()));
      }
    };
    
  const [filterOption, setFilterOption] = useState("All");
  const [searchQuery, setSearchQuery] = useState('');
    const fetchData = async () => {
          try {
            // Fetch data from server
            const response = await axios.get(`${baseUrl}/myPaymentHistory`,{
              headers:{
                Authorization:token
              }
            });
            if (response.status === 200) {
              const data = response.data;
              const payhistory =data.reverse();
              setpaymenthistory(payhistory);

            } else if (response.status === 204) {
              setpaymenthistory([]);
            }           
          } catch (error) {
            if(error.response.status===401){
              navigate("/unauthorized")
            }
           else{
            throw error
            }
          }
        };
    useEffect(() => {
        fetchData();
      }, []);
  return (
    <div>
    <div className="page-header"></div>
    <div className='row'>
      <div className='col-sm-12'>
        <div className='card'>
          <div className='card-header'>
    <div className='navigateheaders'>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
    <div className="tableheader3">
      <h4>Payment History</h4>
      <div style={{display:'grid',gridTemplateColumns:"10fr 6fr "}}>
      <input
        className="form-control tabinp "  
        type="search"
        id="searchbtn"
        placeholder="Search by Course Name"
        aria-label="Search"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setFilterOption("search");
        }}/>
                   <select
                    className=" btn btn-success  text-left  selectstyle"
                  
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                  >
                    <option  className='bg-light text-dark ' value="All">All</option>
                    <option className='bg-light text-dark' value="created">Created</option>
                    <option className='bg-light text-dark' value="attempted">Attempted</option>
                    <option className='bg-light text-dark' value="paid">Paid</option>
                  </select>
       </div>
       </div>
       </div>
       <div className='card-body'>
      <div className="table-container">
        <table className="table table-hover table-bordered table-sm">
          <thead className='thead-dark'>
            <tr>
            <th scope="col">Batch Name</th>
              <th scope="col">Installment Number</th>
              <th scope="col">Payment Id</th>
              <th scope='col'>Gateway</th>
              <th scope="col">Order Id</th>
              <th scope="col">Amount Paid</th>
              <th scope="col"> Date </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
          {filterData().map((payment) => (
             <tr key={payment.id}>
                <td className='py-2'>{payment.batchName}</td>
                <td  className='py-2'> {payment.installmentnumber}</td>
                <td className='py-2'>{payment.paymentId}</td>
                <td  className='py-2'> {payment.paymentType}</td>
                <td className='py-2'>{payment.orderId}</td>
                <td className='py-2'>{payment.amountReceived}</td>
                <td className='py-2'>{payment.date}</td>
                <td className='py-2'>{payment.status}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>
      </div>
    </div>
  </div>
  )
}

export default MyPayments
