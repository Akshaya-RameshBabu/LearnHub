import React, { useState } from 'react'

const ValidateQuizz = ({answers,Assignment}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
      
        const currentQuestion = Assignment?.questions[currentQuestionIndex];
        const questionId = currentQuestion?.id;
        const handlePrevQuestion = () => {
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
          }
        };
      
        const handleNextQuestion = () => {
          if (currentQuestionIndex < Assignment?.questions.length - 1) {
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
                              className='disabledRadio'
                              checked={answers[questionId] === optionValue}
                              readOnly
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
              
                      {currentQuestionIndex < Assignment?.questions.length - 1 && (
                        <button
                          onClick={handleNextQuestion}
                          disabled={!answers[questionId]}
                          className="btn btn-primary"
                        >
                          Next
                        </button>
                      ) }
                    </div>
                  </div>
  )
}

export default ValidateQuizz