import React, { useState, useEffect } from 'react';
import { Calendar, Book, Lock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Wordle from './wordle';
import Cryptogram from "./cryptogram";
import Prompt from './prompt';

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [puzzleData, setPuzzleData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [progress, setProgress] = useState({});

  // Load puzzle data from JSON file
  useEffect(() => {
    fetch('/puzzles.json')
      .then(response => response.json())
      .then(data => {
        setPuzzleData(data);
        const dates = Object.keys(data).sort();
        setAvailableDates(dates);
        
        // Set initial date to most recent date with content
        const today = new Date().toISOString().split('T')[0];
        const mostRecentDate = dates.filter(d => d <= today).pop() || dates[dates.length - 1];
        setSelectedDate(mostRecentDate);
      })
      .catch(error => console.error('Error loading puzzle data:', error));
  }, []);

  // Load progress from cookie
  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const progressCookie = cookies.find(row => row.startsWith('cfm_progress='));
    if (progressCookie) {
      try {
        const progressData = JSON.parse(decodeURIComponent(progressCookie.split('=')[1]));
        setProgress(progressData);
      } catch (error) {
        console.error('Error parsing progress cookie:', error);
      }
    }
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

  const getProgressColor = (date) => {
    const dateProgress = progress[date];
    if (!dateProgress) {
      return 'bg-green-500'; // No progress - green
    }
    const hasWordle = dateProgress.wordle;
    const hasScryptogram = dateProgress.scryptogram;
    
    if (hasWordle && hasScryptogram) {
      return 'bg-blue-500'; // Both complete - blue
    } else {
      return 'bg-yellow-500'; // One complete - yellow
    }
  };

  const navigateDate = (direction) => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const canNavigatePrev = selectedDate && availableDates.indexOf(selectedDate) > 0;
  const canNavigateNext = selectedDate && availableDates.indexOf(selectedDate) < availableDates.length - 1;

  const currentPuzzle = puzzleData?.[selectedDate];

  if (!selectedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

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
          <div className="flex items-center justify-center gap-2">
            <p className="text-xl text-gray-600">{formatDate(selectedDate)}</p>
            <div className={`w-3 h-3 rounded-full ${getProgressColor(selectedDate)}`} title="Progress indicator"></div>
          </div>
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
        
        {/* Date Selector with Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => navigateDate('prev')}
              disabled={!canNavigatePrev}
              className={`p-2 rounded-lg transition-all ${
                canNavigatePrev 
                  ? `${getProgressColor(selectedDate).replace('bg-', 'bg-')} hover:opacity-80 text-white` 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Previous content"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <Calendar className="w-6 h-6 text-gray-600" />
            <label htmlFor="date-picker" className="text-lg font-semibold text-gray-700">
              Select a Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                // Only allow selection if date has content
                if (availableDates.includes(e.target.value)) {
                  setSelectedDate(e.target.value);
                }
              }}
              max={(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            />
            
            <button
              onClick={() => navigateDate('next')}
              disabled={!canNavigateNext}
              className={`p-2 rounded-lg transition-all ${
                canNavigateNext 
                  ? `${getProgressColor(selectedDate)} hover:opacity-80 text-white` 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Next content"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Choose a date to view past content
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Not started</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>In progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;