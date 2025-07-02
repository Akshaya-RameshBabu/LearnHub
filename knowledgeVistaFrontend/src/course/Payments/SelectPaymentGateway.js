import React, { useEffect, useState } from "react";
import razorpay from "../../images/razorpay.png";
import Paypal from "../../images/paypal.png";
import Stripe from "../../images/stripe.png";
import RazorpayPaymentProvider from "./RazorpayPaymentProvider"; // Import the RazorpayPaymentProvider
import StripePaymentProvider from "./StripePaymentProvider";
import PaypalPaymentProvider from "./PaypalPaymentProvider";
import axios from "axios";
import baseUrl from "../../api/utils";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const SelectPaymentGateway = ({ orderData, setorderData,setopenselectgateway }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const token = sessionStorage.getItem("token");
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const Currency=sessionStorage.getItem("Currency")
  const [paymentMethods, setPaymentMethods] = useState({
    PAYPAL: false,
    RAZORPAY: false,
    STRIPE: false,
  });
  const [loading, setLoading] = useState(true);
  const { handleSubmit } = RazorpayPaymentProvider(orderData,  setopenselectgateway);
  const { handlePayment } = StripePaymentProvider(orderData,setopenselectgateway);
  const { handlePaymentPaypal } = PaypalPaymentProvider(orderData,setopenselectgateway);
  const fetchpaymentTypedetails = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get/paytypedetailsforUser`, {
        headers: {
          Authorization: token,
        },
      });

      setPaymentMethods(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/unauthorized");
      }
      console.error("Error fetching payment methods", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchpaymentTypedetails();
  }, []);

  

  const handlepaytypeClick = (e) => {
    const name = e.target.name;
    setSelectedPaymentMethod(name);
  };

  const handlePayNowClick = () => {
    if (selectedPaymentMethod === "razorpay") {
      setSelectedPaymentMethod("");
      handleSubmit();
    } else if (selectedPaymentMethod === "Stripe") {
      setSelectedPaymentMethod("");
      handlePayment();
    } else if (selectedPaymentMethod === "Paypal") {
      setSelectedPaymentMethod("");
      handlePaymentPaypal();
    } else {
       MySwal.fire({
                    toast:true,
              position: 'top-end', 
              icon: 'warning',
              title: 'Please Select a payment method before Proceeding',
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

  if (loading) {
    return <div>Loading payment methods...</div>;
  }

  const noPaymentMethodsEnabled =
    !paymentMethods.PAYPAL &&
    !paymentMethods.RAZORPAY &&
    !paymentMethods.STRIPE;
  const showOrAndRazorpay =
    paymentMethods.RAZORPAY && (paymentMethods.PAYPAL || paymentMethods.STRIPE);

  return (
    <div className="paybackground ">
      <div className="card m-5" style={{position:"absolute",top:"10px"}}>
        <div className="card-body">
          <div className="header-container">
            <h4>Select Payment Method</h4>
            <i
              onClick={() => {
               setopenselectgateway(false)
              }}
              className="fa-solid fa-xmark"
            ></i>
          </div>

          <div className="twosplits">
            <div className="borderCurved">
              {noPaymentMethodsEnabled ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <p>No payment methods are enabled at the moment.</p>
                  <p>Please try again later or contact Administrator.</p>
                </div>
              ) : (
                <div
                style={{
                  height: "100%",
                  display:
                    paymentMethods.PAYPAL || paymentMethods.STRIPE || paymentMethods.RAZORPAY
                      ? "flex"
                      : "none",
                  flexDirection: "column",
                }}
              >
                {(paymentMethods.PAYPAL || paymentMethods.STRIPE) && (
                  <div className="payrow p-3" style={{ flex: 1 }}>
                    {paymentMethods.PAYPAL && (
                      <div className="payimgdiv">
                        <img
                          src={Paypal}
                          alt="paypal"
                          name="Paypal"
                          onClick={(e) => handlepaytypeClick(e)}
                          className={`payment-image ${
                            selectedPaymentMethod === "Paypal" ? "selectedpay" : ""
                          }`}
                        />
                      </div>
                    )}
                    {paymentMethods.STRIPE && (
                      <div className="payimgdiv">
                        <img
                          src={Stripe}
                          alt="stripe"
                          name="Stripe"
                          onClick={(e) => handlepaytypeClick(e)}
                          className={`payment-image ${
                            selectedPaymentMethod === "Stripe" ? "selectedpay" : ""
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}
              
                {showOrAndRazorpay && paymentMethods.RAZORPAY && (
                  <div style={{ flex: 0 }}>
                    <p style={{ textAlign: "center" }}>or</p>
                    <div className="horizontal-line"></div>
                    <h6 className="p-3">Other Payments</h6>
                  </div>
                )}
              
                {paymentMethods.RAZORPAY && (
                  <div className="payrow p-3" style={{ flex: 1 }}>
                    <div className="payimgdiv">
                      <img
                        src={razorpay}
                        alt="razorpay"
                        name="razorpay"
                        className={`payment-image ${
                          selectedPaymentMethod === "razorpay" ? "selectedpay" : ""
                        }`}
                        onClick={(e) => handlepaytypeClick(e)}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              
              )}
            </div>

            <div
              className="borderCurved p-3 d-flex flex-column"
              style={{ height: "100%" }}
            >
              <h5 style={{ textAlign: "center" }}>Order Summary</h5>
              <div className="horizontal-line"></div>

              {/* Main content */}
              <div className="flex-grow-1">
                <div className="row">
                  <label className="col-form-label col-sm-6">
                    Batch Name:
                  </label>
                  <label
                    className="col-form-label col-sm-6"
                    style={{ textAlign: "right" }}
                  >
                    {orderData?.batchName}
                  </label>
                </div>
                <div className="horizontal-line"></div>
                <div className="row">
                  <label className="col-form-label col-sm-6">
                    batch Amount:
                  </label>
                  <label
                    className="col-form-label col-sm-6"
                    style={{ textAlign: "right" }}
                  >
                     <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1" : "fa-solid fa-dollar-sign mr-1"}></i>
                    {orderData?.batchAmount}
                  </label>
                  {orderData?.paytype === "PART" && (
                    <>
                      <label className="col-form-label col-sm-6">
                        Installment Number:
                      </label>
                      <label
                        className="col-form-label col-sm-6"
                        style={{ textAlign: "right" }}
                      >
                        {orderData?.installment}
                      </label>
                      <label className="col-form-label col-sm-6">
                        Partial Amount:
                      </label>
                      <label
                        className="col-form-label col-sm-6"
                        style={{ textAlign: "right" }}
                      >
                         <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1" : "fa-solid fa-dollar-sign mr-1"}></i>
                        {orderData?.amount}
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Footer content */}
              <div>
                <div className="horizontal-line"></div>
                <div className="row">
                  <label className="col-form-label col-sm-6">
                    <b>Total:</b>
                  </label>
                  <label
                    className="col-form-label col-sm-6"
                    style={{ textAlign: "right" }}
                  >
                    <b> <i className={Currency === "INR" ? "fa-solid fa-indian-rupee-sign mr-1" : "fa-solid fa-dollar-sign mr-1"}></i>{orderData?.amount}</b>
                  </label>
                </div>
                <button
                  className="btn btn-primary btn-sm btn-block m-2"
                  onClick={handlePayNowClick}
                  disabled={!selectedPaymentMethod}
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPaymentGateway;
