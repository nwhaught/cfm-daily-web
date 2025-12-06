import React, { useState } from 'react';

export default function Prompt({ selectedDate, puzzleData }) {
  const [showResponse, setShowResponse] = useState(false);
  const promptData = puzzleData?.prompt;

  if (!promptData) {
    return (
      <div className="text-center text-gray-500 italic py-8">
        No prompt available for this date.
      </div>
    );
  }

  const { reference, referenceText, question, response } = promptData;

  return (
    <div className="max-w-3xl mx-auto">
      {reference && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">{reference}</h3>
          {referenceText && (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg mb-4">
              <p className="text-gray-800 text-lg leading-relaxed italic">
                "{referenceText}"
              </p>
            </div>
          )}
        </div>
      )}

      {question && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Question:</h4>
          <p className="text-gray-800 text-lg leading-relaxed">{question}</p>
        </div>
      )}

      {response && (
        <div className="mb-6">
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            {showResponse ? 'Hide' : 'Display some'} additional thoughts
          </button>

          {showResponse && (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mt-4">
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}