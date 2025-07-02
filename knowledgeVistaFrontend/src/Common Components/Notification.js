import React, { useEffect, useState } from "react";
import baseUrl from "../api/utils";
import axios from "axios";
import message from "../images/message.png";
import { useNavigate } from "react-router-dom";

const Notification = ({   handlemarkallasRead }) => {
  const navigate =useNavigate()
  const [notifications, setnotifications] = useState(() => {
    const storedNotifications = sessionStorage.getItem("notifications");
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        if (Array.isArray(parsedNotifications)) {
          return parsedNotifications;
        }
      } catch (error) {
        console.error(
          "Error parsing notifications from sessionStorage:",
          error
        );
        throw error
      }
    }
    return [];
  });

  const [noNotification, setnoNotifications] = useState(false);
  const token = sessionStorage.getItem("token");
const role=sessionStorage.getItem("role")
  // Function to fetch images for specific notification IDs
  const fetchNotificationImages = async (notifyIds) => {
    try {
      if(role==="SYSADMIN"){
        return
      }
      if (notifyIds.length === 0) return;
      const response = await axios.post(`${baseUrl}/getImages`, notifyIds, {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 200) {
        const imagesData = response.data;

        // Create a map of notifyIds from imagesData
        const imageMap = imagesData.reduce((acc, img) => {
          acc[img.notifyId] = img.notimage; // Store image data by notifyId
          return acc;
        }, {});

        // Map through notifications to update notimage only for those found in imagesData
        const updatedNotifications = notifications.map((notification) => {
          // Check if notifyId exists in imageMap
          if (imageMap.hasOwnProperty(notification.notifyId)) {
            // If the image is null or empty, set it to "no image"
            return {
              ...notification,
              notimage: imageMap[notification.notifyId]
                ? imageMap[notification.notifyId]
                : "no image",
            };
          }
          // Return notification as is if no corresponding image found
          return notification;
        });

        setnotifications(updatedNotifications); // Update state with new notifications
        sessionStorage.setItem(
          "notifications",
          JSON.stringify(updatedNotifications)
        ); // Store updated notifications in sessionStorage
      }
    } catch (error) {
      console.error("Error fetching notification images:", error);
      throw error
    }
  };

  // Function to get notification IDs for which images are missing
  const getMissingImageNotificationIds = () => {
    return notifications
      .filter((notification) => !notification.notimage)
      .map((notification) => notification.notifyId);
  };

  const handleclearAll = async () => {
    try {
      if(role==="SYSADMIN"){
        return
      }
      const response = await axios.get(`${baseUrl}/clearAll`, {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 200) {
        sessionStorage.removeItem("notifications");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const missingImageIdsInViewport = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => {
            const index = entry.target.getAttribute("data-index");
            const notification = notifications[index];
            return notification && !notification.notimage
              ? notification.notifyId
              : null;
          })
          .filter((id) => id !== null);

        if (missingImageIdsInViewport.length > 0) {
          fetchNotificationImages(missingImageIdsInViewport);
        }
      },
      { threshold: 0.5 }
    ); // Trigger when 50% of the notification is in the viewport

    const notificationElements = document.querySelectorAll(
      ".notificationElement"
    );
    notificationElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [notifications]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        if(role==="SYSADMIN"){
          return
        }
        const response = await axios.get(`${baseUrl}/notifications`, {
          headers: {
            Authorization: token,
          },
        });

        if (response.status === 200) {
          const newData = response.data;
          const existingIds = new Set(
            notifications.map((notification) => notification.notifyId)
          );
          const newNotifications = newData.filter(
            (notification) => !existingIds.has(notification.notifyId)
          );

          if (newNotifications.length > 0) {
            const updatedNotifications = [
              ...newNotifications.reverse(),
              ...notifications,
            ]; // Reverse new notifications
            setnotifications(updatedNotifications);
            sessionStorage.setItem(
              "notifications",
              JSON.stringify(updatedNotifications)
            );
          }

          if (newData.length === 0) {
            setnoNotifications(true);
          } else {
            const visibleNotificationIds = getMissingImageNotificationIds();
            if (visibleNotificationIds.length > 0) {
              fetchNotificationImages(visibleNotificationIds);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error
      }
    };

      fetchItems();
    
  }, []);

  const filteredNotifications = React.useMemo(() => {
    if (!notifications.length) return [];
    const groupedByDate = notifications.reduce((acc, notification) => {
      const formattedDate = new Date(
        notification.createdDate
      ).toLocaleDateString("en-US");
      acc[formattedDate] = acc[formattedDate] || [];
      acc[formattedDate].push(notification);
      return acc;
    }, {});

    return Object.entries(groupedByDate)
      .map(([date, notificationsByDate]) => ({
        date,
        notifications: notificationsByDate,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [notifications]);

  return (
    <>
    <div className="noti-head">
      <h6 className="d-inline-block m-b-0">Notifications</h6>
      <div className="float-right">
        <a
          href="#!"
          className="m-r-10"
          onClick={() => {
            const notificationIds = notifications.map(
              (notification) => notification.notifyId
            );
            handlemarkallasRead(notificationIds);
          }}
        >
          mark as read
        </a>
        <a href="#!" onClick={handleclearAll}>clear all</a>
      </div>
    </div>
  
    <ul className="noti-body">
      {noNotification ? (
        <li className="n-title">
          <p className="text-center mt-5 m-b-0">No Notification Found</p>
        </li>
      ) : (
        <>
          {filteredNotifications.length > 0 &&
            filteredNotifications.map((group, index) => (
              <li key={index} className="n-title">
                <p className="m-b-0">
                  {group.date === new Date().toLocaleDateString("en-US")
                    ? "Today"
                    : group.date ===
                      new Date(
                        new Date().getTime() - 1 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString("en-US")
                    ? "Yesterday"
                    : group.date}
                </p>
                <ul>
                {group.notifications.map((notification, notificationIndex) => (
                  <li
                    key={notificationIndex}
                    id={`notification-${notificationIndex}`}
                    data-index={notificationIndex}
                    className="notification"
                    style={{cursor:"pointer"}}
                    onClick={() => {
                      if (notification.link && notification.link.startsWith("/")) {
                        // For internal links (relative paths), open in the same tab
                        navigate(notification.link)
                      } else {
                        // For all other URLs, open in a new tab
                        window.open(notification.link, "_blank");
                      }
                    }}
                  >
                    <div className="media">
                      <img
                        className="img-radius"
                        src={
                          notification.notimage &&
                          notification.notimage !== "no image"
                            ? `data:image/jpeg;base64,${notification.notimage}`
                            : message // Fallback message
                        }
                        alt="Notification Image"
                      />
                      <div className="media-body">
                        <p title={notification.description} 
                        style={{
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3, // Change this to control number of lines
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.5em',
                          maxHeight: '4.5em' // 3 lines * line-height (1.5em)
                        }}>
                          {notification.description}
                        </p>
                        <small className="text-muted">
                          Created By {notification.username}
                        </small>
                      </div>
                    </div>
                  </li>
                ))}
                </ul>
              </li>
            ))}
        </>
      )}
    </ul>
  
    {/* <div className="noti-footer">
      <a href="#!">show all</a>
    </div> */}
 </>
  
  );
};

export default Notification;
