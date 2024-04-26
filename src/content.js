"use strict";

let redacted = false;
let previousTexts = [];
let originalNodes = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  sendResponse({
    message: `Received message from popup.js with ${JSON.stringify(request)}`,
  });

  if (request.action === "toggleRedact") {
    if (
      request.redactionActive &&
      (!redacted || previousTexts.toString() !== request.texts.toString())
    ) {
      redactText(request.texts, request.color);
      previousTexts = request.texts;
      redacted = true;
    } else if (!request.redactionActive && redacted) {
      restoreText();
      redacted = false;
    }
  }
});

function redactText(searchTexts, hexColor) {
  restoreText(); // Ensure any previous redactions are cleared
  originalNodes = [];

  const regexes = searchTexts.map(
    (text) => new RegExp(escapeRegExp(text), "gi"),
  );

  walkTheDOM(document.body, (node) => {
    if (
      node.nodeType === 3 &&
      node.nodeValue.trim() !== "" &&
      regexes.some((regex) => regex.test(node.nodeValue))
    ) {
      const matches = [
        ...node.nodeValue.matchAll(new RegExp(searchTexts.join("|"), "gi")),
      ];
      if (matches.length > 0) {
        const parent = node.parentNode;
        let lastIndex = 0;
        const newNodeContent = document.createDocumentFragment();

        matches.forEach((match) => {
          newNodeContent.appendChild(
            document.createTextNode(
              node.nodeValue.slice(lastIndex, match.index),
            ),
          );
          const highlighted = document.createElement("span");
          highlighted.style.backgroundColor = hexColor;
          highlighted.style.color = hexColor; // Makes the text invisible
          highlighted.style.display = "inline"; // Ensure it's an inline element
          highlighted.style.padding = 0; // Remove padding to avoid layout shifts
          highlighted.textContent = match[0];
          newNodeContent.appendChild(highlighted);
          lastIndex = match.index + match[0].length;
        });

        if (lastIndex < node.nodeValue.length) {
          newNodeContent.appendChild(
            document.createTextNode(node.nodeValue.slice(lastIndex)),
          );
        }

        const replacementNode = document.createElement("span");
        replacementNode.appendChild(newNodeContent);
        parent.replaceChild(replacementNode, node);
        originalNodes.push({ original: node, new: replacementNode });
      }
    }
  });
}

function restoreText() {
  originalNodes.forEach(({ original, new: newNode }) => {
    const parent = newNode.parentNode;
    if (parent) {
      // Ensure parent exists
      parent.replaceChild(original, newNode);
    }
  });
  originalNodes = [];
}

function walkTheDOM(node, func) {
  if (!node) return; // Null check
  if (
    node.nodeType === 1 &&
    (node.tagName === "STYLE" || node.tagName === "SCRIPT")
  ) {
    return; // Skip style and script tags
  }

  func(node);

  // Check if the node is a shadow root
  if (node.shadowRoot) {
    // Recursively walk through the shadow root's content
    node.shadowRoot.childNodes.forEach((child) => {
      walkTheDOM(child, func);
    });
  }

  // Recursively traverse child nodes
  node = node.firstChild;
  while (node) {
    walkTheDOM(node, func);
    node = node.nextSibling;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters for RegExp
}
