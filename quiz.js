/**
 * ============================================
 * QUIZ CLASS
 * ============================================
 * Manages the entire quiz game state.
 */

export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  // Fetch questions from Open Trivia DB
  async getQuestions() {
    const url = this.buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to connect to the server. Please try again.");
    }

    const data = await response.json();

    if (data.response_code === 0) {
      this.questions = data.results;
      this.numberOfQuestions = this.questions.length;
      return this.questions;
    }

    if (data.response_code === 1) {
      throw new Error(
        "Not enough questions for these options. Try fewer questions or another category."
      );
    }
    if (data.response_code === 5) {
      throw new Error(
        "Too many requests. Please wait a few seconds and try again."
      );
    }
    throw new Error("Failed to load questions. Please try again.");
  }

  buildApiUrl() {
    const params = new URLSearchParams();
    params.set("amount", this.numberOfQuestions);
    if (this.category) params.set("category", this.category);
    if (this.difficulty) params.set("difficulty", this.difficulty);
    return `https://opentdb.com/api.php?${params.toString()}`;
  }

  incrementScore() {
    this.score += 1;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  // Move to the next question. Returns true if there is one, false if finished.
  nextQuestion() {
    this.currentQuestionIndex += 1;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    if (!this.numberOfQuestions) return 0;
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  saveHighScore() {
    const scores = this.getHighScores();
    scores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toISOString(),
    });
    scores.sort((a, b) => b.percentage - a.percentage);
    const top10 = scores.slice(0, 10);
    try {
      localStorage.setItem("quizHighScores", JSON.stringify(top10));
    } catch (e) {
      console.error("Could not save high score:", e);
    }
  }

  getHighScores() {
    try {
      const saved = JSON.parse(localStorage.getItem("quizHighScores"));
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  }

  isHighScore() {
    const scores = this.getHighScores();
    if (scores.length < 10) return true;
    const lowest = scores[scores.length - 1].percentage;
    return this.getScorePercentage() > lowest;
  }

  // Build the results screen HTML
  endQuiz() {
    const percentage = this.getScorePercentage();
    const isNewRecord = this.isHighScore();
    if (isNewRecord) this.saveHighScore(); // save BEFORE reading for display
    const highScores = this.getHighScores(); // read AFTER saving

    const medals = ["gold", "silver", "bronze"];
    const leaderboardHtml = highScores
      .map(
        (s, i) => `
          <li class="leaderboard-item ${medals[i] || ""}">
            <span class="leaderboard-rank">#${i + 1}</span>
            <span class="leaderboard-name">${escapeHtml(s.name)}</span>
            <span class="leaderboard-score">${s.percentage}%</span>
          </li>`
      )
      .join("");

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>

        ${
          isNewRecord
            ? `<div class="new-record-badge">
                <i class="fa-solid fa-star"></i> New High Score!
              </div>`
            : ""
        }

        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">${leaderboardHtml}</ul>
        </div>

        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}

// Escape text before putting it inside innerHTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
