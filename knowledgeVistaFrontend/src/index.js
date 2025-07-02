import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GlobalStateProvider } from "./Context/GlobalStateProvider";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import baseUrl from '../src/api/utils';
import axios from 'axios';
// Your error handling code below the imports
let alertShown = false;
const MySwal = withReactContent(Swal);
// Function to handle errors and rejections
function handleError(message) {
  if (!alertShown) {
    alertShown = true; // Set the flag to indicate an alert is being shown
    MySwal.fire({
      icon: "error",
      title: "Some Error Occurred",
      text: message,
      showCancelButton: true, // Shows the Cancel button
      cancelButtonText: "Cancel", // Text for the cancel button
      confirmButtonText: "Send Mail", // Text for the confirm button
    }).then((result) => {
      if (result.isConfirmed) {
        // Logic to send mail       `${baseUrl}/get/displayName`
        const sendMail = async () => {
          try {
            const response = await fetch(`${baseUrl}/log/time/10`, {
              method: "GET", // Use GET method
            });
      
            if (response.ok) { // .ok is true if status is in the range 200-299
              const data = await response.json(); 
              
              // Assuming the body contains the message "Mail Sent"
              if (data.statusCodeValue === 200) {
                // MySwal.fire("Mail Sent", data.body, "success");
              } else {
                MySwal.fire("Error", "Failed to send mail."+data.errorMessage , "error");
              }
            } else {
              console.error("Error sending mail:", response.status);
              MySwal.fire("Error", "Failed to send mail.", "error");
            }
          } catch (error) {
            console.error("Error sending mail:", error);
            MySwal.fire("Error", "Failed to send mail.", message);
          }
        };
      
        sendMail();
      //  sole.log("Sending mail...");
      } else if (result.isDismissed) {
        // Logic if the user cancels
        // console.log("Action cancelled.");
      }
    });
    // Reset the flag after the alert is dismissed
    setTimeout(() => {
      alertShown = false;
    }, 100); // Adjust the timeout as necessary
  }
}

// Global error handler for synchronous errors
window.onerror = function (message, source, lineno, colno, error) {
  handleError('An error occurred: ' + message);
};

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  handleError('An unhandled promise rejection occurred: ' + event.reason);
});


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <GlobalStateProvider>
        <App />
    </GlobalStateProvider>
);
