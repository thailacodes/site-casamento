const content = document.querySelector(".content");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

window.setTimeout(
  () => content.classList.add("is-visible"),
  reduceMotion.matches ? 0 : 2000,
);

const weddingDate = new Date("2027-09-25T00:00:00-03:00").getTime();
const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const remaining = weddingDate - Date.now();

  if (remaining <= 0) {
    Object.values(countdownFields).forEach((field) => {
      field.textContent = "00";
    });
    return;
  }

  const seconds = Math.floor(remaining / 1000);
  countdownFields.days.textContent = String(Math.floor(seconds / 86400));
  countdownFields.hours.textContent = String(
    Math.floor((seconds % 86400) / 3600).toString().padStart(2, "0"),
  );
  countdownFields.minutes.textContent = String(
    Math.floor((seconds % 3600) / 60).toString().padStart(2, "0"),
  );
  countdownFields.seconds.textContent = String(seconds % 60).padStart(2, "0");
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const dialog = document.querySelector("#rsvp-dialog");
const form = document.querySelector("#rsvp-form");
const formView = document.querySelector("#rsvp-form-view");
const successView = document.querySelector("#rsvp-success");
const guestName = document.querySelector("#guest-name");

document.querySelector("#open-rsvp").addEventListener("click", () => {
  dialog.showModal();
  guestName.focus();
});

function closeDialog() {
  dialog.close();
}

document.querySelector("#close-rsvp").addEventListener("click", closeDialog);
document.querySelector("#finish-rsvp").addEventListener("click", closeDialog);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = guestName.value.trim();

  if (!name) {
    guestName.focus();
    return;
  }

  document.querySelector("#success-message").textContent =
    `${name}, sua presença está confirmada. Será uma alegria celebrar com você!`;
  formView.hidden = true;
  successView.hidden = false;
});

dialog.addEventListener("close", () => {
  form.reset();
  formView.hidden = false;
  successView.hidden = true;
});
