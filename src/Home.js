import { useState, useEffect } from "react";
import Board from "./Board";
import bingoStems from "./bingoStems";
import "./Home.css";

const initDictionary = () => {
  window.localStorage.setItem(
    'definedWords', 
    JSON.stringify({})
  );

  return {}
}

export const defaultDictionary = 
  window.localStorage.getItem('definedWords')
  ? JSON.parse(window.localStorage.getItem('definedWords'))
  : initDictionary();

const Home = () => {
  const [currentLetter, setCurrentLetter] = useState('a');
  const [currentStem, setCurrentStem] = useState('tisane');
  const [foundWords, setFoundWords] = useState([]);
  const [enteredValues, setEnteredValues] = useState(Array(7).fill(''));
  const [roundsFoundWords, setRoundsFoundWords] = useState([]);
  const [roundComplete, setRoundComplete] = useState(false);

  const [dictionary, setDictionary] = useState(defaultDictionary);


  useEffect(() => {
    clearField();
    setRoundsFoundWords([]);
  }, [currentLetter, currentStem]);

  useEffect(() => {
    setCurrentLetter('a');
  }, [currentStem]);

  useEffect(() => {
    if (roundsFoundWords.length === bingoStems[currentStem][currentLetter].length) {
      setRoundComplete(true);
      document.getElementById('nextLetter').focus();
      var audio = new Audio('sounds/zapsplat_bell.mp3');
      audio.volume = 0.2;
      audio.play();
    } else {
      setRoundComplete(false);
    }
  }, [roundsFoundWords, currentStem, currentLetter]);

  // trying to put focus on a button???
  useEffect(() => {
    if (roundComplete) {
      document.getElementById('nextLetter').focus();
    }
  }, [roundComplete]);

  useEffect(() => {

  }, [foundWords]);

  useEffect(() => {
    window.localStorage.setItem(
      'definedWords', 
      JSON.stringify(dictionary)
    );
  }, [dictionary]);


  let stemOptions = [];
  Object.keys(bingoStems).forEach(function(stem) {
    stemOptions.push(
      <option key={stem} value={stem}>{stem}</option>
    );
  });

  const switchStem = (event) => {
    setCurrentStem(event.target.value);
  }

  const clearField = () => {
    let inputs = document.querySelectorAll('#field input');
    inputs.forEach(input => input.value = '');
    inputs[0].focus();
  }


  const wordsBeingSearchedFor = () => {
    return bingoStems[currentStem][currentLetter];
  }

  const showUnfoundWords = () => {
    let unfoundWords = wordsBeingSearchedFor().filter(
      word => !roundsFoundWords.includes(word)
    );
    let preppedUnfoundWords = unfoundWords.map((word, i) => {
      return {
        'word': word,
        'id': foundWords.length + i,
        'found': false
      }
    });

    setFoundWords([
      ...foundWords, 
      ...preppedUnfoundWords
    ]);

    setRoundsFoundWords([
      ...roundsFoundWords, 
      ...unfoundWords
    ]);
  }

  const checkWord = (word) => {
    let valid = wordsBeingSearchedFor().includes(word);
    if (valid && !roundsFoundWords.includes(word)) {
      newWordFound(word);
    }
  }

  const newWordFound = (word) => {
    var audio = new Audio('sounds/zapsplat_pop.mp3');
    audio.volume = 0.2;
    audio.play();

    if (!dictionary[word]) {
      defineWord(word).then(definition => {
        setDictionary({
          ...dictionary,
          [word]: definition
        });
      });
    }
    setFoundWords([
      ...foundWords, 
      {
        'word': word,
        'id': foundWords.length,
        'found': true
      }
    ]);
    setRoundsFoundWords([...roundsFoundWords, word]);
  }


  const defineWord = (word) => {
    return new Promise((resolve, reject) => {
      fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
        .then(response => response.json())
        .then(function(data) {
          let definition = '';
          if (Array.isArray(data)) {
            //assume definition found
            definition = data[0].meanings[0].definitions[0].definition;
          } else {
            //assume no definition found
            definition = 'definition unavailable';
          }
          resolve(definition);
        });
    });
  }

  const handleYield = () => {
    showUnfoundWords();
    setRoundComplete(true);
  }
  const goToNextLetter = () => {
    setRoundsFoundWords([]);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let newLetter = currentLetter !== 'z' 
      ? alphabet[alphabet.indexOf(currentLetter) + 1]
      : 'a';

    setCurrentLetter(newLetter);
  }

  return (
    <div>
      <h1>Word Game Trainer</h1>
      <div className="subtitle">practice your power bingo stems</div>

      <section id="challengeDetails">
        <label>Current Stem: 
          <select 
            id="stemSelect" 
            onChange={switchStem}
            value={currentStem}
            >
            {stemOptions}
          </select> + ?
        </label>
        <div id="stemProgressWrapper">
          <p className="gameStatus">? = <span id='currentLetter'></span>{currentLetter}</p>
          <p className="gameStatus">Progress: <span id='currentProgress'>{roundsFoundWords.length} of {bingoStems[currentStem][currentLetter].length}</span></p>
        </div>
        <div className="buttonWrapper">
          <button 
            type="button" 
            disabled={roundComplete}
            onClick={handleYield}>
              I Yield
          </button>
          <button 
            type="button" 
            id="nextLetter"
            disabled={!roundComplete}
            onClick={goToNextLetter}>
              Next Letter
          </button>
        </div>
      </section>
      <Board 
        tiles={currentStem + currentLetter} 
        checkWord={checkWord} 
        enteredValues={enteredValues} 
        setEnteredValues={setEnteredValues}/>
      <ul id="foundWords">
        {foundWords.slice(0).reverse().map((word) => (
          <li key={word.id}>
            {word.word}{word.found ? '' : ' (missed)'}: 
            <span className="definition">
              {dictionary[word.word]}
            </span>
          </li>
        ))}
      </ul>
      <p>
      Sounds by <a href="https://zapsplat.com">Zapsplat.com</a>
      </p>
    </div>
  );
}

export default Home;