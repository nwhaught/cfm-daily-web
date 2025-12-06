import React, { useEffect, useRef, useState } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ---------------- Helpers ---------------- */

function encodeText(plaintext = "", cipher = ALPHABET) {
  const table = {};
  for (let i = 0; i < 26; i++) table[ALPHABET[i]] = cipher[i] || ALPHABET[i];

  return plaintext
    .split("")
    .map((ch) => {
      const u = ch.toUpperCase();
      if (!/[A-Z]/.test(u)) return ch; // punctuation/space -> unchanged
      return table[u];
    })
    .join("");
}

function readProgressCookie() {
  try {
    const cookies = document.cookie.split("; ");
    const c = cookies.find((x) => x.startsWith("cfm_progress="));
    if (!c) return {};
    return JSON.parse(decodeURIComponent(c.split("=")[1]));
  } catch (e) {
    console.error("readProgressCookie error", e);
    return {};
  }
}

function writeProgressCookie(progress) {
  try {
    document.cookie = `cfm_progress=${encodeURIComponent(
      JSON.stringify(progress)
    )}; path=/; max-age=31536000`;
  } catch (e) {
    console.error("writeProgressCookie error", e);
  }
}

/* ---------------- Confetti Effect ---------------- */
function triggerConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#bb0000', '#ffffff', '#00bb00', '#0000bb', '#bbbb00'];

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.width = '10px';
      particle.style.height = '10px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * window.innerWidth + 'px';
      particle.style.top = '-10px';
      particle.style.opacity = '1';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      document.body.appendChild(particle);

      const angle = randomInRange(-30, 30);
      const velocity = randomInRange(4, 8);
      let posY = 0;
      let posX = parseInt(particle.style.left);
      let opacity = 1;

      const fall = setInterval(() => {
        posY += velocity;
        posX += Math.sin(angle) * 2;
        opacity -= 0.01;
        
        particle.style.top = posY + 'px';
        particle.style.left = posX + 'px';
        particle.style.opacity = opacity;

        if (posY > window.innerHeight || opacity <= 0) {
          clearInterval(fall);
          particle.remove();
        }
      }, 20);
    }
  }, 50);
}

/* ---------------- Styles ---------------- */

const monospace = { fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace" };

const styles = {
  container: { margin: 20, fontFamily: "system-ui, Arial, sans-serif" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  hintText: { marginTop: 12, fontSize: 16 },
  puzzleBox: (solved) => ({
    border: solved ? "4px solid green" : "2px solid black",
    padding: 20,
    marginTop: 20,
    fontSize: 24,
    lineHeight: "36px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    ...monospace,
  }),
  wordWrap: { whiteSpace: "nowrap", marginRight: 10, display: "inline-flex" },
  letterCell: {
    display: "inline-block",
    textAlign: "center",
    margin: "0 -6px",
    width: 36,
  },
  solvedTop: {
    height: 22,
    marginBottom: 6,
    fontWeight: "bold",
    fontStyle: "normal",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
  },
  cipherBottom: { fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" },
  guessesGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 },
  guessBox: { textAlign: "center" },
  input: {
    width: 36,
    height: 36,
    textAlign: "center",
    fontSize: 18,
    textTransform: "uppercase",
    border: "2px solid black",
    outline: "none",
    ...monospace,
  },
  small: { fontSize: 12, color: "#666", marginTop: 6 },
  warning: { color: "#b23", marginTop: 8 },
  controls: { marginTop: 12, display: "flex", gap: 12, alignItems: "center" },
  leftButtons: { display: "flex", gap: 12, alignItems: "center" },
  rightButtons: { display: "flex", gap: 12, alignItems: "center", marginLeft: "auto" },
};

/* ---------------- Subcomponents ---------------- */

function LetterCell({ enc, solvedChar }) {
  // enc: cipher letter or punctuation/space (bottom)
  // solvedChar: top row string (for letters) OR punctuation char (for punctuation)
  const isLetter = /[A-Z]/.test(enc);
  // For punctuation, solvedChar should display same punctuation; for space, both are empty
  const topDisplay = (() => {
    if (!isLetter) {
      // punctuation or space
      return enc === " " ? "" : enc;
    }
    return solvedChar || "_";
  })();

  const bottomDisplay = (() => {
    if (!isLetter) {
      return enc === " " ? "" : enc;
    }
    return enc;
  })();

  return (
    <span style={styles.letterCell} aria-hidden={false}>
      <div style={styles.solvedTop}>{topDisplay}</div>
      <div style={styles.cipherBottom}>{bottomDisplay}</div>
    </span>
  );
}

/* ---------------- Main Component ---------------- */

export default function Cryptogram({ selectedDate, puzzles }) {
  /**
   * puzzles may be:
   *  - puzzles.scryptogram (App already passed scryptogram)
   *  - puzzles[selectedDate].scryptogram (App passed full map)
   * We'll attempt both.
   */
  const puzzleData =
    puzzles?.scryptogram ??
    puzzles?.[selectedDate]?.scryptogram ??
    puzzles?.[selectedDate] ??
    null;

  const solution = puzzleData?.solution ?? "";
  const hint = puzzleData?.hint ?? "";
  const cipherAlphabet = puzzleData?.cipher ?? ALPHABET;

  // cipher text (same length/indices as solution, punctuation preserved)
  const cipherText = encodeText(solution, cipherAlphabet);
  const cipherArray = cipherText.split(""); // may contain punctuation or spaces

  // unique cipher letters (A-Z only)
  const [uniqueLetters, setUniqueLetters] = useState([]);
  // cipher letter => guessed plaintext letter (uppercase single char)
  const [cipherMapping, setCipherMapping] = useState({});
  // cookie/session storage refs
  const inputsRef = useRef({});
  const [showHint, setShowHint] = useState(null);
  const [solved, setSolved] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  /* --- Compute unique letters from ciphertext --- */
  useEffect(() => {
    if (!puzzleData) {
      setUniqueLetters([]);
      return;
    }
    const letters = cipherText
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("");
    const uniq = Array.from(new Set(letters)).sort();
    setUniqueLetters(uniq);
  }, [puzzleData, solution]);

  /* --- Load saved progress from cookie when selectedDate changes --- */
  useEffect(() => {
    if (!selectedDate) return;
    const progress = readProgressCookie();
    const saved = progress[selectedDate]?.scryptogram ?? {};
    setCipherMapping((prev) => ({ ...prev, ...saved }));

    // restore last-focused input from session storage (if available)
    try {
      const key = `cryptogram_focus_${selectedDate}`;
      const last = sessionStorage.getItem(key);
      if (last && last in inputsRef.current && inputsRef.current[last]?.current) {
        setTimeout(() => {
          inputsRef.current[last].current.focus();
        }, 40);
      }
    } catch (e) {
      // ignore
    }
    
    // Reset confetti trigger when date changes
    setHasTriggeredConfetti(false);
  }, [selectedDate]);

  /* --- Persist progress to cookie whenever mapping changes --- */
  useEffect(() => {
    if (!selectedDate) return;
    try {
      const progress = readProgressCookie();
      if (!progress[selectedDate]) progress[selectedDate] = {};
      progress[selectedDate].scryptogram = { ...cipherMapping };
      writeProgressCookie(progress);
    } catch (e) {
      console.error(e);
    }
  }, [cipherMapping, selectedDate]);

  /* --- Determine solved state --- */
  useEffect(() => {
    if (!puzzleData) {
      setSolved(false);
      return;
    }
    const allCorrect = cipherArray.every((enc, idx) => {
      if (!/[A-Z]/.test(enc)) return true; // punctuation & spaces are considered correct
      const guess = cipherMapping[enc];
      if (!guess) return false;
      return guess.toUpperCase() === (solution[idx] || "").toUpperCase();
    });
    
    // Trigger confetti only once when puzzle is first solved
    if (allCorrect && !solved && !hasTriggeredConfetti) {
      triggerConfetti();
      setHasTriggeredConfetti(true);
    }
    
    setSolved(allCorrect);
  }, [cipherMapping, cipherText, solution, puzzleData, solved, hasTriggeredConfetti]);

  /* --- Prepare refs for inputs each time uniqueLetters changes --- */
  useEffect(() => {
    inputsRef.current = {};
    uniqueLetters.forEach((ch) => {
      inputsRef.current[ch] = React.createRef();
    });
  }, [uniqueLetters]);

  /* --- Duplicate guess detection --- */
  const duplicates = (() => {
    const byPlain = {};
    Object.entries(cipherMapping).forEach(([cipher, plain]) => {
      if (!plain) return;
      const p = plain.toUpperCase();
      if (!byPlain[p]) byPlain[p] = [];
      byPlain[p].push(cipher);
    });
    return Object.entries(byPlain)
      .filter(([, arr]) => arr.length > 1)
      .map(([plain, arr]) => ({ plain, ciphers: arr }));
  })();

  /* --- Input handlers --- */
  const focusInput = (cipherChar) => {
    const r = inputsRef.current?.[cipherChar];
    if (r && r.current) r.current.focus();
    // persist last-focused key
    try {
      const key = `cryptogram_focus_${selectedDate}`;
      sessionStorage.setItem(key, cipherChar);
    } catch (e) {}
  };

  const setMapping = (cipherChar, val) => {
    const v = (val || "").toUpperCase().slice(0, 1);
    if (v && !/^[A-Z]$/.test(v)) return;
    setCipherMapping((prev) => ({ ...prev, [cipherChar]: v }));
  };

  const handleKeyDown = (e, cipherChar) => {
    const idx = uniqueLetters.indexOf(cipherChar);
    if (e.key === "ArrowRight") {
      if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      if (idx > 0) focusInput(uniqueLetters[idx - 1]);
      e.preventDefault();
    } else if (e.key === "Backspace") {
      const val = cipherMapping[cipherChar] || "";
      if (val) {
        setMapping(cipherChar, "");
      } else if (idx > 0) {
        focusInput(uniqueLetters[idx - 1]);
      }
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
      e.preventDefault();
    }
  };

  const handlePaste = (e, cipherChar, idx) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!text) return;
    const ch = text.trim().toUpperCase().slice(0, 1);
    if (!/^[A-Z]$/.test(ch)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setMapping(cipherChar, ch);
    // auto-focus next
    if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
  };

  // /* --- Hint reveal: reveal the plaintext character for the first unsolved cipher slot --- */
  // //TODO: show a RANDOM unsolved cipher slot.
  // const revealHint = () => {
  //   for (let i = 0; i < cipherArray.length; i++) {
  //     const enc = cipherArray[i];
  //     if (!/[A-Z]/.test(enc)) continue;
  //     const desired = (solution[i] || "").toUpperCase();
  //     if (!cipherMapping[enc] || cipherMapping[enc].toUpperCase() !== desired) {
  //       setCipherMapping((prev) => ({ ...prev, [enc]: desired }));
  //       setShowHint(enc);
  //       setTimeout(() => focusInput(enc), 40);
  //       return;
  //     }
  //   }
  // };
/* --- Hint reveal: reveal the plaintext character for a random unsolved cipher slot --- */
const revealHint = () => {
  // Collect all unsolved cipher slots
  const unsolvedSlots = [];
  
  for (let i = 0; i < cipherArray.length; i++) {
    const enc = cipherArray[i];
    if (!/[A-Z]/.test(enc)) continue;
    const desired = (solution[i] || "").toUpperCase();
    if (!cipherMapping[enc] || cipherMapping[enc].toUpperCase() !== desired) {
      unsolvedSlots.push({ index: i, enc, desired });
    }
  }
  
  // If there are unsolved slots, pick one randomly
  if (unsolvedSlots.length > 0) {
    const randomSlot = unsolvedSlots[Math.floor(Math.random() * unsolvedSlots.length)];
    setCipherMapping((prev) => ({ ...prev, [randomSlot.enc]: randomSlot.desired }));
    setShowHint(randomSlot.enc);
    setTimeout(() => focusInput(randomSlot.enc), 40);
  }
};
  /* --- Reset today's progress --- */
  const resetProgress = () => {
    try {
      const all = readProgressCookie();
      if (all[selectedDate]) {
        delete all[selectedDate];
      }
      writeProgressCookie(all);
    } catch (e) {
      console.error(e);
    }
    setCipherMapping({});
    setShowHint(null);
    setHasTriggeredConfetti(false);
    // clear focus key
    try {
      const key = `cryptogram_focus_${selectedDate}`;
      sessionStorage.removeItem(key);
    } catch (e) {}
    // focus first input if exists
    setTimeout(() => {
      if (uniqueLetters.length) focusInput(uniqueLetters[0]);
    }, 40);
  };

  /* --- Render puzzle (top) --- */
  const renderPuzzle = () => {
    if (!puzzleData) return <div style={{ marginTop: 12 }}>No puzzle data</div>;

    // Split solution into words to prevent word breaks; each word mapped to encoded letters
    const words = solution.split(" ");

    return (
      <div style={styles.puzzleBox(solved)} aria-live="polite">
        {words.map((word, wi) => {
          // preserve punctuation: encodeText leaves punctuation unchanged
          const encoded = encodeText(word, cipherAlphabet).split("");
          return (
            <span key={wi} style={styles.wordWrap}>
              {encoded.map((enc, idx) => {
                // plain char at this index (may be letter or punctuation)
                const plainChar = (word[idx] || "");
                const isLetter = /[A-Z]/.test(enc);
                const solvedChar = isLetter ? (cipherMapping[enc] || "") : ""; // if punctuation, we show enc directly in LetterCell
                return <LetterCell key={idx} enc={enc} solvedChar={solvedChar} />;
              })}
              {/* add a bit of space for the word gap (space in solution) */}
              {wi < words.length - 1 ? <span style={{ width: 6 }} /> : null}
            </span>
          );
        })}
      </div>
    );
  };

  /* --- Render guesses (input grid) --- */
  const renderGuesses = () => {
    return (
      <>
        <div style={styles.guessesGrid}>
          {uniqueLetters.map((ch, idx) => {
            const value = cipherMapping[ch] || "";
            return (
              <div key={ch} style={styles.guessBox}>
                <input
                  ref={(el) => {
                    if (!inputsRef.current) inputsRef.current = {};
                    inputsRef.current[ch] = { current: el };
                  }}
                  aria-label={`guess for ${ch}`}
                  style={styles.input}
                  maxLength={1}
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().slice(0, 1);
                    if (v && !/^[A-Z]$/.test(v)) return;
                    setMapping(ch, v);
                    if (v && idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, ch)}
                  onPaste={(e) => handlePaste(e, ch, idx)}
                />
                <div style={{ fontSize: 20, marginTop: 6 }}>{ch}</div>
              </div>
            );
          })}
        </div>
        <div style={styles.small}>
          Tip: type a letter (A–Z). Use ← → to move, Backspace clears & moves left, Enter moves right.
        </div>

        {duplicates.length > 0 && (
          <div style={styles.warning}>
            Duplicate guesses detected:
            <ul>
              {duplicates.map((d) => (
                <li key={d.plain}>
                  Plain <strong>{d.plain}</strong> is used for: {d.ciphers.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.leftButtons}>
          <button onClick={revealHint}>Get Hint</button>
          {showHint && (
            <div>
              Hint revealed: <strong>{showHint}</strong> ={" "}
              <strong>{(cipherMapping[showHint] || "").toUpperCase()}</strong>
            </div>
          )}
        </div>
        <div style={styles.rightButtons}>
          <button onClick={resetProgress}>Reset Today's Progress</button>
        </div>
      </div>

      <h3 style={styles.hintText}>{hint}</h3>

      {renderPuzzle()}

      <h3 style={{ marginTop: 30 }}>Your Guesses</h3>
      {renderGuesses()}
    </div>
  );
}

// import React, { useEffect, useRef, useState } from "react";

// const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// /* ---------------- Helpers ---------------- */

// function encodeText(plaintext = "", cipher = ALPHABET) {
//   const table = {};
//   for (let i = 0; i < 26; i++) table[ALPHABET[i]] = cipher[i] || ALPHABET[i];

//   return plaintext
//     .split("")
//     .map((ch) => {
//       const u = ch.toUpperCase();
//       if (!/[A-Z]/.test(u)) return ch; // punctuation/space -> unchanged
//       return table[u];
//     })
//     .join("");
// }

// function readProgressCookie() {
//   try {
//     const cookies = document.cookie.split("; ");
//     const c = cookies.find((x) => x.startsWith("cfm_progress="));
//     if (!c) return {};
//     return JSON.parse(decodeURIComponent(c.split("=")[1]));
//   } catch (e) {
//     console.error("readProgressCookie error", e);
//     return {};
//   }
// }

// function writeProgressCookie(progress) {
//   try {
//     document.cookie = `cfm_progress=${encodeURIComponent(
//       JSON.stringify(progress)
//     )}; path=/; max-age=31536000`;
//   } catch (e) {
//     console.error("writeProgressCookie error", e);
//   }
// }

// /* ---------------- Styles ---------------- */

// const monospace = { fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace" };

// const styles = {
//   container: { margin: 20, fontFamily: "system-ui, Arial, sans-serif" },
//   headerRow: { display: "flex", alignItems: "center", gap: 12 },
//   hintText: { marginTop: 12, fontSize: 16 },
//   puzzleBox: (solved) => ({
//     border: solved ? "4px solid green" : "2px solid black",
//     padding: 20,
//     marginTop: 20,
//     fontSize: 20,
//     lineHeight: "36px",
//     display: "flex",
//     flexWrap: "wrap",
//     alignItems: "center",
//     ...monospace,
//   }),
//   wordWrap: { whiteSpace: "nowrap", marginRight: 10, display: "inline-flex" },
//   letterCell: {
//     display: "inline-block",
//     textAlign: "center",
//     margin: "0 4px",
//     width: 36,
//   },
//   solvedTop: {
//     height: 22,
//     marginBottom: 6,
//     fontWeight: "bold",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   cipherBottom: { fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
//   guessesGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 },
//   guessBox: { textAlign: "center" },
//   input: {
//     width: 36,
//     height: 36,
//     textAlign: "center",
//     fontSize: 18,
//     textTransform: "uppercase",
//     border: "2px solid black",
//     outline: "none",
//     ...monospace,
//   },
//   small: { fontSize: 12, color: "#666", marginTop: 6 },
//   warning: { color: "#b23", marginTop: 8 },
//   controls: { marginTop: 12, display: "flex", gap: 12, alignItems: "center" },
// };

// /* ---------------- Subcomponents ---------------- */

// function LetterCell({ enc, solvedChar }) {
//   // enc: cipher letter or punctuation/space (bottom)
//   // solvedChar: top row string (for letters) OR punctuation char (for punctuation)
//   const isLetter = /[A-Z]/.test(enc);
//   // For punctuation, solvedChar should display same punctuation; for space, both are empty
//   const topDisplay = (() => {
//     if (!isLetter) {
//       // punctuation or space
//       return enc === " " ? "" : enc;
//     }
//     return solvedChar || "_";
//   })();

//   const bottomDisplay = (() => {
//     if (!isLetter) {
//       return enc === " " ? "" : enc;
//     }
//     return enc;
//   })();

//   return (
//     <span style={styles.letterCell} aria-hidden={false}>
//       <div style={styles.solvedTop}>{topDisplay}</div>
//       <div style={styles.cipherBottom}>{bottomDisplay}</div>
//     </span>
//   );
// }

// /* ---------------- Main Component ---------------- */

// export default function Cryptogram({ selectedDate, puzzles }) {
//   /**
//    * puzzles may be:
//    *  - puzzles.scryptogram (App already passed scryptogram)
//    *  - puzzles[selectedDate].scryptogram (App passed full map)
//    * We'll attempt both.
//    */
//   const puzzleData =
//     puzzles?.scryptogram ??
//     puzzles?.[selectedDate]?.scryptogram ??
//     puzzles?.[selectedDate] ??
//     null;

//   const solution = puzzleData?.solution ?? "";
//   const hint = puzzleData?.hint ?? "";
//   const cipherAlphabet = puzzleData?.cipher ?? ALPHABET;

//   // cipher text (same length/indices as solution, punctuation preserved)
//   const cipherText = encodeText(solution, cipherAlphabet);
//   const cipherArray = cipherText.split(""); // may contain punctuation or spaces

//   // unique cipher letters (A-Z only)
//   const [uniqueLetters, setUniqueLetters] = useState([]);
//   // cipher letter => guessed plaintext letter (uppercase single char)
//   const [cipherMapping, setCipherMapping] = useState({});
//   // cookie/session storage refs
//   const inputsRef = useRef({});
//   const [showHint, setShowHint] = useState(null);
//   const [solved, setSolved] = useState(false);

//   /* --- Compute unique letters from ciphertext --- */
//   useEffect(() => {
//     if (!puzzleData) {
//       setUniqueLetters([]);
//       return;
//     }
//     const letters = cipherText
//       .toUpperCase()
//       .replace(/[^A-Z]/g, "")
//       .split("");
//     const uniq = Array.from(new Set(letters)).sort();
//     setUniqueLetters(uniq);
//   }, [puzzleData, solution]);

//   /* --- Load saved progress from cookie when selectedDate changes --- */
//   useEffect(() => {
//     if (!selectedDate) return;
//     const progress = readProgressCookie();
//     const saved = progress[selectedDate]?.scryptogram ?? {};
//     setCipherMapping((prev) => ({ ...prev, ...saved }));

//     // restore last-focused input from session storage (if available)
//     try {
//       const key = `cryptogram_focus_${selectedDate}`;
//       const last = sessionStorage.getItem(key);
//       if (last && last in inputsRef.current && inputsRef.current[last]?.current) {
//         setTimeout(() => {
//           inputsRef.current[last].current.focus();
//         }, 40);
//       }
//     } catch (e) {
//       // ignore
//     }
//   }, [selectedDate]);

//   /* --- Persist progress to cookie whenever mapping changes --- */
//   useEffect(() => {
//     if (!selectedDate) return;
//     try {
//       const progress = readProgressCookie();
//       if (!progress[selectedDate]) progress[selectedDate] = {};
//       progress[selectedDate].scryptogram = { ...cipherMapping };
//       writeProgressCookie(progress);
//     } catch (e) {
//       console.error(e);
//     }
//   }, [cipherMapping, selectedDate]);

//   /* --- Determine solved state --- */
//   useEffect(() => {
//     if (!puzzleData) {
//       setSolved(false);
//       return;
//     }
//     const allCorrect = cipherArray.every((enc, idx) => {
//       if (!/[A-Z]/.test(enc)) return true; // punctuation & spaces are considered correct
//       const guess = cipherMapping[enc];
//       if (!guess) return false;
//       return guess.toUpperCase() === (solution[idx] || "").toUpperCase();
//     });
//     setSolved(allCorrect);
//   }, [cipherMapping, cipherText, solution, puzzleData]);

//   /* --- Prepare refs for inputs each time uniqueLetters changes --- */
//   useEffect(() => {
//     inputsRef.current = {};
//     uniqueLetters.forEach((ch) => {
//       inputsRef.current[ch] = React.createRef();
//     });
//   }, [uniqueLetters]);

//   /* --- Duplicate guess detection --- */
//   const duplicates = (() => {
//     const byPlain = {};
//     Object.entries(cipherMapping).forEach(([cipher, plain]) => {
//       if (!plain) return;
//       const p = plain.toUpperCase();
//       if (!byPlain[p]) byPlain[p] = [];
//       byPlain[p].push(cipher);
//     });
//     return Object.entries(byPlain)
//       .filter(([, arr]) => arr.length > 1)
//       .map(([plain, arr]) => ({ plain, ciphers: arr }));
//   })();

//   /* --- Input handlers --- */
//   const focusInput = (cipherChar) => {
//     const r = inputsRef.current?.[cipherChar];
//     if (r && r.current) r.current.focus();
//     // persist last-focused key
//     try {
//       const key = `cryptogram_focus_${selectedDate}`;
//       sessionStorage.setItem(key, cipherChar);
//     } catch (e) {}
//   };

//   const setMapping = (cipherChar, val) => {
//     const v = (val || "").toUpperCase().slice(0, 1);
//     if (v && !/^[A-Z]$/.test(v)) return;
//     setCipherMapping((prev) => ({ ...prev, [cipherChar]: v }));
//   };

//   const handleKeyDown = (e, cipherChar) => {
//     const idx = uniqueLetters.indexOf(cipherChar);
//     if (e.key === "ArrowRight") {
//       if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
//       e.preventDefault();
//     } else if (e.key === "ArrowLeft") {
//       if (idx > 0) focusInput(uniqueLetters[idx - 1]);
//       e.preventDefault();
//     } else if (e.key === "Backspace") {
//       const val = cipherMapping[cipherChar] || "";
//       if (val) {
//         setMapping(cipherChar, "");
//       } else if (idx > 0) {
//         focusInput(uniqueLetters[idx - 1]);
//       }
//       e.preventDefault();
//     } else if (e.key === "Enter") {
//       if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
//       e.preventDefault();
//     }
//   };

//   const handlePaste = (e, cipherChar, idx) => {
//     const text = (e.clipboardData || window.clipboardData).getData("text");
//     if (!text) return;
//     const ch = text.trim().toUpperCase().slice(0, 1);
//     if (!/^[A-Z]$/.test(ch)) {
//       e.preventDefault();
//       return;
//     }
//     e.preventDefault();
//     setMapping(cipherChar, ch);
//     // auto-focus next
//     if (idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
//   };

//   /* --- Hint reveal: reveal the plaintext character for the first unsolved cipher slot --- */
//   const revealHint = () => {
//     for (let i = 0; i < cipherArray.length; i++) {
//       const enc = cipherArray[i];
//       if (!/[A-Z]/.test(enc)) continue;
//       const desired = (solution[i] || "").toUpperCase();
//       if (!cipherMapping[enc] || cipherMapping[enc].toUpperCase() !== desired) {
//         setCipherMapping((prev) => ({ ...prev, [enc]: desired }));
//         setShowHint(enc);
//         setTimeout(() => focusInput(enc), 40);
//         return;
//       }
//     }
//   };

//   /* --- Reset today's progress --- */
//   const resetProgress = () => {
//     try {
//       const all = readProgressCookie();
//       if (all[selectedDate]) {
//         delete all[selectedDate];
//       }
//       writeProgressCookie(all);
//     } catch (e) {
//       console.error(e);
//     }
//     setCipherMapping({});
//     setShowHint(null);
//     // clear focus key
//     try {
//       const key = `cryptogram_focus_${selectedDate}`;
//       sessionStorage.removeItem(key);
//     } catch (e) {}
//     // focus first input if exists
//     setTimeout(() => {
//       if (uniqueLetters.length) focusInput(uniqueLetters[0]);
//     }, 40);
//   };

//   /* --- Render puzzle (top) --- */
//   const renderPuzzle = () => {
//     if (!puzzleData) return <div style={{ marginTop: 12 }}>No puzzle data</div>;

//     // Split solution into words to prevent word breaks; each word mapped to encoded letters
//     const words = solution.split(" ");

//     return (
//       <div style={styles.puzzleBox(solved)} aria-live="polite">
//         {words.map((word, wi) => {
//           // preserve punctuation: encodeText leaves punctuation unchanged
//           const encoded = encodeText(word, cipherAlphabet).split("");
//           return (
//             <span key={wi} style={styles.wordWrap}>
//               {encoded.map((enc, idx) => {
//                 // plain char at this index (may be letter or punctuation)
//                 const plainChar = (word[idx] || "");
//                 const isLetter = /[A-Z]/.test(enc);
//                 const solvedChar = isLetter ? (cipherMapping[enc] || "") : ""; // if punctuation, we show enc directly in LetterCell
//                 return <LetterCell key={idx} enc={enc} solvedChar={solvedChar} />;
//               })}
//               {/* add a bit of space for the word gap (space in solution) */}
//               {wi < words.length - 1 ? <span style={{ width: 6 }} /> : null}
//             </span>
//           );
//         })}
//       </div>
//     );
//   };

//   /* --- Render guesses (input grid) --- */
//   const renderGuesses = () => {
//     return (
//       <>
//         <div style={styles.guessesGrid}>
//           {uniqueLetters.map((ch, idx) => {
//             const value = cipherMapping[ch] || "";
//             return (
//               <div key={ch} style={styles.guessBox}>
//                 <input
//                   ref={(el) => {
//                     if (!inputsRef.current) inputsRef.current = {};
//                     inputsRef.current[ch] = { current: el };
//                   }}
//                   aria-label={`guess for ${ch}`}
//                   style={styles.input}
//                   maxLength={1}
//                   value={value}
//                   onChange={(e) => {
//                     const v = e.target.value.toUpperCase().slice(0, 1);
//                     if (v && !/^[A-Z]$/.test(v)) return;
//                     setMapping(ch, v);
//                     if (v && idx < uniqueLetters.length - 1) focusInput(uniqueLetters[idx + 1]);
//                   }}
//                   onKeyDown={(e) => handleKeyDown(e, ch)}
//                   onPaste={(e) => handlePaste(e, ch, idx)}
//                 />
//                 <div style={{ fontSize: 20, marginTop: 6 }}>{ch}</div>
//               </div>
//             );
//           })}
//         </div>
//         <div style={styles.small}>
//           Tip: type a letter (A–Z). Use ← → to move, Backspace clears & moves left, Enter moves right.
//         </div>

//         {duplicates.length > 0 && (
//           <div style={styles.warning}>
//             Duplicate guesses detected:
//             <ul>
//               {duplicates.map((d) => (
//                 <li key={d.plain}>
//                   Plain <strong>{d.plain}</strong> is used for: {d.ciphers.join(", ")}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </>
//     );
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.headerRow}>
//         <button onClick={revealHint}>Get Hint</button>
//         <button onClick={resetProgress}>Reset Today's Progress</button>
//         {showHint && (
//           <div>
//             Hint revealed: <strong>{showHint}</strong> ={" "}
//             <strong>{(cipherMapping[showHint] || "").toUpperCase()}</strong>
//           </div>
//         )}
//       </div>

//       <h3 style={styles.hintText}>{hint}</h3>

//       {renderPuzzle()}

//       <h3 style={{ marginTop: 30 }}>Your Guesses</h3>
//       {renderGuesses()}
//     </div>
//   );
// }

