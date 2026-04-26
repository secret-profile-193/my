const dropdown = document.getElementById("resolutionDropdown");
const dropdownRoot = document.getElementById("moonlightDropdown");
const dropdownTrigger = document.getElementById("dropdownTrigger");
const dropdownMenu = document.getElementById("dropdownMenu");
const dropdownValue = document.getElementById("dropdownValue");
const dropdownOptions = Array.from(document.querySelectorAll(".dropdown-option"));
const displayArea = document.getElementById("displayArea");
const musicToggle = document.getElementById("musicToggle");
const musicToggleLabel = document.getElementById("musicToggleLabel");

const stageOrder = ["", "120p", "420p", "720p", "1080p"];
const stageVolumes = {
    "": 0,
    "120p": 0.25,
    "420p": 0.50,
    "720p": 0.75,
    "1080p": 0.99,
};

const defaultMarkup = `
  <div class="empty-state">
    <span class="empty-badge">moonlight only</span>
    <p>Pick a phase and let the night get a little more honest.</p>
  </div>
`;

const images = {
    "120p": "./moon1.webp",
    "420p": "./moon2.webp",
    "720p": "./moon3.webp",
};

const backgroundAudio = new Audio("./music.mp3");
backgroundAudio.loop = true;
backgroundAudio.preload = "auto";
backgroundAudio.volume = 0;

let highestUnlockedIndex = 0;
let loadingRunId = 0;
let loadingFrameId = 0;
let loadingRevealTimeoutId = 0;
let deniedHintTimeoutId = 0;
let loadingMessageIntervalId = 0;
let audioFadeFrameId = 0;
let hasUserInteracted = false;
let isMuted = false;

const easeInOutSine = (progress) => 0.5 - (Math.cos(Math.PI * progress) / 2);

const getStageIndex = (value) => {
    const index = stageOrder.indexOf(value);
    return index === -1 ? 0 : index;
};

const clearFinalStageLoading = () => {
    loadingRunId += 1;

    if (loadingFrameId) {
        cancelAnimationFrame(loadingFrameId);
        loadingFrameId = 0;
    }

    if (loadingRevealTimeoutId) {
        clearTimeout(loadingRevealTimeoutId);
        loadingRevealTimeoutId = 0;
    }

    if (loadingMessageIntervalId) {
        clearInterval(loadingMessageIntervalId);
        loadingMessageIntervalId = 0;
    }

    displayArea.classList.remove("is-loading");
};

const renderFinalMessage = (runId) => {
    if (runId !== loadingRunId) {
        return;
    }

    displayArea.classList.remove("is-loading");

    const text = document.createElement("div");
    text.classList.add("text-message");
    text.innerHTML = `
      <strong>You are my Moon &#10084;</strong>
      <span>Soft, bright, and impossible not to look at for too long.</span>
    `;

    displayArea.replaceChildren(text);
};

const renderFinalStageLoading = () => {
    const runId = loadingRunId;

    const loaderMessages = [
"searching for the right words... 🌙",
"this one took a while to admit... 🫣",
"gathering every little feeling... 🥺",
"almost ready to be honest... 💗",
"you sure you want the whole truth? 😊",
"okay. here it comes. 🌕",
    ];

    displayArea.classList.add("is-loading");
    displayArea.innerHTML = `
      <div class="final-loader" role="status" aria-live="polite">
        <p class="final-loader-caption">${loaderMessages[0]}</p>
        <div class="final-loader-track" aria-hidden="true">
          <div class="final-loader-bar"></div>
        </div>
        <div class="final-loader-meta">
          <span>loading moonlight</span>
          <span class="final-loader-percent">0%</span>
        </div>
      </div>
    `;

    const loader = displayArea.querySelector(".final-loader");
    const bar = displayArea.querySelector(".final-loader-bar");
    const percent = displayArea.querySelector(".final-loader-percent");
    const caption = displayArea.querySelector(".final-loader-caption");
    const duration = 30000;
    let startedAt = 0;
    let messageIndex = 0;

    const cycleInterval = Math.floor(duration / loaderMessages.length);

    loadingMessageIntervalId = setInterval(() => {
        if (runId !== loadingRunId) {
            clearInterval(loadingMessageIntervalId);
            loadingMessageIntervalId = 0;
            return;
        }
        messageIndex = (messageIndex + 1) % loaderMessages.length;
        caption.style.opacity = "0";
        setTimeout(() => {
            if (runId !== loadingRunId) return;
            caption.textContent = loaderMessages[messageIndex];
            caption.style.opacity = "1";
        }, 400);
    }, cycleInterval);

    const step = (timestamp) => {
        if (runId !== loadingRunId) {
            return;
        }

        if (!startedAt) {
            startedAt = timestamp;
        }

        const progress = Math.min((timestamp - startedAt) / duration, 1);
        const easedProgress = easeInOutSine(progress);
        const percentage = Math.round(easedProgress * 100);

        bar.style.transform = `scaleX(${easedProgress})`;
        percent.textContent = `${percentage}%`;

        if (progress < 1) {
            loadingFrameId = requestAnimationFrame(step);
            return;
        }

        loader.classList.add("is-complete");
        loadingRevealTimeoutId = window.setTimeout(() => {
            renderFinalMessage(runId);
        }, 320);
    };

    loadingFrameId = requestAnimationFrame(step);
};

const renderDisplay = (value) => {
    clearFinalStageLoading();
    displayArea.innerHTML = "";

    if (images[value]) {
        const img = document.createElement("img");
        img.src = images[value];
        img.alt = "A moon for each phase of the surprise";
        displayArea.appendChild(img);
        return;
    }

    if (value === "1080p") {
        renderFinalStageLoading();
        return;
    }

    displayArea.innerHTML = defaultMarkup;
};

const syncDropdownUi = (value) => {
    const selectedOption = dropdownOptions.find((option) => option.dataset.value === value) || dropdownOptions[0];

    dropdownValue.textContent = selectedOption.querySelector(".option-text").textContent.trim();

    dropdownOptions.forEach((option) => {
        const isSelected = option === selectedOption;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-selected", String(isSelected));
        option.tabIndex = dropdownRoot.classList.contains("is-open") && isSelected ? 0 : -1;
    });
};

const openDropdown = (focusSelected = false) => {
    dropdownRoot.classList.add("is-open");
    dropdownTrigger.setAttribute("aria-expanded", "true");
    dropdownMenu.setAttribute("aria-hidden", "false");
    syncDropdownUi(dropdown.value);

    if (focusSelected) {
        const selectedOption = dropdownOptions.find((option) => option.dataset.value === dropdown.value) || dropdownOptions[0];
        selectedOption.focus();
    }
};

const closeDropdown = () => {
    dropdownRoot.classList.remove("is-open");
    dropdownTrigger.setAttribute("aria-expanded", "false");
    dropdownMenu.setAttribute("aria-hidden", "true");
    dropdownOptions.forEach((option) => {
        option.tabIndex = -1;
    });
};

const focusOptionByOffset = (currentIndex, offset) => {
    const totalOptions = dropdownOptions.length;
    const nextIndex = (currentIndex + offset + totalOptions) % totalOptions;
    dropdownOptions[nextIndex].focus();
};

const setMoonlight = (value) => {
    dropdown.value = value;
    dropdown.dispatchEvent(new Event("change"));
};

const showLockedStageHint = () => {
    dropdownRoot.classList.remove("is-denied");
    void dropdownRoot.offsetWidth;
    dropdownRoot.classList.add("is-denied");

    if (deniedHintTimeoutId) {
        clearTimeout(deniedHintTimeoutId);
    }

    deniedHintTimeoutId = window.setTimeout(() => {
        dropdownRoot.classList.remove("is-denied");
    }, 700);
};

const ensureAudioPlayback = () => {
    if (!hasUserInteracted || isMuted) {
        return;
    }

    if (backgroundAudio.paused) {
        backgroundAudio.play().catch(() => {
        });
    }
};

const fadeAudioTo = (targetVolume) => {
    const clampedTarget = Math.max(0, Math.min(1, targetVolume));

    if (audioFadeFrameId) {
        cancelAnimationFrame(audioFadeFrameId);
        audioFadeFrameId = 0;
    }

    const startVolume = backgroundAudio.volume;
    const delta = clampedTarget - startVolume;

    if (Math.abs(delta) < 0.005) {
        backgroundAudio.volume = clampedTarget;
        if (clampedTarget === 0) {
            backgroundAudio.pause();
        }
        return;
    }

    const duration = 1200;
    const startedAt = performance.now();

    const step = (timestamp) => {
        const progress = Math.min((timestamp - startedAt) / duration, 1);
        const easedProgress = easeInOutSine(progress);

        backgroundAudio.volume = Math.max(0, Math.min(1, startVolume + (delta * easedProgress)));

        if (progress < 1) {
            audioFadeFrameId = requestAnimationFrame(step);
            return;
        }

        backgroundAudio.volume = clampedTarget;

        if (clampedTarget === 0) {
            backgroundAudio.pause();
        }
    };

    audioFadeFrameId = requestAnimationFrame(step);
};

const syncMusicForStage = (value) => {
    const stageVolume = stageVolumes[value] ?? 0;
    const targetVolume = hasUserInteracted && !isMuted ? stageVolume : 0;

    if (targetVolume > 0) {
        ensureAudioPlayback();
    }

    fadeAudioTo(targetVolume);
};

const updateMusicToggleUi = () => {
    musicToggle.classList.toggle("is-muted", isMuted);
    musicToggle.setAttribute("aria-pressed", String(isMuted));
    musicToggle.setAttribute("aria-label", isMuted ? "Unmute background music" : "Mute background music");
    musicToggleLabel.textContent = isMuted ? "Unmute" : "Mute";
};

const handleUserActivation = () => {
    if (hasUserInteracted) {
        return;
    }

    hasUserInteracted = true;
    syncMusicForStage(dropdown.value);
};

dropdown.addEventListener("change", () => {
    const requestedValue = dropdown.value;
    const requestedIndex = getStageIndex(requestedValue);
    const highestReachableIndex = Math.min(highestUnlockedIndex + 1, stageOrder.length - 1);

    if (requestedIndex > highestReachableIndex) {
        dropdown.value = stageOrder[0];
        syncDropdownUi(dropdown.value);
        renderDisplay(dropdown.value);
        syncMusicForStage(dropdown.value);
        showLockedStageHint();
        return;
    }

    highestUnlockedIndex = Math.max(highestUnlockedIndex, requestedIndex);
    syncDropdownUi(requestedValue);
    renderDisplay(requestedValue);
    syncMusicForStage(requestedValue);
});

dropdownTrigger.addEventListener("click", () => {
    if (dropdownRoot.classList.contains("is-open")) {
        closeDropdown();
        return;
    }

    openDropdown();
});

dropdownTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDropdown(true);
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        openDropdown(true);
    }
});

dropdownMenu.addEventListener("keydown", (event) => {
    const currentIndex = dropdownOptions.indexOf(document.activeElement);

    if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
        dropdownTrigger.focus();
        return;
    }

    if (event.key === "Tab") {
        closeDropdown();
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();
        focusOptionByOffset(currentIndex, 1);
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        focusOptionByOffset(currentIndex, -1);
        return;
    }

    if (event.key === "Home") {
        event.preventDefault();
        dropdownOptions[0].focus();
        return;
    }

    if (event.key === "End") {
        event.preventDefault();
        dropdownOptions[dropdownOptions.length - 1].focus();
        return;
    }

    if ((event.key === "Enter" || event.key === " ") && document.activeElement.classList.contains("dropdown-option")) {
        event.preventDefault();
        document.activeElement.click();
    }
});

dropdownOptions.forEach((option) => {
    option.addEventListener("click", () => {
        setMoonlight(option.dataset.value);
        closeDropdown();
        dropdownTrigger.focus();
    });
});

musicToggle.addEventListener("click", () => {
    hasUserInteracted = true;
    isMuted = !isMuted;
    updateMusicToggleUi();
    syncMusicForStage(dropdown.value);
});

document.addEventListener("click", (event) => {
    if (!dropdownRoot.contains(event.target)) {
        closeDropdown();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeDropdown();
    }
});

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, handleUserActivation, {
        once: true,
        passive: eventName !== "keydown",
    });
});

updateMusicToggleUi();
syncDropdownUi(dropdown.value);
renderDisplay(dropdown.value);
