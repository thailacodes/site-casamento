const content = document.querySelector(".content");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const RSVP_WEB_APP_URL = "";

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
const invitationMessage = document.querySelector("#rsvp-message");

document.querySelector("#open-rsvp").addEventListener("click", () => {
  const inviteToken = new URLSearchParams(window.location.search).get("convite");

  if (RSVP_WEB_APP_URL && inviteToken) {
    const rsvpUrl = new URL(RSVP_WEB_APP_URL);
    rsvpUrl.searchParams.set("token", inviteToken);
    window.location.assign(rsvpUrl);
    return;
  }

  invitationMessage.textContent = RSVP_WEB_APP_URL
    ? "Para confirmar, abra o link individual que recebeu junto com o convite."
    : "A confirmação online está sendo preparada. Você receberá seu link individual para responder.";
  dialog.showModal();
});

function closeDialog() {
  dialog.close();
}

document.querySelector("#close-rsvp").addEventListener("click", closeDialog);
document.querySelector("#finish-rsvp").addEventListener("click", closeDialog);
