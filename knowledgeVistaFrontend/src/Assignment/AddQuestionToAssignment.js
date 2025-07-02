import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddQuestionToAssignment = ({ AssignmentQuestion, setAssignmentQuestion, setShowAddQuestion, handleSubmit }) => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const handleAddMore = () => {
        setAssignmentQuestion([...AssignmentQuestion, { questionText: "" }]);
    };

    const handleChange = (index, value) => {
        let newErrors = { ...errors };

        if (value.length > 255) {
            newErrors[index] = "Question must not exceed 255 characters.";
        } else {
            delete newErrors[index];
        }

        setErrors(newErrors);

        setAssignmentQuestion((prevQuestions) =>
            prevQuestions.map((question, i) =>
                i === index ? { ...question, questionText: value } : question
            )
        );
    };

    const handleDelete = (index) => {
        setAssignmentQuestion((prevQuestions) =>
            prevQuestions.filter((_, i) => i !== index)
        );

        let newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
    };

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="card">
                    <div className="card-body">
                        <div className="navigateheaders">
                            <div onClick={() => setShowAddQuestion(false)}>
                                <i className="fa-solid fa-arrow-left"></i>
                            </div>
                            <div></div>
                            <div onClick={() => navigate(-1)}>
                                <i className="fa-solid fa-xmark"></i>
                            </div>
                        </div>
                        <div className='tableheader2 mb-2'>
                            <h4>Add Question to Assignment</h4>
                            <button className="btn btn-primary" onClick={handleAddMore}>
                                Add More
                            </button>
                        </div>
                        <div className='vh-50-overflow'>
                            {AssignmentQuestion.map((question, index) => (
                                <div className="form-group col-sm-11 pb-2 row d-flex align-items-center" key={index}>
                                    <label className="col-auto" style={{ minWidth: "50px", fontWeight: "bold" }}>
                                        {index + 1}.
                                    </label>
                                    <div className="col">
                                        <input
                                            type="text"
                                            placeholder={`Enter Question ${index + 1}`}
                                            className="form-control"
                                            value={question.questionText}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                        />
                                        {errors[index] && <small className="text-danger">{errors[index]}</small>}
                                    </div>
                                    <div className="col-auto">
                                    {question.questionText.trim() !== "" && (

                                        <button className="hidebtn text-danger" onClick={() => handleDelete(index)}>
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cornerbtn">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowAddQuestion(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={Object.keys(errors).length > 0}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddQuestionToAssignment;
