import axios from 'axios';
import Swal from 'sweetalert2'; // Assuming you're using SweetAlert for alerts
import { useState } from 'react';
import baseUrl from '../../api/utils';

const RazorpayPaymentProvider = (orderData ,setopenselectgateway) => {
  const [submitting, setSubmitting] = useState(false);
 const token=sessionStorage.getItem("token");
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async () => {
    const url = orderData?.url; // Use orderData.url directly here
    if (!url) {
      Swal.fire({
        icon: "error",
        title: "URL missing",
        text: "Payment URL is missing in order data.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const data = JSON.stringify({
        batchId: orderData?.batchId,
        userId: orderData?.userId,
        paytypeL:orderData?.paytypeL
      });
      const response = await axios.post(`${baseUrl}${url}?gateway=RAZORPAY`, data, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      setSubmitting(false);
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        Swal.fire({
          icon: "error",
          title: "Failed to load Razorpay SDK. Please try again.",
        });
        return;
      }

      const order = response.data;
      const options = {
        key:order?.key,
        order_id: order?.orderId,
        description: order?.description,
        name: order?.name,
        handler: function (response) {
          if (response.error) {
            Swal.fire({
              icon: "error",
              title: "Payment Failed",
              text: response.error.description,
            });
          } else {
            sendPaymentIdToServer(
              response.razorpay_payment_id,
              order.orderId,
              response.razorpay_signature
            );
          }
        },
        theme: {
          color: "#3399cc",
        },
      };

      var pay = new window.Razorpay(options);
      setopenselectgateway(false)
      pay.open();
    } catch (error) {

      setSubmitting(false);
      setopenselectgateway(false)
      if (error.response && error.response.status === 400) {
    
        Swal.fire({
          icon: "error",
          title: "Error creating order:",
          text: error.response.data ? error.response.data : "An error occurred",
        });
      } else {
        throw error;
      }
    }
  };

  const sendPaymentIdToServer = async (paymentId, order, signature) => {
    try {
      setSubmitting(true);
      const paydata = JSON.stringify({
        paymentId: paymentId,
        orderId: order,
        signature: signature,
      });

      const response = await axios.post(`${baseUrl}/buyCourse/payment`, paydata, {
        headers: {
          Authorization: token, // Replace with your actual token
          "Content-Type": "application/json",
        },
      });

      setSubmitting(false);
      if (response.status === 200) {
         window.location.href="/mycourses"
      } else {
        const errorMessage = response.data;
        Swal.fire({
          icon: "error",
          title: "Error updating payment ID:",
          text: errorMessage,
        });
      }
    } catch (error) {
      setSubmitting(false);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Error sending payment ID to server:",
          text: error.response.data ? error.response.data : "An error occurred",
        });
      } else {
        throw error;
      }
    }
  };

  // Return the function so it can be invoked in other components
  return { handleSubmit };
};

export default RazorpayPaymentProvider;
