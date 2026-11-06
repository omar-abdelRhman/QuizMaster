/**
 * ============================================
 * QUESTION CLASS
 * ============================================
 * Displays and handles a single question.
 */

import { playCorrectSound, playWrongSound } from "./sounds.js";

const TIME_PER_QUESTION = 15; // seconds
const WARNING_AT = 5; // seconds left when the timer turns red

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((a) =>
      this.decodeHtml(a)
    );
    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = TIME_PER_QUESTION;
    this.keyHandler = null;
  }

  // Decode HTML entities like &amp; and &quot;
  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  // Escape text before inserting it into innerHTML / attributes
  escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Fisher-Yates shuffle
  shuffleAnswers() {
    const array = [...this.wrongAnswers, this.correctAnswer];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const total = this.quiz.numberOfQuestions;
    const difficulty = this.questionData.difficulty;
    const difficultyIcons = {
      easy: "fa-face-smile",
      medium: "fa-face-meh",
      hard: "fa-skull",
    };

    const answersHtml = this.allAnswers
      .map(
        (answer, i) => `
          <button class="answer-btn" data-answer="${this.escapeHtml(answer)}">
            <span class="answer-key">${i + 1}</span>
            <span class="answer-text">${this.escapeHtml(answer)}</span>
          </button>`
      )
      .join("");

    this.container.innerHTML = `
      <div class="game-card question-card">

        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${total}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.escapeHtml(this.category)}</span>
          </div>
          <div class="stat-badge difficulty ${difficulty}">
            <i class="fa-solid ${difficultyIcons[difficulty] || "fa-face-smile"}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${total}</span>
          </div>
        </div>

        <h2 class="question-text">${this.escapeHtml(this.question)}</h2>

        <div class="answers-grid">${answersHtml}</div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const buttons = this.container.querySelectorAll(".answer-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", () => this.checkAnswer(button));
    });

    // Keyboard support: keys 1-4 (only as many as there are answers)
    this.keyHandler = (e) => {
      if (!["1", "2", "3", "4"].includes(e.key)) return;
      const button = buttons[Number(e.key) - 1];
      if (button) this.checkAnswer(button);
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }

  startTimer() {
    const timerValue = this.container.querySelector(".timer-value");
    const timerBadge = this.container.querySelector(".stat-badge.timer");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerValue.textContent = this.timeRemaining;

      if (this.timeRemaining <= WARNING_AT) {
        timerBadge.classList.add("warning");
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  handleTimeUp() {
    if (this.answered) return;
    this.answered = true;
    this.removeEventListeners();

    this.highlightCorrectAnswer();
    this.container
      .querySelectorAll(".answer-btn")
      .forEach((btn) => btn.classList.add("disabled"));

    const message = document.createElement("div");
    message.className = "time-up-message";
    message.innerHTML = `<i class="fa-solid fa-clock"></i> TIME'S UP!`;
    this.container
      .querySelector(".answers-grid")
      .insertAdjacentElement("beforebegin", message);

    playWrongSound();
    this.animateQuestion();
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selected = choiceElement.getAttribute("data-answer");
    const isCorrect =
      selected.toLowerCase() === this.correctAnswer.toLowerCase();

    if (isCorrect) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      const scoreEl = this.container.querySelector(".score-item-value");
      if (scoreEl) scoreEl.textContent = this.quiz.score;
      playCorrectSound();
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
      playWrongSound();
    }

    this.container.querySelectorAll(".answer-btn").forEach((btn) => {
      if (btn !== choiceElement && !btn.classList.contains("correct-reveal")) {
        btn.classList.add("disabled");
      }
    });

    this.animateQuestion();
  }

  highlightCorrectAnswer() {
    const buttons = this.container.querySelectorAll(".answer-btn");
    buttons.forEach((btn) => {
      if (
        btn.getAttribute("data-answer").toLowerCase() ===
        this.correctAnswer.toLowerCase()
      ) {
        btn.classList.add("correct-reveal");
      }
    });
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      const next = new Question(this.quiz, this.container, this.onQuizEnd);
      next.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();
      const restartBtn = this.container.querySelector(".btn-restart");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => this.onQuizEnd());
      }
    }
  }

  // Wait so the user can see the result, play the exit animation, then move on
  animateQuestion(duration = 500) {
    setTimeout(() => {
      const card = this.container.querySelector(".question-card");
      if (card) card.classList.add("exit");
      setTimeout(() => this.getNextQuestion(), duration);
    }, 1500);
  }
}
