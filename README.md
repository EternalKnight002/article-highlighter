# Article Highlighter 📝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with: JS, HTML, CSS](https://img.shields.io/badge/Made%20with-JS%2C%20HTML%2C%20CSS-blue.svg)](https://developer.mozilla.org/)
[![Chrome Extension: Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/)

A simple, privacy-focused Chrome extension for highlighting text on web pages, adding notes, and exporting your research. Built with pure JavaScript, HTML, and CSS—no frameworks or build tools required.

## About The Project

In an age of information overload, being able to actively read and retain key information is crucial. Article Highlighter was built to be a lightweight, intuitive tool for students, researchers, and anyone who reads online. It allows you to mark important sections of articles, attach notes for context, and revisit them anytime. All your data is stored locally in your browser, ensuring your research remains private.

The extension provides two powerful export options:
1.  **Export Page:** Saves the full article as a PDF with your highlights inline for context.
2.  **Export Highlights:** Creates a clean, concise PDF summary containing only the text you highlighted and your notes—perfect for quick revisions.

## ✨ Features

* **Select & Highlight:** Easily highlight text on any webpage with a single click.
* **Add Notes:** Attach notes to any highlight for deeper context.
* **Persistent Storage:** Your highlights are automatically saved per-page and reappear when you revisit.
* **Popup Management:** A clean popup interface to view, manage, and navigate to your highlights.
* **Dual Export to PDF:**
    * Export the full webpage with highlights.
    * Export a summary document with only your highlights and notes.
* **Privacy First:** All data is stored locally in your browser's `localStorage` and is never sent to any server.
* **Framework-Free:** Built with vanilla JavaScript, HTML, and CSS for maximum performance and simplicity.

## 🚀 Installation

To install and test this extension locally, follow these steps:

1.  **Clone the Repository** (or download it as a ZIP file and unzip it).
    ```sh
    git clone [https://github.com/EternalKnight002/article-highlighter.git](https://github.com/EternalKnight002/article-highlighter.git)
    ```
2.  **Open Chrome Extensions**
    * Open your Google Chrome browser and navigate to `chrome://extensions`.

3.  **Enable Developer Mode**
    * In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **On**.

4.  **Load the Extension**
    * Click the **Load unpacked** button that appears on the top-left.
    * In the file selection dialog, navigate to and select the cloned `article-highlighter` folder (the one containing `manifest.json`).
    * Click "Select Folder".

5.  **Done!** The Article Highlighter icon will appear in your Chrome toolbar. You may need to click the puzzle piece icon (🧩) to pin it for easy access.

## 💻 How to Use

1.  **Navigate** to any article or webpage.
2.  **Highlight Text:** Select text with your mouse. A "✨ Highlight" button will appear. Click it.
3.  **Add a Note:** A modal will pop up. You can add an optional note and click "Save".
4.  **Manage Highlights:**
    * Click on any existing yellow highlight on the page to edit its note or delete it.
    * Click the extension icon in the toolbar to open the popup, where you can see all highlights on the current page.
5.  **Export:**
    * From the popup, click **"Export Page"** to save the entire article with highlights.
    * Click **"Export Highlights"** to save a clean summary PDF of your notes.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

