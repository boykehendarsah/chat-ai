const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const imageInput = document.getElementById('image-input');
const chatBox = document.getElementById('chat-box');
const fileBtn = document.getElementById('file-btn');
const filePreview = document.getElementById('file-preview');
const fileNameSpan = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file-btn');

// State variables to track conversation history and Gemini interaction ID
const conversation = [];
let interactionId = null;

if (imageInput) {
  imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];
    if (file) {
      fileNameSpan.textContent = file.name;
      filePreview.style.display = 'inline-flex';
      fileBtn.classList.add('has-file');
    } else {
      clearFileInput();
    }
  });
}

if (removeFileBtn) {
  removeFileBtn.addEventListener('click', function () {
    clearFileInput();
  });
}

function clearFileInput() {
  if (imageInput) imageInput.value = '';
  if (filePreview) filePreview.style.display = 'none';
  if (fileBtn) fileBtn.classList.remove('has-file');
}

chatForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const text = userInput.value.trim();
  const file = imageInput ? imageInput.files[0] : null;
  if (!text && !file) return;

  // 1. Add user message to UI
  if (text) {
    appendMessage('user', text);
    // 2. Add user message to conversation array
    conversation.push({ type: 'text', text: text });
  } else if (file) {
    appendMessage('user', `[Attached image: ${file.name}]`);
  }

  // Clear input and disable controls while fetching
  userInput.value = '';
  clearFileInput();
  setLoadingState(true);

  // 3. Add temporary "Thinking..." bot message to UI
  const thinkingMessageElement = createMessageElement('bot', 'Thinking...');
  chatBox.appendChild(thinkingMessageElement);
  scrollToBottom();

  try {
    let response;
    if (file) {
      const formData = new FormData();
      formData.append('conversation', JSON.stringify(conversation));
      if (interactionId) {
        formData.append('interactionId', interactionId);
      }
      formData.append('image', file);

      // 4. Send POST request to /chat endpoint as FormData
      response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
    } else {
      // Construct JSON payload
      const payload = {
        conversation: conversation
      };
      if (interactionId) {
        payload.interactionId = interactionId;
      }

      // Send POST request to /chat endpoint as JSON
      response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    const data = await response.json();

    if (response.ok && data && data.result) {
      // 5. Replace "Thinking..." message with AI response
      thinkingMessageElement.textContent = data.result;

      // Store interactionId if provided by backend
      if (data.interactionId) {
        interactionId = data.interactionId;
      }

      // Record model response in conversation history
      conversation.push({ type: 'text', text: data.result });
    } else {
      // Handle backend HTTP errors or missing result
      const errorMessage = (data && data.error) ? data.error : 'Sorry, no response received.';
      thinkingMessageElement.textContent = errorMessage;
    }
  } catch (error) {
    // 6. Handle network / connection errors
    console.error('Fetch error:', error);
    thinkingMessageElement.textContent = 'Failed to get response from server.';
  } finally {
    setLoadingState(false);
    scrollToBottom();
  }
});

/**
 * Appends a message element to the chat box
 */
function appendMessage(sender, text) {
  const msgElement = createMessageElement(sender, text);
  chatBox.appendChild(msgElement);
  scrollToBottom();
}

/**
 * Creates and returns a message DOM element
 */
function createMessageElement(sender, text) {
  const msgElement = document.createElement('div');
  msgElement.classList.add('message', sender);
  msgElement.textContent = text;
  return msgElement;
}

/**
 * Keeps the chat box scrolled to the bottom
 */
function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Enables/disables form inputs during API requests
 */
function setLoadingState(isLoading) {
  userInput.disabled = isLoading;
  const submitBtn = chatForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }
  if (!isLoading) {
    userInput.focus();
  }
}
