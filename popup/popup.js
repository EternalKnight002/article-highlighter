// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    const highlightsList = document.getElementById('highlights-list');
    const noHighlightsMsg = document.getElementById('no-highlights-msg');
    const exportBtn = document.getElementById('export-btn');
    const highlightItemTemplate = document.getElementById('highlight-item-template');
    const exportHighlightsBtn = document.getElementById('export-highlights-btn');
    let activeTabId;

    // Get the active tab and request its highlights
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            activeTabId = tabs[0].id;
            chrome.tabs.sendMessage(activeTabId, { action: 'getHighlights' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    highlightsList.innerHTML = '<p>Could not connect to the page. Try reloading the page and opening the popup again.</p>';
                } else if (response && response.highlights) {
                    renderHighlights(response.highlights);
                }
            });
        }
    });
    
    exportBtn.addEventListener('click', () => {
        if(activeTabId) {
            chrome.tabs.sendMessage(activeTabId, { action: 'exportToPDF' });
        }
    });
     exportHighlightsBtn.addEventListener('click', () => {
        if(activeTabId) {
            chrome.tabs.sendMessage(activeTabId, { action: 'exportHighlightsOnly' });
        }
    });

    /**
     * Renders the list of highlights in the popup.
     * @param {Array<object>} highlights - The highlights to render.
     */
    function renderHighlights(highlights) {
        highlightsList.innerHTML = ''; // Clear existing content

        if (highlights.length === 0) {
            highlightsList.appendChild(noHighlightsMsg);
            noHighlightsMsg.style.display = 'block';
            return;
        }

        noHighlightsMsg.style.display = 'none';

        highlights.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        highlights.forEach(highlight => {
            const item = highlightItemTemplate.content.cloneNode(true);
            const highlightItem = item.querySelector('.highlight-item');
            const highlightText = item.querySelector('.highlight-text');
            const highlightNote = item.querySelector('.highlight-note');

            highlightItem.dataset.highlightId = highlight.id;
            highlightText.textContent = `"${highlight.text}"`;
            
            if (highlight.note) {
                highlightNote.textContent = highlight.note;
                highlightNote.style.display = 'block';
            } else {
                 highlightNote.style.display = 'none';
            }

            // --- Add event listeners for action buttons ---

            item.querySelector('.go-to-btn').addEventListener('click', () => {
                chrome.tabs.sendMessage(activeTabId, { action: 'goToHighlight', highlightId: highlight.id });
                window.close(); // Close popup after action
            });

            item.querySelector('.edit-btn').addEventListener('click', () => {
                const newNote = prompt("Edit your note:", highlight.note || "");
                if (newNote !== null) { // User didn't cancel
                    chrome.tabs.sendMessage(activeTabId, { action: 'updateNote', highlightId: highlight.id, note: newNote }, () => {
                        // Optimistically update UI
                        highlight.note = newNote;
                        if (newNote) {
                            highlightNote.textContent = newNote;
                            highlightNote.style.display = 'block';
                        } else {
                            highlightNote.style.display = 'none';
                        }
                    });
                }
            });

            item.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm("Are you sure you want to delete this highlight?")) {
                    chrome.tabs.sendMessage(activeTabId, { action: 'deleteHighlight', highlightId: highlight.id }, () => {
                        // Optimistically remove from UI
                        highlightItem.remove();
                        if (highlightsList.children.length === 0) {
                            highlightsList.appendChild(noHighlightsMsg);
                            noHighlightsMsg.style.display = 'block';
                        }
                    });
                }
            });

            highlightsList.appendChild(item);
        });
    }
});