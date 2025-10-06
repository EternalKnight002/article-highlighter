// content.js

// --- Globals & Initial Setup ---

let highlights = [];
const pageKey = `highlights-${getCanonicalUrl()}`;

// --- DOM Elements ---
const highlighterEl = createHighlighterElement();
const noteModalEl = createNoteModalElement();

// --- Initialization ---

// Inject custom styles for our UI
injectStyles();

// Load existing highlights from localStorage when the page loads
loadHighlights();

// --- Event Listeners ---

// Listen for mouse up events to detect text selection
document.body.addEventListener('mouseup', handleTextSelection);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(handleMessages);


// --- Core Functions ---

/**
 * Loads highlights from localStorage and applies them to the page.
 */
function loadHighlights() {
    const savedHighlights = localStorage.getItem(pageKey);
    if (savedHighlights) {
        highlights = JSON.parse(savedHighlights);
        reapplyHighlights();
    }
}

/**
 * Saves the current highlights array to localStorage.
 */
function saveHighlights() {
    localStorage.setItem(pageKey, JSON.stringify(highlights));
}

/**
 * Handles the text selection event to show the highlighter button.
 * @param {MouseEvent} event - The mouseup event.
 */
function handleTextSelection(event) {
    // Don't show the highlighter if we're clicking on an existing one or the modal
    if (event.target.closest('.article-highlight-mark') || event.target.closest('#article-highlighter-note-modal')) {
        hideHighlighter();
        return;
    }

    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        positionHighlighter(rect);
    } else {
        hideHighlighter();
    }
}

/**
 * Creates and saves a new highlight from the current selection.
 */
function createHighlight() {
    const selection = window.getSelection();
    if (selection.toString().trim().length === 0) return;

    const range = selection.getRangeAt(0);
    const serializedRange = serializeRange(range);
    
    if (!serializedRange) {
        alert("Highlighting failed. The selected content might be in a complex or protected element.");
        return;
    }

    const newHighlight = {
        id: `highlight-${Date.now()}`,
        text: selection.toString(),
        note: '',
        createdAt: new Date().toISOString(),
        range: serializedRange
    };
    
    highlights.push(newHighlight);
    wrapRangeWithMark(range, newHighlight.id);
    saveHighlights();
    
    // Clear selection and hide the highlighter button
    selection.removeAllRanges();
    hideHighlighter();

    // Optionally open note modal immediately
    openNoteModal(newHighlight.id);
}

/**
 * Iterates through saved highlights and re-applies them to the DOM.
 */
function reapplyHighlights() {
    highlights.forEach(highlight => {
        try {
            const range = deserializeRange(highlight.range);
            if (range) {
                // Verify that the text content still roughly matches to avoid highlighting wrong text
                const currentText = range.toString().trim();
                const savedText = highlight.text.trim();
                if (currentText.includes(savedText) || savedText.includes(currentText)) {
                    wrapRangeWithMark(range, highlight.id);
                } else {
                    console.warn("Article Highlighter: Mismatch found for highlight, skipping.", { savedText, currentText, range: highlight.range });
                }
            }
        } catch (error) {
            console.error("Article Highlighter: Failed to reapply highlight.", { highlight, error });
        }
    });
}

/**
 * Wraps a Range object with a <mark> element.
 * @param {Range} range - The range to wrap.
 * @param {string} highlightId - The unique ID of the highlight.
 */
function wrapRangeWithMark(range, highlightId) {
    const mark = document.createElement('mark');
    mark.className = 'article-highlight-mark';
    mark.dataset.highlightId = highlightId;
    mark.addEventListener('click', () => openNoteModal(highlightId));

    try {
        // This is the standard way, but can fail if the range spans across
        // certain HTML element boundaries.
        range.surroundContents(mark);
    } catch (e) {
        // Fallback for complex ranges: extract, wrap, and insert.
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
        console.warn("Article Highlighter: Used fallback for wrapping range.", e);
    }
}

/**
 * Handles incoming messages from the popup or other extension parts.
 * @param {object} request - The message object.
 * @param {object} sender - The sender information.
 * @param {function} sendResponse - The function to call to send a response.
 */
function handleMessages(request, sender, sendResponse) {
    switch (request.action) {
        case 'getHighlights':
            sendResponse({ highlights });
            break;
        case 'deleteHighlight':
            deleteHighlight(request.highlightId);
            sendResponse({ success: true });
            break;
        case 'updateNote':
            updateNote(request.highlightId, request.note);
            sendResponse({ success: true });
            break;
        case 'goToHighlight':
            goToHighlight(request.highlightId);
            break;
        case 'exportToPDF':
            prepareForExport();
            break;
        case 'exportHighlightsOnly':
            exportHighlightsOnly();
            break;
    }
    return true; // Indicates that the response is sent asynchronously
}


// --- UI Functions ---

/**
 * Creates the floating highlighter button element.
 * @returns {HTMLElement} The highlighter button element.
 */
function createHighlighterElement() {
    const el = document.createElement('div');
    el.id = 'article-highlighter-button';
    el.innerHTML = '✨ Highlight';
    el.addEventListener('mousedown', (e) => {
        // Prevent this click from triggering a 'mouseup' that hides the button
        e.preventDefault();
        createHighlight();
    });
    document.body.appendChild(el);
    return el;
}

/**
 * Positions the highlighter button next to the selected text.
 * @param {DOMRect} rect - The bounding rectangle of the selected text.
 */
function positionHighlighter(rect) {
    highlighterEl.style.display = 'block';
    highlighterEl.style.top = `${window.scrollY + rect.top - highlighterEl.offsetHeight - 5}px`;
    highlighterEl.style.left = `${window.scrollX + rect.left + (rect.width - highlighterEl.offsetWidth) / 2}px`;
}

/**
 * Hides the highlighter button.
 */
function hideHighlighter() {
    highlighterEl.style.display = 'none';
}

/**
 * Creates the note-taking modal element.
 * @returns {HTMLElement} The modal element.
 */
function createNoteModalElement() {
    const modal = document.createElement('div');
    modal.id = 'article-highlighter-note-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Highlight Note</h3>
            <textarea placeholder="Add a note..."></textarea>
            <div class="modal-actions">
                <button class="save-btn">Save</button>
                <button class="delete-btn">Delete Highlight</button>
                <button class="cancel-btn">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.save-btn').addEventListener('click', () => saveNote());
    modal.querySelector('.delete-btn').addEventListener('click', () => deleteCurrentHighlight());
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => {
        // Close if clicking on the backdrop
        if (e.target === modal) closeModal();
    });

    return modal;
}

/**
 * Opens the note modal for a specific highlight.
 * @param {string} highlightId - The ID of the highlight.
 */
function openNoteModal(highlightId) {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    noteModalEl.dataset.currentHighlightId = highlightId;
    noteModalEl.querySelector('textarea').value = highlight.note || '';
    noteModalEl.style.display = 'flex';
    noteModalEl.querySelector('textarea').focus();
}

/**
 * Closes the note modal.
 */
function closeModal() {
    noteModalEl.style.display = 'none';
    noteModalEl.dataset.currentHighlightId = '';
}

/**
 * Saves the note from the modal to the corresponding highlight.
 */
function saveNote() {
    const highlightId = noteModalEl.dataset.currentHighlightId;
    const noteText = noteModalEl.querySelector('textarea').value;
    updateNote(highlightId, noteText);
    closeModal();
}

/**
 * Deletes the highlight currently being edited in the modal.
 */
function deleteCurrentHighlight() {
    const highlightId = noteModalEl.dataset.currentHighlightId;
    deleteHighlight(highlightId);
    closeModal();
}


// --- Highlight Management ---

/**
 * Updates the note for a specific highlight.
 * @param {string} highlightId - The ID of the highlight.
 * @param {string} note - The new note text.
 */
function updateNote(highlightId, note) {
    const index = highlights.findIndex(h => h.id === highlightId);
    if (index !== -1) {
        highlights[index].note = note;
        saveHighlights();
    }
}

/**
 * Deletes a highlight from the page and from storage.
 * @param {string} highlightId - The ID of the highlight to delete.
 */
function deleteHighlight(highlightId) {
    // Remove from array
    highlights = highlights.filter(h => h.id !== highlightId);
    saveHighlights();

    // Remove from DOM
    const mark = document.querySelector(`mark[data-highlight-id="${highlightId}"]`);
    if (mark) {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); // Merges adjacent text nodes
    }
}

/**
 * Scrolls the page to a specific highlight.
 * @param {string} highlightId - The ID of the highlight to scroll to.
 */
function goToHighlight(highlightId) {
    const mark = document.querySelector(`mark[data-highlight-id="${highlightId}"]`);
    if (mark) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


// --- Serialization / Deserialization ---

/**
 * Generates an XPath for a given DOM element.
 * @param {Node} element - The element to generate the path for.
 * @returns {string} The XPath string.
 */
function getXPathForElement(element) {
    // We only want to generate paths for element nodes
    if (element.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const paths = [];
    for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
        let index = 0;
        let hasFollowingSibling = false;
        for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeName === element.nodeName) {
                index++;
            }
        }
        for (let sibling = element.nextSibling; sibling && !hasFollowingSibling; sibling = sibling.nextSibling) {
            if (sibling.nodeName === element.nodeName) {
                hasFollowingSibling = true;
            }
        }
        const tagName = element.nodeName.toLowerCase();
        const pathIndex = (index > 0 || hasFollowingSibling) ? `[${index + 1}]` : '';
        paths.splice(0, 0, tagName + pathIndex);
    }
    return paths.length ? '/' + paths.join('/') : null;
}

/**
 * Serializes a Range object into a storable format.
 * @param {Range} range - The range to serialize.
 * @returns {object|null} A serializable object representing the range.
 */
function serializeRange(range) {
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // Get XPath for element nodes, or for the parent of text nodes
    const startXPath = getXPathForElement(startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentElement : startContainer);
    const endXPath = getXPathForElement(endContainer.nodeType === Node.TEXT_NODE ? endContainer.parentElement : endContainer);

    if (!startXPath || !endXPath) return null;

    // For text nodes, we need to know which child it is
    const startChildIndex = (startContainer.nodeType === Node.TEXT_NODE) ?
        Array.from(startContainer.parentNode.childNodes).indexOf(startContainer) : -1;
    const endChildIndex = (endContainer.nodeType === Node.TEXT_NODE) ?
        Array.from(endContainer.parentNode.childNodes).indexOf(endContainer) : -1;

    return {
        startXPath,
        startOffset: range.startOffset,
        startChildIndex,
        endXPath,
        endOffset: range.endOffset,
        endChildIndex,
        contextText: range.toString().substring(0, 50) // For fallback
    };
}

/**
 * Deserializes a range object back into a DOM Range.
 * @param {object} savedRange - The serialized range data.
 * @returns {Range|null} The reconstituted Range object.
 */
function deserializeRange(savedRange) {
    const range = document.createRange();

    const startNodeParent = document.evaluate(savedRange.startXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    const endNodeParent = document.evaluate(savedRange.endXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (!startNodeParent || !endNodeParent) {
        console.warn("Article Highlighter: Couldn't find start or end node for range.", savedRange);
        return null; // Fallback could be implemented here using contextText
    }
    
    // If the original node was a text node, find it by its index
    const startNode = (savedRange.startChildIndex > -1) ? startNodeParent.childNodes[savedRange.startChildIndex] : startNodeParent;
    const endNode = (savedRange.endChildIndex > -1) ? endNodeParent.childNodes[savedRange.endChildIndex] : endNodeParent;

    if (!startNode || !endNode) {
        console.warn("Article Highlighter: Couldn't find child text node for range.", savedRange);
        return null;
    }

    range.setStart(startNode, savedRange.startOffset);
    range.setEnd(endNode, savedRange.endOffset);

    return range;
}


// --- Export & Utility Functions ---

/**
 * Prepares the page for printing by creating a new document with highlights.
 */
function prepareForExport() {
    const originalTitle = document.title;
    const clone = document.cloneNode(true);
    
    // Remove scripts and interactive elements from the clone
    clone.querySelectorAll('script, style, #article-highlighter-button, #article-highlighter-note-modal').forEach(el => el.remove());

    // Create a new window to print from
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<!DOCTYPE html><html><head><title>' + originalTitle + ' (Highlights)</title></head><body>' + clone.documentElement.innerHTML + '</body></html>');
    
    // Add styles for printing
    const style = printWindow.document.createElement('style');
    style.innerHTML = `
        body { font-family: sans-serif; line-height: 1.5; }
        .article-highlight-mark { background-color: #fefcbf !important; color: black !important; }
    `;
    printWindow.document.head.appendChild(style);
    
    printWindow.document.close();
    printWindow.focus();
    // Use a timeout to ensure content is rendered before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}
/**
 * Creates a new document containing only the highlighted text and notes for export.
 */
function exportHighlightsOnly() {
    if (highlights.length === 0) {
        alert("There are no highlights to export.");
        return;
    }

    const pageTitle = document.title;
    const pageUrl = window.location.href;

    // Build the HTML for the new document
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Highlights from ${pageTitle}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 40px; }
                h1 { font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                p { color: #555; }
                a { color: #007aff; text-decoration: none; }
                .highlight-container { margin-bottom: 30px; padding-left: 20px; border-left: 3px solid #f0f0f0; }
                blockquote { font-style: italic; color: #333; margin-left: 0; padding: 10px; background-color: #fefcbf4d; border-radius: 4px; }
                .note { background-color: #eef7ff; padding: 10px; border-radius: 4px; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>Highlights from: ${pageTitle}</h1>
            <p><strong>Source:</strong> <a href="${pageUrl}" target="_blank">${pageUrl}</a></p>
            <hr>
    `;

    highlights.forEach(highlight => {
        html += `
            <div class="highlight-container">
                <blockquote>${highlight.text}</blockquote>
        `;
        if (highlight.note) {
            html += `<p class="note"><strong>Note:</strong> ${highlight.note}</p>`;
        }
        html += `</div>`;
    });

    html += `</body></html>`;

    // Open a new window and print the content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}


/**
 * Gets the canonical URL of the page, falling back to location.href.
 * @returns {string} The URL to use as a key.
 */
function getCanonicalUrl() {
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    return canonicalLink ? canonicalLink.href : window.location.href;
}

/**
 * Injects the necessary CSS for the UI elements into the page.
 */
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #article-highlighter-button {
            position: absolute;
            display: none;
            background-color: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            z-index: 9999999;
            user-select: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .article-highlight-mark {
            background-color: #fefcbf;
            cursor: pointer;
            border-radius: 2px;
        }
        #article-highlighter-note-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000000;
        }
        #article-highlighter-note-modal .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        #article-highlighter-note-modal h3 {
            margin-top: 0;
            color: #333;
        }
        #article-highlighter-note-modal textarea {
            width: 100%;
            height: 100px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            font-size: 14px;
            resize: vertical;
        }
        #article-highlighter-note-modal .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        #article-highlighter-note-modal button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #article-highlighter-note-modal .save-btn {
            background-color: #4CAF50;
            color: white;
        }
        #article-highlighter-note-modal .delete-btn {
            background-color: #f44336;
            color: white;
        }
        #article-highlighter-note-modal .cancel-btn {
            background-color: #ccc;
        }
    `;
    document.head.appendChild(style);
}