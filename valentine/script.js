function flipCoin() {
  const coin = document.getElementById("coin");
  const resultText = document.getElementById("resultText");

  coin.classList.remove("flip");
  resultText.classList.remove("show");
  resultText.innerText = "";

  const result = Math.random() < 0.5 ? "head" : "tail";

  // Force the final face so the result matches the redirect page.
  const finalRotation = result === "head" ? 1800 : 1980;
  coin.style.transform = `rotateY(${finalRotation}deg)`;

  setTimeout(() => {
    coin.classList.add("flip");
  }, 50);

  setTimeout(() => {
    if (result === "head") {
      resultText.innerText = "Congrats, I am yours.";
    } else {
      resultText.innerText = "Congrats, you are mine.";
    }
    resultText.classList.add("show");
  }, 1800);

  setTimeout(() => {
    window.location.href = `result.html?result=${result}`;
  }, 3800);
}
