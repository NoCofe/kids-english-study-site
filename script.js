document.querySelectorAll("[data-say]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(button.dataset.say || "");
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  });
});
