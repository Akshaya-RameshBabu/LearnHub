import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import baseUrl from '../../api/utils';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const Partialpaymentsetting = () => {
  const { batchId } = useParams();
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');

  // Unified state for all data
  const [enablechecked, setEnablechecked] = useState(false);
  const [batchData, setBatchData] = useState({
    batchTitle: '',
    batchAmount: '',
  });
  const [installmentData, setInstallmentData] = useState([]);
  const [noOfInstallments, setNoOfInstallments] = useState(2);
  const [loading, setLoading] = useState(true);

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // --- API CALLS ---
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/viewPaymentList/${batchId}`, {
          headers: { Authorization: token },
        });

        const data = response.data;
        if (data.batchInstallments && data.batchInstallments.length > 0) {
          // Case 1: Partial payments already exist
          setEnablechecked(true);
          setBatchData({
            batchTitle: data.batchTitle,
            batchAmount: data.batchAmount,
          });
          setInstallmentData(data.batchInstallments);
          setNoOfInstallments(data.batchInstallments.length);
        } else {
          // Case 2: Partial payments don't exist, but batch data is returned
          setEnablechecked(false);
          setBatchData({
            batchTitle: data.batchTitle,
            batchAmount: data.batchAmount,
          });
          // Initialize a new installment structure
          initializeInstallments(data.batchAmount, 2);
        }
      } catch (error) {
        setLoading(false);
        if (error.response?.status === 404) {
          // Case 3: Batch or payment details not found
          // Fetch base batch data to get the amount for new settings
          try {
            const batchResponse = await axios.get(`${baseUrl}/getBatchDetails/${batchId}`, {
                headers: { Authorization: token },
            });
            const batchDetails = batchResponse.data;
            setBatchData({
              batchTitle: batchDetails.batchTitle,
              batchAmount: batchDetails.amount,
            });
            setEnablechecked(false);
            initializeInstallments(batchDetails.amount, 2);
          } catch (batchError) {
              handleApiError(batchError);
          }
        } else {
            handleApiError(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [batchId, token]);

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      MySwal.fire({
        title: 'Unauthorized',
        text: 'Session expired or invalid token.',
        icon: 'error',
      }).then(() => navigate(-1));
    } else {
      MySwal.fire({
        title: 'Error!',
        text: 'An unexpected error occurred. Please try again later.',
        icon: 'error',
      }).then(() => navigate(-1));
    }
  };

  const initializeInstallments = (amount, numInstallments) => {
    if (amount && numInstallments >= 2) {
      const defaultAmount = amount / numInstallments;
      const newInstallments = Array.from({ length: numInstallments }, (_, i) => ({
        installmentNumber: `${i + 1}`,
        installmentAmount: defaultAmount,
        durationInDays: i === 0 ? 0 : 15, // First installment has no duration
      }));
      setInstallmentData(newInstallments);
    }
  };

  // --- EVENT HANDLERS ---
  const handleNoOfInstallmentsChange = (e) => {
    const newNoOfInstallments = parseInt(e.target.value, 10);
    if (newNoOfInstallments >= 2) {
      setNoOfInstallments(newNoOfInstallments);
      initializeInstallments(batchData.batchAmount, newNoOfInstallments);
    }
  };

  const handleInstallmentAmountChange = (e, index) => {
    const newAmount = parseFloat(e.target.value);
    if (newAmount > 0) {
      const updatedInstallments = [...installmentData];
      updatedInstallments[index].installmentAmount = newAmount;

      // Recalculate remaining amounts
      const totalPaid = updatedInstallments.slice(0, index + 1).reduce((sum, item) => sum + item.installmentAmount, 0);
      const remainingAmount = batchData.batchAmount - totalPaid;
      const remainingInstallmentsCount = noOfInstallments - (index + 1);

      if (remainingInstallmentsCount > 0) {
        const amountPerRemaining = remainingAmount / remainingInstallmentsCount;
        for (let i = index + 1; i < noOfInstallments; i++) {
          updatedInstallments[i].installmentAmount = amountPerRemaining;
        }
      }
      setInstallmentData(updatedInstallments);
    }
  };

  const handleDurationChange = (e, index) => {
    const newDuration = parseInt(e.target.value, 10);
    if (newDuration > 0) {
      const updatedInstallments = [...installmentData];
      updatedInstallments[index].durationInDays = newDuration;
      setInstallmentData(updatedInstallments);
    }
  };
  const clearpaysettings=async()=>{
       try {
      await axios.post(
        `${baseUrl}/Batch/clear/PartPayDetails`,
        {},
        {
          headers: { Authorization: token },
          params: { batchId: batchId },
        }
      );
       MySwal.fire({
        title: 'Success!',
        text: 'Partial payment settings saved successfully.',
        icon: 'success',
      }).then(() => navigate('/batch/viewall'));
    } catch (error) {
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to save settings. Please try again.',
        icon: 'error',
      });
      console.error('Save error:', error);
    }
  }
  const handleSave = async () => {
    if (!enablechecked) {
      clearpaysettings();
      return
    }

    const payload = installmentData.map(item => ({
    InstallmentNumber: parseInt(item.installmentNumber),
    InstallmentAmount: parseFloat(item.installmentAmount),
    DurationInDays: parseInt(item.durationInDays)
}));
    
    try {
      await axios.post(
        `${baseUrl}/Batch/Save/PartPayDetails`,
        payload,
        {
          headers: { Authorization: token },
          params: { batchId: batchId },
        }
      );
      MySwal.fire({
        title: 'Success!',
        text: 'Partial payment settings saved successfully.',
        icon: 'success',
      }).then(() => navigate('/batch/viewall'));
    } catch (error) {
      MySwal.fire({
        title: 'Error!',
        text: 'Failed to save settings. Please try again.',
        icon: 'error',
      });
      console.error('Save error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header"></div>
      <div className="card">
        <div className="card-header">
          <div className="navigateheaders">
            <div onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left"></i>
            </div>
            <div></div>
            <div onClick={() => navigate("/dashboard/course")}>
              <i className="fa-solid fa-xmark"></i>
            </div>
          </div>
          <h4>
            <span>Partial Payment Settings for {batchData.batchTitle}</span>
          </h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-12">
              <h6 className="checkboxes-lg">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={enablechecked}
                  disabled={batchData.batchAmount <= 0}
                  onChange={() => setEnablechecked(!enablechecked)}
                />
                <span htmlFor="check" style={{ display: 'inline' }}>
                  Enable Partial Payment
                </span>
              </h6>
              {enablechecked && (
                <>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group row">
                        <label className="col-sm-4 col-form-label">Batch Amount</label>
                        <div className="col-sm-8">
                          <input type="number" className="form-control" onWheel={(e) => e.currentTarget.blur()} value={batchData.batchAmount} readOnly />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group row">
                        <label className="col-sm-4 col-form-label"> No of Installments </label>
                        <div className="col-sm-8">
                          <input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            className="form-control"
                            value={noOfInstallments}
                            onChange={handleNoOfInstallmentsChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3" style={{ marginBottom: '10px', minHeight: '200px', maxHeight: '250px', overflow: 'auto' }}>
                    <div className="col-md-6">
                      {installmentData.map((installment, index) => (
                        <div key={index}>
                          <div className="form-group row pt-2">
                            <label className="col-sm-4 col-form-label"> Installment {getOrdinalSuffix(index + 1)}</label>
                            <div className="col-sm-8">
                              <input
                                type="number"
                                onWheel={(e) => e.currentTarget.blur()}
                                className="form-control"
                                value={installment.installmentAmount || ''}
                                onChange={(e) => handleInstallmentAmountChange(e, index)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-5 col-md-6">
                      {installmentData.slice(1).map((installment, index) => (
                        <div className="form-group row pt-2" key={index}>
                          <label>
                            Duration for {getOrdinalSuffix(index + 2)} installment
                          </label>
                          <div className="col-sm-8">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                onWheel={(e) => e.currentTarget.blur()}
                                className="form-control"
                                value={installment.durationInDays}
                                onChange={(e) => handleDurationChange(e, index + 1)}
                              />
                              <label style={{ marginLeft: '5px' }}>Days</label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="cornerbtn">
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partialpaymentsetting;