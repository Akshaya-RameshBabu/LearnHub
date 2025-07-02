import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from 'axios';
import baseUrl from '../api/utils';

const OpenRouterKeys = () => {
    const MySwal = withReactContent(Swal); 
    const token=sessionStorage.getItem("token")
    const navigate=useNavigate();

    const [savedKey, setSavedKey] = useState({ openRouterKey: "" });
    const [editKey, setEditKey] = useState({ openRouterKey: "" });
    const [formErrors, setFormErrors] = useState({ openRouterKey: "" });
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if(token){
            const fetchOpenRouterKey = async () => {
                try {
                    const response = await axios.get(`${baseUrl}/openRouter/getkeys`, {
                        headers:{
                            "Authorization":token
                        },
                    });
            
                    if (response.status === 200) {
                        setSavedKey(response.data);
                        setEditKey(response.data);
                    } else if (response.status === 204 || response.status === 404) {
                        setIsEditMode(true);
                    }
                } catch (error) {
                    if (error.response) {
                        if (error.response.status === 404) {
                            setIsEditMode(true);
                        } else if (error.response.status === 401) {
                            navigate("/unauthorized")
                        } else {
                            throw error
                        }
                    }
                }
            };
        
            fetchOpenRouterKey();
        }
    }, [token, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditKey(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({
            ...prev,
            [name]: value.length < 1 ? 'Please enter a valid OpenRouter Key' : ''
        }));
    };

    const handleEdit = () => setIsEditMode(true);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!editKey.openRouterKey) {
            setFormErrors({ openRouterKey: 'This field is required' });
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('keys', editKey.openRouterKey);

            const response = await axios.post(
                `${baseUrl}/openRouter/savekeys`,
                params,
                {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            if (response.status === 200) {
                MySwal.fire({
                    title: "Saved!",
                    text: response.data,
                    icon: "success",
                    confirmButtonText: "OK",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload();
                    }   });
                setIsEditMode(false);
            } 
        } catch (error) {
            throw error
        }
    };

    const viewMode = (
        <div>
            <div className='form-group row' >
                <label htmlFor='openRouterKey'  className="col-sm-3 col-form-label">Open Router Key<span className="text-danger">*</span></label>
                <div className="col-sm-9">
                    <input
                        id='openRouterKey'
                        placeholder='OpenRouter Key'
                        value={savedKey.openRouterKey}
                        className='form-control'
                        readOnly
                    />
                </div>
            </div>
            <div className='btngrp' >
                <button className='btn btn-success' onClick={handleEdit}>Edit</button>
            </div>
        </div>
    );

    const editMode = (
        <div>
            <div className='form-group row' >
                <label htmlFor='openRouterKey'  className="col-sm-3 col-form-label">Open Router Key<span className="text-danger">*</span></label>
                <div className="col-sm-9">
                    <input
                        id='openRouterKey'
                        name='openRouterKey'
                        placeholder='OpenRouter Key'
                        value={editKey.openRouterKey}
                        onChange={handleInputChange}
                        className={`form-control   ${formErrors.openRouterKey && "is-invalid"}`}
                    />
                    <div className="invalid-feedback">{formErrors.openRouterKey}</div>
                </div>
            </div>
            <div className='btngrp' >
                <button className='btn btn-primary' type="submit" onClick={handleSave}>Save</button>
            </div>
        </div>
    );

    return (
       <div>
                            <h4> Open Router Settings</h4>
                            {isEditMode ? editMode : viewMode}
                        </div>
                  
    )
}

export default OpenRouterKeys