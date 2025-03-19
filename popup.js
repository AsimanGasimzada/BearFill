document.addEventListener("DOMContentLoaded", function () {
    loadStoredForms();
    loadLastSelectedForm(); 
});

document.getElementById("add-field").addEventListener("click", function () {
    addField("", "");
});

document.getElementById("save-form").addEventListener("click", function () {
    let formName = prompt("Form üçün ad daxil edin:");
    if (!formName) return;

    let formData = {};
    document.querySelectorAll(".field").forEach(field => {
        let key = field.querySelector(".key").value.trim();
        let value = field.querySelector(".value").value.trim();
        if (key) formData[key] = value;
    });

    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        forms[formName] = formData;

        chrome.storage.local.set({ savedForms: forms }, function () {
            loadStoredForms();
            document.getElementById("form-list").value = formName;
            saveLastSelectedForm(formName); 
        });
    });
});

document.getElementById("delete-form").addEventListener("click", function () {
    let selectedForm = document.getElementById("form-list").value;
    if (!selectedForm) return;

    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        delete forms[selectedForm];

        chrome.storage.local.set({ savedForms: forms }, function () {
            loadStoredForms();
            document.getElementById("fields-container").innerHTML = "";
            chrome.storage.local.remove("lastSelectedForm"); 
        });
    });
});

document.getElementById("edit-form").addEventListener("click", function () {
    let selectedForm = document.getElementById("form-list").value;
    if (!selectedForm) return;

    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        let formData = forms[selectedForm] || {};

        document.getElementById("fields-container").innerHTML = "";
        for (let key in formData) {
            addField(key, formData[key]);
        }
    });
});

document.getElementById("fill-form").addEventListener("click", function () {
    let selectedForm = document.getElementById("form-list").value;
    if (!selectedForm) return;

    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        if (forms[selectedForm]) {
            fillInputs(forms[selectedForm]);
        }
    });
});

function loadStoredForms() {
    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        let select = document.getElementById("form-list");
        select.innerHTML = '<option value="">Form seç</option>';

        for (let name in forms) {
            let option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        }

        loadLastSelectedForm(); 
    });
}

function saveLastSelectedForm(formName) {
    chrome.storage.local.set({ lastSelectedForm: formName });
}

function loadLastSelectedForm() {
    chrome.storage.local.get("lastSelectedForm", function (data) {
        let lastForm = data.lastSelectedForm;
        if (lastForm) {
            let formList = document.getElementById("form-list");
            formList.value = lastForm; 
            fillInputsFromStorage(lastForm);
        }
    });
}

function addField(key, value) {
    let container = document.getElementById("fields-container");
    let div = document.createElement("div");
    div.classList.add("field");
    div.innerHTML = `
        <input type="text" class="key" placeholder="Class / ID" value="${key}">
        <input type="text" class="value" placeholder="Dəyər" value="${value}">
        <button class="delete-btn">❌</button>
    `;

    div.querySelector(".delete-btn").addEventListener("click", function () {
        div.remove();
    });

    container.appendChild(div);
}

function fillInputs(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: function (data) {
                for (let key in data) {
                    let elements = document.querySelectorAll(key);
                    elements.forEach(element => {
                        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                            element.value = data[key];
                        } else if (element.tagName === "SELECT") {
                            let valueToSelect = data[key];
                            let options = element.options;
                            for (let i = 0; i < options.length; i++) {
                                if (options[i].textContent.includes(valueToSelect)) {
                                    element.value = options[i].value;
                                    break;
                                }
                            }
                        }
                    });
                }
            },
            args: [data]
        });
    });
}

function fillInputsFromStorage(formName) {
    chrome.storage.local.get("savedForms", function (data) {
        let forms = data.savedForms || {};
        let formData = forms[formName] || {};
        for (let key in formData) {
            let elements = document.querySelectorAll(key);
            elements.forEach(element => {
                if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                    element.value = formData[key];
                } else if (element.tagName === "SELECT") {
                    let valueToSelect = formData[key];
                    let options = element.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].textContent.includes(valueToSelect)) {
                            element.value = options[i].value;
                            break;
                        }
                    }
                }
            });
        }
    });
}
