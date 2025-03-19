chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillInputs") {
        for (let key in request.data) {
            let elements = document.querySelectorAll(key);
            elements.forEach(element => {
                if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                    element.value = request.data[key];
                }
            });
        }
        sendResponse({ status: "completed" });
    }
});
