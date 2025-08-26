import React, { useEffect, useState, useContext } from "react";
import baseUrl from "../api/utils.js";
import axios from "axios";
import { GlobalStateContext } from "../Context/GlobalStateProvider.js";
import { Link, useNavigate } from "react-router-dom";
import $ from "jquery";
const Sidebar = ({ filter, handleFilterChange }) => {
  const [isvalid, setIsvalid] = useState();
  const [isEmpty, setIsEmpty] = useState();
  const [ActiveLink, setActiveLink] = useState();
  const userRole = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");

  const navigate = useNavigate();
  const { displayname, Activeprofile } = useContext(GlobalStateContext);
  const [joinUrl, setjoinUrl] = useState();
  const profile = sessionStorage.getItem("Activeprofile");
  const result = profile === "SAS" ? true : false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole !== "SYSADMIN" && token) {
          const response = await axios.get(`${baseUrl}/api/v2/GetAllUser`, {
            headers: {
              Authorization: token,
            },
          });

          const data = response.data;
          setIsEmpty(data.empty);
          setIsvalid(data.valid);
          sessionStorage.setItem("LicenceVersion", data.productversion);
          const type = data.type;
          sessionStorage.setItem("type", type);
        }
      } catch (error) {
        if (error.response && error.response.status !== 200) {
          setIsEmpty(error.response.data.empty);
          console.error("Error fetching data:", error);
        }
        console.error("Error fetching data:", error);
      }
    };
    const fetchVirtualMeet = async () => {
      try {
        if (userRole !== "SYSADMIN" && token) {
          const response = await axios.get(
            `${baseUrl}/api/zoom/getVirtualMeet`,
            {
              headers: {
                Authorization: token,
              },
            }
          );
          if (response.status === 200) {
            if (
              typeof response.data === "string" &&
              response.data.startsWith("http")
            ) {
              setjoinUrl(response.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching virual class:", error);
      }
    };
    fetchData();
    fetchVirtualMeet();
  }, []);
  function updateActiveMenu(routePath) {
    $(".pcoded-navbar .active").not(".pcoded-trigger").removeClass("active");
    // Find the menu item matching the routePath
    $(".pcoded-navbar .pcoded-inner-navbar a").each(function () {
      if ($(this).data("path") === routePath) {
        $(this).parent("li").addClass("active");

        // Handle nested menus
        if (!$(".pcoded-navbar").hasClass("theme-horizontal")) {
          $(this).parent("li").parents(".pcoded-hasmenu").addClass("active");
        }
        if ($("body").hasClass("layout-7") || $("body").hasClass("layout-6")) {
          $(".theme-horizontal .pcoded-inner-navbar")
            .find("li.pcoded-trigger")
            .removeClass("pcoded-trigger");
          $(this).parent("li").parents(".pcoded-hasmenu").addClass("active ");
        }
      }
    });
  }

  const handleClick = (e, link) => {
    e.preventDefault();
    if (userRole === "ADMIN" ) {
      if (
        (link === "/about" ||
          link === "/admin/dashboard" || link==="/restore"||
          link === "/licenceDetails") &&
        isEmpty
      ) {
        setActiveLink(link);
        updateActiveMenu(link);
        navigate(link);
      } else if (
        (link === "/about" ||
          link === "/admin/dashboard" ||link==="/restore" ||
          link === "/licenceDetails") &&
        !isEmpty &&
        !isvalid
      ) {
        setActiveLink(link);
        updateActiveMenu(link);
        navigate(link);
      } else if (!isEmpty && isvalid) {
        setActiveLink(link);
        updateActiveMenu(link);
        navigate(link);
      }
    } else if (userRole === "USER" || userRole === "SYSADMIN") {
      setActiveLink(link);
      updateActiveMenu(link);
      navigate(link);
    }
  };

  return (
    <nav
      className="pcoded-navbar menu-light  "
      //  style={{position:"fixed"}}
    >
      <div className="navbar-wrapper">
        <div className="navbar-content scroll-div ">
          {/* Admin Sidebar */}

          {userRole === "ADMIN" && (
            <>
              <ul className="nav pcoded-inner-navbar ">
                <li className="nav-item no-hasmenu pt-2">
                  <a
                    href="#"
                    onClick={(e) => handleClick(e, "/admin/dashboard")}
                    className="nav-link has-ripple"
                  >
                    <span className="pcoded-micon">
                      <i className="feather icon-home"></i>
                    </span>
                    <span className="pcoded-mtext">Dashboard</span>
                  </a>
                </li>

                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link">
                    <span className="pcoded-micon">
                      <i className="feather icon-layout"></i>
                    </span>
                    <span className="pcoded-mtext">Courses</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/course/addcourse"
                        onClick={(e) => {
                          handleClick(e, "/course/addcourse");
                        }}
                      >
                        <i className="fa-solid fa-file-circle-plus pr-2"></i>
                        Create course
                      </a>
                    </li>

                    <li className="view-course">
                      <a
                        href="#"
                        data-path="/dashboard/course"
                        onClick={(e) => {
                          handleClick(e, "/dashboard/course");
                        }}
                      >
                        <i className="fa-regular fa-eye pr-2"></i>
                        View Course
                      </a>
                      <ul className="toggle-list">
                        <li>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filter?.paid}
                              name="paid"
                              onChange={() => {
                                handleFilterChange("paid"); // Trigger filter change for 'paid'
                              }}
                              className="mr-1"
                            />
                            <span className="checkbox-custom"></span>
                            Paid
                          </label>
                        </li>
                        <li>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filter?.unpaid}
                              name="unpaid"
                              onChange={() => {
                                handleFilterChange("unpaid"); // Trigger filter change for 'unpaid'
                              }}
                              className="mr-1"
                            />
                            <span className="checkbox-custom"></span>
                            Free
                          </label>
                        </li>
                      </ul>
                    </li>
                    <li className="view-course">
                      <a
                        href="#"
                        data-path="/course/admin/edit"
                        onClick={(e) => {
                          handleClick(e, "/course/admin/edit");
                        }}
                      >
                        <i className="fa-solid fa-edit pr-2"></i>
                        Edit Courses
                      </a>
                      <ul className="toggle-list ">
                        <li>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filter?.paid}
                              name="paid"
                              onChange={() => {
                                handleFilterChange("paid"); // Trigger filter change for 'paid'
                              }}
                              className="mr-1"
                            />
                            <span className="checkbox-custom"></span>
                            Paid
                          </label>
                        </li>
                        <li>
                          <label className="checkbox-label ">
                            <input
                              type="checkbox"
                              checked={filter?.unpaid}
                              name="unpaid"
                              onChange={() => {
                                handleFilterChange("unpaid"); // Trigger filter change for 'unpaid'
                              }}
                              className="mr-1"
                            />
                            <span className="checkbox-custom"></span>
                            Free
                          </label>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>

                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link">
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-object-group"></i>
                    </span>
                    <span className="pcoded-mtext">Batch</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/batch/addNew"
                        onClick={(e) => {
                          handleClick(e, "/batch/addNew");
                        }}
                      >
                        <i className="fa-solid fa-square-plus pr-2"></i>
                        Create batch
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/batch/viewall"
                        onClick={(e) => {
                          handleClick(e, "/batch/viewall");
                        }}
                      >
                        <i className="fa-regular fa-eye pr-2"></i>
                        View batch
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link ">
                    <span className="pcoded-micon">
                      <i className="fa fa-users"></i>
                    </span>
                    <span className="pcoded-mtext">People</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/view/Trainer"
                        onClick={(e) => {
                          handleClick(e, "/view/Trainer");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-person-chalkboard"></i>
                        </span>
                        <span className="pcoded-mtext">
                          {displayname && displayname.trainer_name
                            ? displayname.trainer_name
                            : "Trainers"}
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/view/Students"
                        onClick={(e) => {
                          handleClick(e, "/view/Students");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-chalkboard-user"></i>
                        </span>
                        <span className="pcoded-mtext">
                          {displayname && displayname.student_name
                            ? displayname.student_name
                            : "Student"}
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/view/Approvals"
                        onClick={(e) => {
                          handleClick(e, "/view/Approvals");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-person-circle-check"></i>
                        </span>
                        <span className="pcoded-mtext">Approvals</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link ">
                    <span className="pcoded-micon">
                      <i className="fa fa-gear"></i>
                    </span>
                    <span className="pcoded-mtext">Settings</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        data-path="/settings/viewsettings"
                        onClick={(e) => {
                          handleClick(e, "/settings/viewsettings");
                        }}
                        href="#"
                      >
                        <i className="fa-solid fa-gears pr-2"></i>
                        General
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/settings/socialLogins"
                        onClick={(e) => {
                          handleClick(e, "/settings/socialLogins");
                        }}
                      >
                        <i className="fa-brands fa-google pr-2"></i>
                        Social Login
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/settings/Weightage"
                        onClick={(e) => {
                          handleClick(e, "/settings/Weightage");
                        }}
                      >
                        <i className="fa-solid fa-sliders mr-2"></i>Grade
                        Weightage
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/certificate"
                        onClick={(e) => {
                          handleClick(e, "/certificate");
                        }}
                      >
                        <i className="fa-solid fa-award pr-2"></i> Certificate
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        data-path="/settings/mailSettings"
                        onClick={(e) => {
                          handleClick(e, "/settings/mailSettings");
                        }}
                      >
                        <i className="fa-solid fa-envelope pr-2"></i> Mail
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/zoom/settings"
                        onClick={(e) => {
                          handleClick(e, "/zoom/settings");
                        }}
                      >
                        <i className="fa-solid fa-video pr-2"></i> Zoom
                      </a>
                    </li>
                    {Activeprofile === "VPS" && (
                      <li>
                        <a
                          href="#"
                          data-path="/settings/footer"
                          onClick={(e) => {
                            handleClick(e, "/settings/footer");
                          }}
                        >
                          <i className="fa-solid fa-shoe-prints pr-2"></i>{" "}
                          Footer
                        </a>
                      </li>
                    )}

                    <li>
                      <a
                        href="#"
                        data-path="/settings/displayname"
                        onClick={(e) => {
                          handleClick(e, "/settings/displayname");
                        }}
                      >
                        <i className="fa-solid fa-users-gear"></i> Roles
                      </a>
                    </li>
                  </ul>
                </li>

                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link ">
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-users-rectangle"></i>
                    </span>
                    <span className="pcoded-mtext">meeting</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/meeting/calender"
                        onClick={(e) => {
                          handleClick(e, "/meeting/calender");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-calendar-days"></i>
                        </span>
                        <span className="pcoded-mtext"> Calender</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/meeting/manage"
                        onClick={(e) => {
                          handleClick(e, "/meeting/manage");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-video"></i>
                        </span>
                        <span className="pcoded-mtext">Manage</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/meeting/Shedule"
                        onClick={(e) => {
                          handleClick(e, "/meeting/Shedule");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-plus"></i>
                        </span>
                        <span className="pcoded-mtext">Shedule New</span>
                      </a>
                    </li>
                  </ul>
                </li>
                {joinUrl && (
                  <li className="nav-item no-hasmenu">
                    <a
                      href="#"
                      onClick={(e) => {
                        window.open(joinUrl, "_blank");
                      }}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-display text-primary mr-2"></i>
                      </span>
                      <span className="pcoded-mtext">Virual ClassRoom</span>
                    </a>
                  </li>
                )}
                <li className="nav-item pcoded-hasmenu">
                  <a href="#!" className="nav-link ">
                    <span className="pcoded-micon">
                      <i className="fa-regular fa-credit-card"></i>
                    </span>
                    <span className="pcoded-mtext">payments</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/payment/keys"
                        onClick={(e) => {
                          handleClick(e, "/payment/keys");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-gear"></i>
                        </span>
                        <span className="pcoded-mtext">payment Keys</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/payment/transactionHitory"
                        onClick={(e) => {
                          handleClick(e, "/payment/transactionHitory");
                        }}
                        className="nav-link "
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-clock-rotate-left"></i>
                        </span>
                        <span className="pcoded-mtext">Transactions</span>
                      </a>
                    </li>
                  </ul>
                </li>

                <li
                  className={`nav-item pcoded-hasmenu ${
                    Activeprofile !== "VPS" ? "d-none" : ""
                  }`}
                >
                  <a href="#!" className="nav-link">
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-arrows-rotate"></i>
                    </span>
                    <span className="pcoded-mtext">Manage Backups</span>
                  </a>
                  <ul className="pcoded-submenu">
                    <li>
                      <a
                        href="#"
                        data-path="/admin/driveCredentials"
                        onClick={(e) =>
                          handleClick(e, "/admin/driveCredentials")
                        }
                        className="nav-link"
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-key"></i>
                        </span>
                        <span className="pcoded-mtext">Drive keys</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        data-path="/admin/backup-shedule"
                        onClick={(e) => handleClick(e, "/admin/backup-shedule")}
                        className="nav-link"
                      >
                        <span className="pcoded-micon">
                          <i className="fa-solid fa-calendar-days"></i>
                        </span>
                        <span className="pcoded-mtext">Shedule backup</span>
                      </a>
                    </li>
                  </ul>
                </li>

                <li
                  className={`nav-item no-hasmenu ${
                    Activeprofile !== "VPS" ? "d-none" : ""
                  }`}
                >
                  <a
                    href="#"
                    data-path="/restore"
                    onClick={(e) => handleClick(e, "/restore")}
                    className="nav-link "
                  >
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-window-restore"></i>
                    </span>
                    <span className="pcoded-mtext">Restore data</span>
                  </a>
                </li>

                <li className="nav-item no-hasmenu">
                  <a
                    href="#"
                    onClick={(e) => handleClick(e, "/licenceDetails")}
                    className="nav-link "
                  >
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-clipboard-check"></i>
                    </span>
                    <span className="pcoded-mtext">Licence</span>
                  </a>
                </li>
                <li className="nav-item no-hasmenu">
                  <a
                    href="#"
                    onClick={(e) => handleClick(e, "/about")}
                    className="nav-link "
                  >
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-circle-info"></i>
                    </span>
                    <span className="pcoded-mtext">About us</span>
                  </a>
                </li>
              </ul>
            </>
          )}
          {/* Admin Sidebar */}
          {/* Sysadmin Sidebar */}
          {userRole === "SYSADMIN" && (
            <ul className="nav pcoded-inner-navbar ">
              <li className="nav-item no-hasmenu pt-2">
                <a
                  href="#"
                  onClick={(e) => handleClick(e, "/admin/dashboard")}
                  className="nav-link has-ripple"
                >
                  <span className="pcoded-micon">
                    <i className="feather icon-home"></i>
                  </span>
                  <span className="pcoded-mtext">Dashboard</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu pt-2">
                <a
                  href="#"
                  data-path="/viewAll/Admins"
                  onClick={(e) => handleClick(e, "/viewAll/Admins")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-user-tie"></i>
                  </span>
                  <span className="pcoded-mtext">Admins</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/viewAll/Trainers"
                  onClick={(e) => handleClick(e, "/viewAll/Trainers")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-chalkboard-user"></i>
                  </span>
                  <span className="pcoded-mtext">Trainers</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/viewAll/Students"
                  onClick={(e) => handleClick(e, "/viewAll/Students")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-user"></i>
                  </span>
                  <span className="pcoded-mtext">Students</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/Affiliates"
                  onClick={(e) => handleClick(e, "/Affiliates")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-regular fa-handshake"></i>
                  </span>
                  <span className="pcoded-mtext">Affiliates</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/SocialLogin"
                  onClick={(e) => handleClick(e, "/view/SocialLogin")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-users"></i>
                  </span>
                  <span className="pcoded-mtext">Social Login</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  onClick={(e) => handleClick(e, "/Zoomkeyupload")}
                  className="nav-link "
                  data-path="/Zoomkeyupload"
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid  fa-video"></i>
                  </span>
                  <span className="pcoded-mtext">Zoom Keys</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/licenceupload"
                  onClick={(e) => handleClick(e, "/licenceupload")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="feather icon-sidebar"></i>
                  </span>
                  <span className="pcoded-mtext">Licence</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/restore"
                  onClick={(e) => handleClick(e, "/restore")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-window-restore"></i>
                  </span>
                  <span className="pcoded-mtext">Restore data</span>
                </a>
              </li>
              {result && (
                <li className="nav-item no-hasmenu">
                  <a
                    href="#"
                    data-path="/getlicence"
                    onClick={(e) => handleClick(e, "/getlicence")}
                    className="nav-link"
                  >
                    <span className="pcoded-micon">
                      <i className="feather icon-file-plus"></i>
                    </span>
                    <span className="pcoded-mtext">Licence Creation</span>
                  </a>
                </li>
              )}
            </ul>
          )}
          {/* Sysadmin Sidebar */}
          {/* Trainer Sidebar */}
          {userRole === "TRAINER" && (
            <ul className="nav pcoded-inner-navbar ">
              <li className="nav-item no-hasmenu pt-2 view-course">
                <a
                  href="#"
                  data-path="/dashboard/course"
                  onClick={(e) => handleClick(e, "/dashboard/course")}
                  className="nav-link has-ripple"
                >
                  <span className="pcoded-micon">
                    <i className="feather icon-layout"></i>
                  </span>
                  <span className="pcoded-mtext ">Courses</span>
                </a>
                <ul className="toggle-list pl-4">
                  <li>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filter.paid}
                        name="paid"
                        onChange={() => {
                          handleFilterChange("paid"); // Trigger filter change for 'paid'
                        }}
                        className="mr-1"
                      />
                      <span className="checkbox-custom"></span>
                      Paid
                    </label>
                  </li>
                  <li>
                    <label className="checkbox-label ">
                      <input
                        type="checkbox"
                        checked={filter.unpaid}
                        name="unpaid"
                        onChange={() => {
                          handleFilterChange("unpaid"); // Trigger filter change for 'unpaid'
                        }}
                        className="mr-1"
                      />
                      <span className="checkbox-custom"></span>
                      Free
                    </label>
                  </li>
                </ul>
              </li>
              <li className="nav-item pcoded-hasmenu">
                <a href="#!" className="nav-link">
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-object-group"></i>
                  </span>
                  <span className="pcoded-mtext">Batch</span>
                </a>
                <ul className="pcoded-submenu">
                  <li>
                    <a
                      href="#"
                      data-path="/batch/addNew"
                      onClick={(e) => {
                        handleClick(e, "/batch/addNew");
                      }}
                    >
                      <i className="fa-solid fa-square-plus pr-2"></i>
                      Create batch
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      data-path="/batch/viewall"
                      onClick={(e) => {
                        handleClick(e, "/batch/viewall");
                      }}
                    >
                      <i className="fa-regular fa-eye pr-2"></i>
                      View batch
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/AssignedCourses"
                  onClick={(e) => handleClick(e, "/AssignedCourses")}
                  className="nav-link has-ripple"
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-book"></i>
                  </span>
                  <span className="pcoded-mtext">My Courses</span>
                </a>
              </li>
              <li className="nav-item pcoded-hasmenu">
                <a href="#!" className="nav-link ">
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-video"></i>
                  </span>
                  <span className="pcoded-mtext">Meeting</span>
                </a>
                <ul className="pcoded-submenu">
                  <li>
                    <a
                      href="#"
                      data-path="/meeting/calender"
                      onClick={(e) => {
                        handleClick(e, "/meeting/calender");
                      }}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-calendar-days"></i>
                      </span>
                      <span className="pcoded-mtext"> Calender</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      data-path="/meeting/manage"
                      onClick={(e) => {
                        handleClick(e, "/meeting/manage");
                      }}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-video"></i>
                      </span>
                      <span className="pcoded-mtext">Manage</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      data-path="/meeting/Shedule"
                      onClick={(e) => handleClick(e, "/meeting/Shedule")}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-plus"></i>
                      </span>
                      <span className="pcoded-mtext">Shedule New</span>
                    </a>
                  </li>
                </ul>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/Students"
                  onClick={(e) => handleClick(e, "/view/Students")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-users"></i>
                  </span>
                  <span className="pcoded-mtext">
                    {displayname && displayname.student_name
                      ? displayname.student_name
                      : "All Students"}
                  </span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/myStudents"
                  onClick={(e) => handleClick(e, "/myStudents")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-chalkboard-user"></i>
                  </span>
                  <span className="pcoded-mtext">
                    {displayname && displayname.student_name
                      ? `My ${displayname.student_name}`
                      : "My Students"}
                  </span>
                </a>
              </li>
              {joinUrl && (
                <li className="nav-item no-hasmenu">
                  <a
                    href="#"
                    onClick={(e) => {
                      window.open(joinUrl, "_blank");
                    }}
                    className="nav-link "
                  >
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-display text-primary mr-2"></i>
                    </span>
                    <span className="pcoded-mtext">Virual ClassRoom</span>
                  </a>
                </li>
              )}
            </ul>
          )}
          {/* Trainer Sidebar */}
          {/* User Sidebar */}
          {userRole === "USER" && (
            <ul className="nav pcoded-inner-navbar ">
              <li className="nav-item no-hasmenu pt-2 view-course">
                <a
                  href="#"
                  data-path="/dashboard/course"
                  onClick={(e) => handleClick(e, "/dashboard/course")}
                  className="nav-link has-ripple"
                >
                  <span className="pcoded-micon">
                    <i className="feather icon-layout"></i>
                  </span>
                  <span className="pcoded-mtext ">Courses</span>
                </a>
                <ul className="toggle-list pl-4">
                  <li>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filter.paid}
                        name="paid"
                        onChange={() => {
                          handleFilterChange("paid"); // Trigger filter change for 'paid'
                        }}
                        className="mr-1"
                      />
                      <span className="checkbox-custom"></span>
                      Paid
                    </label>
                  </li>
                  <li>
                    <label className="checkbox-label ">
                      <input
                        type="checkbox"
                        checked={filter.unpaid}
                        name="unpaid"
                        onChange={() => {
                          handleFilterChange("unpaid"); // Trigger filter change for 'unpaid'
                        }}
                        className="mr-1"
                      />
                      <span className="checkbox-custom"></span>
                      Free
                    </label>
                  </li>
                </ul>
              </li>

              <li className="nav-item no-hasmenu ">
                <a
                  href="#"
                  data-path="/mycourses"
                  onClick={(e) => handleClick(e, "/mycourses")}
                  className="nav-link has-ripple"
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-book"></i>
                  </span>
                  <span className="pcoded-mtext">My Courses</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/MyQuizzScore"
                  onClick={(e) => handleClick(e, "/view/MyQuizzScore")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-regular fa-circle-question mr-2"></i>
                  </span>
                  <span className="pcoded-mtext"> Quizz </span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/MyAssignments"
                  onClick={(e) => handleClick(e, "/view/MyAssignments")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fas fa-file-alt"></i>
                  </span>
                  <span className="pcoded-mtext"> Assignments </span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/MyTestScore"
                  onClick={(e) => handleClick(e, "/view/MyTestScore")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-vial-circle-check"></i>
                  </span>
                  <span className="pcoded-mtext"> Test </span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/user/meeting/calender"
                  onClick={(e) => handleClick(e, "/user/meeting/calender")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-video"></i>
                  </span>
                  <span className="pcoded-mtext"> Meetings</span>
                </a>
              </li>

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/user/ProgramCalender"
                  onClick={(e) => handleClick(e, "/user/ProgramCalender")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-calendar-plus"></i>
                  </span>
                  <span className="pcoded-mtext">Program Calender</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/myGrades"
                  onClick={(e) => handleClick(e, "/myGrades")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-award"></i>
                  </span>
                  <span className="pcoded-mtext">Grades</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/view/MyAttendance"
                  onClick={(e) => handleClick(e, "/view/MyAttendance")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid  fa-clipboard-user"></i>
                  </span>
                  <span className="pcoded-mtext"> Attendance</span>
                </a>
              </li>

              <li className="nav-item pcoded-hasmenu">
                <a href="#!" className="nav-link ">
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-credit-card"></i>
                  </span>
                  <span className="pcoded-mtext">payments</span>
                </a>
                <ul className="pcoded-submenu">
                  <li>
                    <a
                      href="#"
                      data-path="/myPayments"
                      onClick={(e) => {
                        handleClick(e, "/myPayments");
                      }}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </span>
                      <span className="pcoded-mtext">History</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      data-path="/pendingInstallments"
                      onClick={(e) => {
                        handleClick(e, "/pendingInstallments");
                      }}
                      className="nav-link "
                    >
                      <span className="pcoded-micon">
                        <i className="fa-solid fa-list"></i>{" "}
                      </span>
                      <span className="pcoded-mtext">Pendings</span>
                    </a>
                  </li>
                </ul>
              </li>

              {joinUrl && (
                <li className="nav-item no-hasmenu">
                  <a
                    href="#"
                    onClick={(e) => {
                      window.open(joinUrl, "_blank");
                    }}
                    className="nav-link "
                  >
                    <span className="pcoded-micon">
                      <i className="fa-solid fa-display text-primary mr-2"></i>
                    </span>
                    <span className="pcoded-mtext">Virual ClassRoom</span>
                  </a>
                </li>
              )}

              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/MyCertificateList"
                  onClick={(e) => handleClick(e, "/MyCertificateList")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-award"></i>
                  </span>
                  <span className="pcoded-mtext">Certificates</span>
                </a>
              </li>
              <li className="nav-item no-hasmenu">
                <a
                  href="#"
                  data-path="/settings"
                  onClick={(e) => handleClick(e, "/settings")}
                  className="nav-link "
                >
                  <span className="pcoded-micon">
                    <i className="fa-solid fa-gear"></i>
                  </span>
                  <span className="pcoded-mtext">Settings</span>
                </a>
              </li>
            </ul>
          )}
          {/* User Sidebar */}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
