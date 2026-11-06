/**
 * ============================================
 * MAIN ENTRY POINT (index.js)
 * ============================================
 */

import Quiz from "./quiz.js";
import Question from "./question.js";

// ---------- DOM elements ----------
const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.querySelector(".questions-container");

// ---------- State ----------
let currentQuiz = null;

// ---------- Loading ----------
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) overlay.remove();
}

// ---------- Error ----------
function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message"></p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;
  questionsContainer.querySelector(".error-message").textContent = message;
  questionsContainer
    .querySelector(".retry-btn")
    .addEventListener("click", resetToStart);
}

// ---------- Validation ----------
function validateForm() {
  const raw = questionsNumber.value.trim();
  if (raw === "") {
    return { isValid: false, error: "Please enter the number of questions." };
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return { isValid: false, error: "Minimum is 1 question." };
  }
  if (value > 50) {
    return { isValid: false, error: "Maximum is 50 questions." };
  }
  return { isValid: true, error: null };
}

function showFormError(message) {
  const old = quizOptionsForm.querySelector(".form-error");
  if (old) old.remove();

  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span></span>`;
  errorDiv.querySelector("span").textContent = message;
  startQuizBtn.insertAdjacentElement("beforebegin", errorDiv);

  setTimeout(() => {
    errorDiv.style.transition = "opacity 0.4s ease";
    errorDiv.style.opacity = "0";
    setTimeout(() => errorDiv.remove(), 400);
  }, 3000);
}

// ---------- Reset ----------
function resetToStart() {
  questionsContainer.innerHTML = "";
  playerNameInput.value = "";
  questionsNumber.value = 10;

  // Reset the custom selects back to their defaults
  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  resetSelect(categorySelect, categoryInput, "");
  resetSelect(difficultySelect, difficultyOptions, "easy");

  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

function resetSelect(select, hiddenInput, value) {
  const option = select.querySelector(
    `.custom-select-option[data-value="${value}"]`
  );
  select.dataset.value = value;
  hiddenInput.value = value;
  if (!option) return;
  select.querySelector(".custom-select-text").textContent =
    option.textContent.trim();
  select.querySelector(".custom-select-icon").innerHTML =
    option.querySelector("i").outerHTML;
  select
    .querySelectorAll(".custom-select-option")
    .forEach((o) => o.classList.remove("selected"));
  option.classList.add("selected");
}

// ---------- Start ----------
async function startQuiz() {
  const { isValid, error } = validateForm();
  if (!isValid) {
    showFormError(error);
    return;
  }

  const playerName = playerNameInput.value.trim() || "Player";
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    if (currentQuiz.questions.length > 0) {
      const question = new Question(currentQuiz, questionsContainer, resetToStart);
      question.displayQuestion();
    } else {
      showError("No questions found. Please try different options.");
    }
  } catch (err) {
    hideLoading();
    showError(err.message || "Failed to load questions. Please try again.");
  }
}

// ---------- Events ----------
startQuizBtn.addEventListener("click", startQuiz);
questionsNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startQuiz();
  }
});
