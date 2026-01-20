import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function Wordle({ selectedDate, puzzleData }) {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [message, setMessage] = useState('');
  const [validWords, setValidWords] = useState(new Set());

  const solution = puzzleData?.wordle?.toUpperCase() || 'START';

  // Load valid words list
  useEffect(() => {
    fetch('/valid-wordle-guesses.json')
      .then(response => response.json())
      .then(data => {
        const words = new Set(data.map(word => word.toUpperCase()));
        setValidWords(words);
      })
      .catch(error => console.error('Error loading valid words:', error));
  }, []);

  const loadProgress = useCallback(() => {
    try {
      const cookies = document.cookie.split('; ');
      const progressCookie = cookies.find(c => c.startsWith('cfm_progress='));
      
      if (progressCookie) {
        const progress = JSON.parse(decodeURIComponent(progressCookie.split('=')[1]));
        const dateProgress = progress[selectedDate];
        
        if (dateProgress?.wordle) {
          const savedGuesses = [];
          for (let i = 1; i <= MAX_GUESSES; i++) {
            if (dateProgress.wordle[`guess${i}`]) {
              savedGuesses.push(dateProgress.wordle[`guess${i}`]);
            }
          }
          setGuesses(savedGuesses);
          
          // Check if game was already won or lost
          if (savedGuesses.includes(solution)) {
            setGameStatus('won');
            setMessage('You already solved this puzzle!');
          } else if (savedGuesses.length >= MAX_GUESSES) {
            setGameStatus('lost');
            setMessage(`The word was ${solution}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, [selectedDate, solution]);

  const saveProgress = useCallback(() => {
    try {
      const cookies = document.cookie.split('; ');
      const progressCookie = cookies.find(c => c.startsWith('cfm_progress='));
      
      let progress = {};
      if (progressCookie) {
        progress = JSON.parse(decodeURIComponent(progressCookie.split('=')[1]));
      }
      
      if (!progress[selectedDate]) {
        progress[selectedDate] = {};
      }
      
      progress[selectedDate].wordle = {};
      guesses.forEach((guess, idx) => {
        progress[selectedDate].wordle[`guess${idx + 1}`] = guess;
      });
      
      document.cookie = `cfm_progress=${encodeURIComponent(JSON.stringify(progress))}; path=/; max-age=31536000`;
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [selectedDate, guesses]);

  // Load saved progress from cookie
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Save progress to cookie whenever guesses change
  useEffect(() => {
    if (guesses.length > 0) {
      saveProgress();
    }
  }, [saveProgress, guesses.length]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage('Word must be 5 letters');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Check if word is valid
    if (!validWords.has(currentGuess) && currentGuess !== solution) {
      setMessage('Not in word list');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === solution) {
      setGameStatus('won');
      setMessage('Congratulations! You solved it!');
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost');
      setMessage(`The word was ${solution}`);
    } else {
      setMessage('');
    }
  }, [currentGuess, validWords, solution, guesses]);

  const handleKeyPress = useCallback((e) => {
    if (gameStatus !== 'playing') return;

    if (e.key === 'Enter') {
      submitGuess();
    } else if (e.key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => (prev + e.key).toUpperCase());
    }
  }, [gameStatus, currentGuess, submitGuess]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const getLetterStatus = (letter, position, word) => {
    // First, check if it's in the correct position
    if (word[position] === solution[position]) {
      return 'correct';
    }
    
    // Count how many of this letter exist in the solution
    const letterCountInSolution = solution.split('').filter(l => l === letter).length;
    
    // Count how many of this letter are already marked as correct in the guess
    const correctCount = word.split('').filter((l, i) => l === letter && solution[i] === letter).length;
    
    // Count how many of this letter appear before this position in the guess and are marked present
    let presentCountBefore = 0;
    for (let i = 0; i < position; i++) {
      if (word[i] === letter && solution[i] !== letter) {
        presentCountBefore++;
      }
    }
    
    // If we've already accounted for all instances of this letter, mark as absent
    if (correctCount + presentCountBefore >= letterCountInSolution) {
      return 'absent';
    }
    
    // Otherwise, if the letter exists in the solution, mark as present
    if (solution.includes(letter)) {
      return 'present';
    }
    
    return 'absent';
  };

  const getLetterColor = (status) => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500';
      case 'present':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'absent':
        return 'bg-gray-400 text-white border-gray-400';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const renderGuessRow = (guess, isCurrentRow = false) => {
    // Always create an array of 5 positions
    const letters = Array(WORD_LENGTH).fill('');
    
    // Fill in the letters we have
    if (guess) {
      guess.split('').forEach((letter, idx) => {
        letters[idx] = letter;
      });
    }
    
    return (
      <div className="flex gap-2 justify-center mb-2">
        {letters.map((letter, idx) => {
          // Only show colors for submitted guesses, not current input
          const status = (guess && !isCurrentRow) ? getLetterStatus(letter, idx, guess) : '';
          const colorClass = (guess && !isCurrentRow) ? getLetterColor(status) : getLetterColor('');
          
          return (
            <div
              key={idx}
              className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold ${colorClass} transition-colors duration-300`}
            >
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  // Get the status of each letter based on all guesses
  const getKeyboardLetterStatus = (letter) => {
    let status = 'unused';
    
    guesses.forEach(guess => {
      guess.split('').forEach((guessLetter, idx) => {
        if (guessLetter === letter) {
          const letterStatus = getLetterStatus(guessLetter, idx, guess);
          // Correct takes precedence over present, present over absent
          if (letterStatus === 'correct') {
            status = 'correct';
          } else if (letterStatus === 'present' && status !== 'correct') {
            status = 'present';
          } else if (letterStatus === 'absent' && status === 'unused') {
            status = 'absent';
          }
        }
      });
    });
    
    return status;
  };

  const getKeyColor = (status) => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 text-white';
      case 'present':
        return 'bg-yellow-500 text-white';
      case 'absent':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    }
  };

  const handleKeyClick = (key) => {
    if (gameStatus !== 'playing') return;
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'DELETE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">ScriptureSpell</h2>
        <p className="text-gray-600">Guess the 5-letter word in 6 tries</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          gameStatus === 'won' ? 'bg-green-100 text-green-800' : 
          gameStatus === 'lost' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {gameStatus === 'won' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Game Board */}
      <div className="mb-6">
        {guesses.map((guess, idx) => (
          <div key={idx}>{renderGuessRow(guess, false)}</div>
        ))}
        
        {gameStatus === 'playing' && guesses.length < MAX_GUESSES && (
          <div>{renderGuessRow(currentGuess, true)}</div>
        )}
        
        {Array.from({ length: MAX_GUESSES - guesses.length - (gameStatus === 'playing' ? 1 : 0) }).map((_, idx) => (
          <div key={`empty-${idx}`}>{renderGuessRow('')}</div>
        ))}
      </div>

      {/* Submit Button */}
      {gameStatus === 'playing' && (
        <div className="text-center mb-6">
          <button
            onClick={submitGuess}
            disabled={currentGuess.length !== WORD_LENGTH}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              currentGuess.length === WORD_LENGTH
                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Submit Guess
          </button>
          <p className="text-sm text-gray-500 mt-2">Or press Enter</p>
        </div>
      )}

       {/* On-Screen Keyboard */}
      <div className="mb-6">
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 justify-center mb-1">
            {row.map(key => {
              const status = key.length === 1 ? getKeyboardLetterStatus(key) : 'unused';
              const isSpecialKey = key === 'ENTER' || key === 'DELETE';
              
              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  disabled={gameStatus !== 'playing'}
                  className={`${isSpecialKey ? 'px-3' : 'w-8'} h-12 rounded font-semibold text-sm transition-colors ${
                    getKeyColor(status)
                  } ${gameStatus !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {key === 'DELETE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Instructions */}
      {gameStatus === 'playing' && guesses.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">How to play:</p>
          <ul className="space-y-1">
            <li>• Type your 5-letter guess and click Submit (or press Enter)</li>
            <li>• <span className="inline-block w-4 h-4 bg-green-500 rounded"></span> Green = correct letter & position</li>
            <li>• <span className="inline-block w-4 h-4 bg-yellow-500 rounded"></span> Yellow = correct letter, wrong position</li>
            <li>• <span className="inline-block w-4 h-4 bg-gray-400 rounded"></span> Gray = letter not in word</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Wordle;
