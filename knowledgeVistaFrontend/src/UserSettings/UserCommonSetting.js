import React from "react";
import DisplayCourses from "./DisplayCourses";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "../ErrorBoundary";
import DisplaysocialLogin from "./DisplaysocialLogin";
import Sitesettings from "./Sitesettings";
import AttendanceThresholdMinutes from "./AttendanceThresholdMinutes";
import OpenRouterKeys from "./OpenRouterKeys";
const UserCommonSetting = () => {
  const navigate = useNavigate();
  return (
    <div>
    <div className="page-header">
    <div className="page-block">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="page-header-title">
                            <h5 className="m-b-10">Settings </h5>
                        </div>
                        <ul className="breadcrumb">
                            <li className="breadcrumb-item"><a href="#" onClick={()=>{ navigate("/dashboard/course")}} title="dashboard"><i className="feather icon-home"></i></a></li>
                            <li className="breadcrumb-item"><a href="#">General </a></li>
                        </ul>
                        
                    </div>
                </div>
            </div>
    </div>
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
              navigate(-1);
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </div>
        </div>
        <h4 >Settings</h4>
        <ErrorBoundary>
<OpenRouterKeys/>
</ErrorBoundary>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserCommonSetting;
