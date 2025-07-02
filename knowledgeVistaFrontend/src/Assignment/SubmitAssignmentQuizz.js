import React, { useState } from 'react'

const SubmitAssignmentQuizz = ({questions,handleInputChange,handleSubmit,answers,existingSubmission}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion?.id;
    const handlePrevQuestion = () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    };
  
    const handleNextQuestion = () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    };
  
    return (
       
      <div className="atgrid">
      <h3>{currentQuestion.questionText}</h3>
      <ul className="listgroup">
        {[1, 2, 3, 4].map((num) => {
          const optionValue = currentQuestion[`option${num}`];
          return (
            <li className="lielement" key={num}>
              <input
                type="radio"
                id={`option${num}-${questionId}`}
                name={`answer-${questionId}`}
                value={optionValue}
                checked={answers[questionId] === optionValue}
                onChange={() => handleInputChange(questionId, optionValue)}
              />
              <label htmlFor={`option${num}-${questionId}`}>
                {optionValue}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="cornerbtns">
        {currentQuestionIndex > 0 && (
          <button className="btn btn-primary" onClick={handlePrevQuestion}>
            Previous
          </button>
        )}

        <div style={{ flex: 1 }}></div>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            disabled={!answers[questionId]}
            className="btn btn-primary"
          >
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn btn-success">
            Submit
          </button>
        )}
      </div>
    </div>
    )
}

export default SubmitAssignmentQuizz