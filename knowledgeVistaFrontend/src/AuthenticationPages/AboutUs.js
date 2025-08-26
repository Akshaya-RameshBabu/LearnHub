import React, { useState, useEffect } from 'react';
import baseUrl from '../api/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  
  const [isDataList, setIsDataList] = useState(null);
  const navigate=useNavigate();
  const token=sessionStorage.getItem("token")
  const[loading,setloading]=useState(false)
  useEffect(() => {
    
    const fetchData = async () => {
      try {
        setloading(true)
        const response = await axios.get(`${baseUrl}/api/v2/GetAllUser`,{
          headers:{
            "Authorization":token,
            }
          });
  
        if (response.status !== 200) {
          console.error('Error fetching data:');
        }
  
        const data = response.data;
        setIsDataList(data.dataList);
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error
      }finally{
        setloading(false)
      }
    };
  
    fetchData();
  
  }, []); 
const skleton=(
  <div>
 <div className='twosplit'>

  {/* Product Name */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Product name :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* HotFix Installed */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>HotFix Installed (if any) :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* Company Name */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Company Name :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* Contact Support No */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Contact Support No :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* Product Version */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Product Version :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* Contact Email */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Contact E-Mail :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-title"></div>
    </div>
  </div>

  {/* Feedback (input box) */}
  <div className='form-group row'>
    <label className="col-sm-6 col-form-label"><b>Feedback :</b></label>
    <div className="col-sm-6 col-form-label">
      <div className="skeleton skeleton-input"></div>
    </div>
  </div>
</div>
 <div className='modal-footer  '>
                    <div
                      className='skeleton skeleton-button mt-3'
                    > </div>
                  </div>
                  </div>)

  return (
    <div>
    <div className="page-header"></div>
    <div className="card">
      <div className="card-body">
      <div className="row">
      <div className="col-12">
      <div className='navigateheaders'>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-arrow-left"></i></div>
      <div></div>
      <div onClick={()=>{navigate(-1)}}><i className="fa-solid fa-xmark"></i></div>
      </div>
              <h4 style={{ textAlign: "center" }}>Product Info</h4>
              {loading? skleton:(
<div>
           <div className='twosplit'>
              
                    <div className='form-group row'>
                      <label className="col-sm-6 col-form-label"><b>Product name :</b> </label>
                    
                      <label className="col-sm-6 col-form-label">{isDataList && isDataList.length > 0?isDataList[0].ProductName:""}</label>
                    </div>
                 
                    <div className='form-group row'>
                      <label   className="col-sm-6 col-form-label"><b>HotFix Installed (if any) :</b> </label>
                    
                      <label  className="col-sm-6 col-form-label">NO </label>
                    </div>
                
                    <div className='form-group row'>
                      <label  className="col-sm-6 col-form-label"><b>Company Name :</b> </label>
                    
                      <label  className="col-sm-6 col-form-label">{isDataList && isDataList.length > 0?isDataList[0].CompanyName:""}</label>
                    </div>
               
                    <div className='form-group row'>
                      <label  className="col-sm-6 col-form-label"><b>Contact Support No :</b> </label>
                 
                      <label className="col-sm-6 col-form-label">{isDataList && isDataList.length> 0?isDataList[0].Contact:""} </label>
                    </div>
                 
                
                    <div className='form-group row'>
                      <label  className="col-sm-6 col-form-label" ><b>Product Version :</b> </label>
                      
                      <label className="col-sm-6 col-form-label">{isDataList && isDataList.length> 0?isDataList[0].version:""} </label>
                    </div>
                 
                    <div className='form-group row'>
                      <label className="col-sm-6 col-form-label" ><b>Contact E-Mail :</b> </label>
                      
                      <label className="col-sm-6 col-form-label">{isDataList && isDataList.length > 0?isDataList[0].Email:""}</label>
                    </div>
                
                         
               
               
                      <div className='form-group row'>
                        <label  className="col-sm-6 col-form-label"> <b>Feedback :</b></label>
                   
                        <div className="col-sm-6 col-form-label">
                        <input
                          className='form-control'
                          readOnly
                          value=" " />
                          </div>
                      </div>
                  
                 
                 
                
                </div> 
                <div className='modal-footer mt-5'>
                    <button
                      className='btn btn-primary'
                    > Send</button>
                  </div>
                  </div>)}
              </div>
</div>
</div>
</div>
          </div>
  
     
  )
}

export default AboutUs