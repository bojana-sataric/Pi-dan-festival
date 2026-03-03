(function () {
  'use strict';


  var PI_DECIMAL = '14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';

  var MINUTES = 2;
  var TOTAL_SECONDS = MINUTES * 60;

  var startScreen = document.getElementById('start-screen');
  var playScreen = document.getElementById('play-screen');
  var endScreen = document.getElementById('end-screen');
  var scoreEl = document.getElementById('score');
  var timerEl = document.getElementById('timer');
  var currentPiEl = document.getElementById('current-pi');
  var optionsContainer = document.getElementById('options');
  var optionButtons = document.querySelectorAll('.option');
  var finalScoreEl = document.getElementById('final-score');
  var leaderboardEl = document.getElementById('leaderboard');
  var endMessageEl = document.getElementById('end-message');
  var playerNameInput = document.getElementById('player-name');
  var btnStart = document.getElementById('btn-start');
  var btnAgain = document.getElementById('btn-again');

  var state = {
    score: 0,
    index: 0,
    secondsLeft: TOTAL_SECONDS,
    timerId: null,
    playerName: ''
  };

  function showScreen(screen) {
    startScreen.classList.add('hidden');
    playScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    screen.classList.remove('hidden');
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getCurrentDisplay() {
    return '3.' + PI_DECIMAL.substring(0, state.index + 2);
  }

  function getCorrectDigit() {
    return PI_DECIMAL[state.index + 2];
  }

  function shuffle(arr) {
    var i = arr.length;
    while (i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function fillOptions() {
    var correct = getCorrectDigit();
    var digits = '0123456789'.split('');
    var others = digits.filter(function (d) { return d !== correct; });
    var wrong = [];
    while (wrong.length < 3) {
      var r = others[Math.floor(Math.random() * others.length)];
      if (wrong.indexOf(r) === -1) wrong.push(r);
    }
    var choices = shuffle([correct].concat(wrong));

    optionButtons.forEach(function (btn, i) {
      btn.textContent = choices[i];
      btn.dataset.digit = choices[i];
      btn.classList.remove('correct', 'wrong', 'disabled');
      btn.disabled = false;
    });
  }

  function updateUI() {
    scoreEl.textContent = state.score;
    currentPiEl.textContent = getCurrentDisplay();
    fillOptions();
  }

  function tick() {
    state.secondsLeft--;
    timerEl.textContent = formatTime(state.secondsLeft);

    timerEl.parentElement.classList.remove('warning', 'danger');
    if (state.secondsLeft <= 20) timerEl.parentElement.classList.add('danger');
    else if (state.secondsLeft <= 40) timerEl.parentElement.classList.add('warning');

    if (state.secondsLeft <= 0) endGame();
  }

  function startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.secondsLeft = TOTAL_SECONDS;
    timerEl.textContent = formatTime(state.secondsLeft);
    timerEl.parentElement.classList.remove('warning', 'danger');
    state.timerId = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function onAnswer(clickedBtn) {
    var digit = clickedBtn.dataset.digit;
    var correct = getCorrectDigit();

    optionButtons.forEach(function (btn) {
      btn.disabled = true;
      btn.classList.add('disabled');
      if (btn.dataset.digit === correct) btn.classList.add('correct');
      else if (btn === clickedBtn && digit !== correct) btn.classList.add('wrong');
    });

    if (digit === correct) {
      state.score++;
      scoreEl.textContent = state.score;
      state.index++;
      if (state.index + 2 >= PI_DECIMAL.length) state.index = 0;
      setTimeout(function () {
        updateUI();
      }, 400);
    } else {
      setTimeout(function () {
        endGame('wrong');
      }, 800);
    }
  }

  function getLeaderboard() {
    try {
      var raw = localStorage.getItem('piDayLeaderboard');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToLeaderboard(name, score) {
    var list = getLeaderboard();
    var displayName = (name || '').trim() || 'Igrač';
    var nameLower = displayName.toLowerCase();
    var found = list.findIndex(function (e) {
      return (e.name || '').toLowerCase() === nameLower;
    });
    if (found !== -1) {
      if (score > list[found].score) list[found].score = score;
      list[found].date = Date.now();
    } else {
      list.push({ name: displayName, score: score, date: Date.now() });
    }
    list.sort(function (a, b) { return b.score - a.score; });
    list = list.slice(0, 10);
    try {
      localStorage.setItem('piDayLeaderboard', JSON.stringify(list));
    } catch (e) {}
  }

  function renderLeaderboard() {
    var list = getLeaderboard();
    leaderboardEl.innerHTML = '';
    if (list.length === 0) {
      leaderboardEl.innerHTML = '<li class="empty">Još nema rezultata.</li>';
      return;
    }
    list.forEach(function (entry) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="name">' + escapeHtml(entry.name) + '</span><span class="pts">' + entry.score + ' pt</span>';
      leaderboardEl.appendChild(li);
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function startGame() {
    state.score = 0;
    state.index = 0;
    state.playerName = (playerNameInput.value || '').trim();
    showScreen(playScreen);
    updateUI();
    startTimer();
  }

  function endGame(reason) {
    stopTimer();
    if (endMessageEl) {
      endMessageEl.textContent = reason === 'wrong'
        ? 'Igra je završena. Probajte ponovo!'
        : 'Vreme je isteklo!';
    }
    saveToLeaderboard(state.playerName, state.score);
    finalScoreEl.textContent = state.score;
    renderLeaderboard();
    showScreen(endScreen);
  }

  btnStart.addEventListener('click', function () {
    startGame();
  });

  playerNameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') startGame();
  });

  btnAgain.addEventListener('click', function () {
    showScreen(startScreen);
    playerNameInput.value = state.playerName;
    playerNameInput.focus();
  });

  optionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      onAnswer(btn);
    });
  });

 
  showScreen(startScreen);
  playerNameInput.focus();
})();
