// This content script runs on the OpenAI API keys page to capture the API key
document.addEventListener('copy', function(e) {
  const copiedText = e.target.value || window.getSelection().toString();
  if (copiedText && copiedText.length > 30) { // Assuming API keys are long
    chrome.runtime.sendMessage({ action: 'setOpenAIKey', key: copiedText });
  }
});