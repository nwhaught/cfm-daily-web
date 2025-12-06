import React, { useState, useEffect } from 'react';
import { Calendar, Book, Lock, FileText } from 'lucide-react';
import Wordle from './wordle';
import Cryptogram from "./cryptogram";
import Prompt from './prompt';

function App() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activeSection, setActiveSection] = useState('home');
  const [puzzleData, setPuzzleData] = useState(null);

  // Load puzzle data from JSON file
  useEffect(() => {
    fetch('/puzzles.json')
      .then(response => response.json())
      .then(data => setPuzzleData(data))
      .catch(error => console.error('Error loading puzzle data:', error));
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const handleBackToHome = () => {
    setActiveSection('home');
  };

  const currentPuzzle = puzzleData?.[selectedDate];

  if (activeSection !== 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToHome}
            className="mb-6 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <p className="text-gray-600 mb-6 text-center">{formatDate(selectedDate)}</p>
            
            {activeSection === 'wordle' && (
              <Wordle selectedDate={selectedDate} puzzleData={currentPuzzle} />
            )}
            
            {activeSection === 'cryptogram' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Scryptogram</h2>
                <div className="text-gray-500 italic">
                <Cryptogram selectedDate={selectedDate} puzzles={currentPuzzle} />

                </div>
              </div>
            )}
            
            {activeSection === 'prompt' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Today's Prompt</h2>
                <div className="text-gray-500 italic">
                {activeSection === 'prompt' && (
                  <Prompt selectedDate={selectedDate} puzzleData={currentPuzzle} />
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">CFM Daily</h1>
          <p className="text-xl text-gray-600">{formatDate(selectedDate)}</p>
        </div>

        {/* Section Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* ScriptureSpell Card */}
          <button
            onClick={() => handleSectionClick('wordle')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Book className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ScriptureSpell
              </h2>
              <p className="text-gray-600">
                Test your knowledge with today's word puzzle
              </p>
            </div>
          </button>

          {/* Scryptogram Card */}
          <button
            onClick={() => handleSectionClick('cryptogram')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Scryptogram
              </h2>
              <p className="text-gray-600">
                Decode today's encrypted message
              </p>
            </div>
          </button>

          {/* Today's Prompt Card */}
          <button
            onClick={() => handleSectionClick('prompt')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Today's Prompt
              </h2>
              <p className="text-gray-600">
                Read today's reflection and inspiration
              </p>
            </div>
          </button>
        </div>

        {/* Date Selector */}
        {/* <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center gap-4">
            <Calendar className="w-6 h-6 text-gray-600" />
            <label htmlFor="date-picker" className="text-lg font-semibold text-gray-700">
              Select a Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Choose a previous date to view past content
          </p>
        </div> */}
{/* Date Selector */}
<div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center gap-4">
            <Calendar className="w-6 h-6 text-gray-600" />
            <label htmlFor="date-picker" className="text-lg font-semibold text-gray-700">
              Select a Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={(() => {
                const today = new Date();
                console.log("TOday is: ", today);
                console.log("today's day is: ", today.getDate());
                console.log("today's month is: ", today.getMonth()+1);
                console.log("today's year is: ", today.getFullYear());
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Choose a previous date to view past content
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;