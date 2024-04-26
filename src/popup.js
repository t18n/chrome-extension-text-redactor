"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const addButton = document.getElementById("addInput");
  const toggleRedactButton = document.getElementById("toggleRedact");
  const textInputs = document.getElementById("textInputs");
  const colorPicker = document.getElementById("colorPicker");
  const redactionStatus = document.getElementById("redactionStatus");

  let redactionActive = false;

  function updateRedactionStatus() {
    redactionStatus.textContent = `Redaction is ${redactionActive ? "ON" : "OFF"}`;
    redactionStatus.style.color = redactionActive ? "green" : "red";
  }

  function addInput(value = "") {
    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter text to redact";
    input.value = value;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.onclick = function () {
      li.remove();
    };

    li.appendChild(input);
    li.appendChild(removeButton);
    textInputs.appendChild(li);
  }

  addButton.onclick = function () {
    addInput();
  };

  toggleRedactButton.onclick = function () {
    redactionActive = !redactionActive;
    updateRedactionStatus();

    const texts = Array.from(
      textInputs.querySelectorAll('input[type="text"]'),
    ).map((input) => input.value);

    const color = colorPicker.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs
        .sendMessage(tabs[0].id, {
          action: "toggleRedact",
          texts: texts,
          color: color,
          redactionActive: redactionActive,
        })
        .then((response) => {
          console.log("Message from the content script:", response);
        })
        .catch(onError);
    });
    saveSettings(texts, color, redactionActive);
  };

  function saveSettings(texts, color, active) {
    chrome.storage.local.set({ texts: texts, color: color, active: active });
    updateRedactionStatus();
  }

  function loadSettings() {
    chrome.storage.local.get(["texts", "color", "active"], function (result) {
      console.log("Loaded settings from local storage:", result);

      if (result.color) {
        colorPicker.value = result.color;
      }
      if (result.texts && result.texts.length > 0) {
        textInputs.innerHTML = "";
        result.texts.forEach((text) => {
          addInput(text);
        });
      } else {
        addInput();
      }
      if (result.active !== undefined) {
        redactionActive = result.active;
        updateRedactionStatus();
      }
    });
  }

  loadSettings();
});

function onError(error) {
  console.error(`Error: ${error}`);
}
