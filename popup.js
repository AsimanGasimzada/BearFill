document.addEventListener("DOMContentLoaded", () => {
  loadStoredForms();
  loadLastSelectedForm();
});

document
  .getElementById("add-field")
  .addEventListener("click", () => addField("", ""));
document.getElementById("save-form").addEventListener("click", saveForm);
document.getElementById("delete-form").addEventListener("click", deleteForm);
document.getElementById("edit-form").addEventListener("click", editForm);
document.getElementById("fill-form").addEventListener("click", fillForm);
document.getElementById("fill-form").addEventListener("click", fillForm);

document
  .getElementById("clear-storage")
  .addEventListener("click", clearAllStorage);

function loadStoredForms() {
  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    const formList = document.getElementById("form-list");
    formList.innerHTML = '<option value="">Form seç</option>';

    Object.keys(savedForms).forEach((formName) => {
      let option = document.createElement("option");
      option.value = formName;
      option.textContent = formName;
      formList.appendChild(option);
    });

    loadLastSelectedForm(); 
  });
}

function loadLastSelectedForm() {
  chrome.storage.local.get("lastSelectedForm", ({ lastSelectedForm }) => {
    const formList = document.getElementById("form-list");
    if (lastSelectedForm && formList) {
      formList.value = lastSelectedForm; 
      fillInputsFromStorage(lastSelectedForm);
    }
  });
}

function saveForm() {
  const formName = prompt("Form üçün ad daxil edin:");
  if (!formName) return;

  const formData = collectFormData();
  if (!Object.keys(formData).length) return;

  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    savedForms[formName] = formData;
    chrome.storage.local.set({ savedForms }, () => {
      loadStoredForms(); 
      document.getElementById("form-list").value = formName;
      saveLastSelectedForm(formName); 
    });
  });
}

function deleteForm() {
  const selectedForm = document.getElementById("form-list").value;
  if (!selectedForm) return;

  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    delete savedForms[selectedForm];
    chrome.storage.local.set({ savedForms }, () => {
      loadStoredForms();
      document.getElementById("fields-container").innerHTML = "";
      chrome.storage.local.remove("lastSelectedForm");
    });
  });
}

function editForm() {
  const selectedForm = document.getElementById("form-list").value;
  if (!selectedForm) return;

  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    const formData = savedForms[selectedForm] || {};
    document.getElementById("fields-container").innerHTML = "";
    Object.entries(formData).forEach(([key, value]) => addField(key, value));
  });
}

function fillForm() {
  const selectedForm = document.getElementById("form-list").value;
  if (!selectedForm) return;

  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    if (savedForms[selectedForm]) {
      fillInputs(savedForms[selectedForm]);
    }
  });
}

function addField(key, value) {
  const container = document.getElementById("fields-container");
  const fieldDiv = document.createElement("div");
  fieldDiv.classList.add("field");
  fieldDiv.innerHTML = `
          <input type="text" class="key" placeholder="Class / ID" value="${key}">
          <input type="text" class="value" placeholder="Value" value="${value}">
          <button class="delete-btn">✖</button>
      `;
  fieldDiv
    .querySelector(".delete-btn")
    .addEventListener("click", () => fieldDiv.remove());
  container.appendChild(fieldDiv);
}

function collectFormData() {
  const formData = {};
  document.querySelectorAll(".field").forEach((field) => {
    const key = field.querySelector(".key").value.trim();
    const value = field.querySelector(".value").value.trim();
    if (key) formData[key] = value;
  });
  return formData;
}

function fillInputs(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: (data) => {
        for (let key in data) {
          const elements = document.querySelectorAll(key);
          elements.forEach((element) => {
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
              if (element.type === "checkbox") {
                element.checked = data[key] === "true";
              } else {
                element.value = data[key];
              }
            } else if (element.tagName === "SELECT") {
              const valueToSelect = data[key];
              const options = element.options;
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
      args: [data],
    });
  });
}

function fillInputsFromStorage(formName) {
  chrome.storage.local.get("savedForms", ({ savedForms = {} }) => {
    const formData = savedForms[formName] || {};
    Object.entries(formData).forEach(([key, value]) => {
      const elements = document.querySelectorAll(key);
      elements.forEach((element) => {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.value = value;
        } else if (element.tagName === "SELECT") {
          const options = element.options;
          for (let i = 0; i < options.length; i++) {
            if (options[i].textContent.includes(value)) {
              element.value = options[i].value;
              break;
            }
          }
        } else if (element.tagName === "INPUT" && element.type === "checkbox") {
          element.checked = value === "true";
        }
      });
    });
  });
}

function saveLastSelectedForm(formName) {
  chrome.storage.local.set({ lastSelectedForm: formName });
}

function clearAllStorage() {
  chrome.storage.local.clear(() => {
    loadStoredForms();
    document.getElementById("fields-container").innerHTML = "";
    document.getElementById("form-list").value = "";
    chrome.storage.local.remove("lastSelectedForm");
  });
}
document.getElementById("random-fill").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log("Active tab:", tabs);

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const inputs = document.querySelectorAll("input, select, textarea");

        inputs.forEach((element) => {
          if (element.disabled || element.readOnly) return;

          switch (element.tagName.toLowerCase()) {
            case "input":
              switch (element.type) {
                case "text":
                case "password":
                case "email":
                case "search":
                case "tel":
                case "url":
                  element.value = generateRandomString(10);

                  if (element.type === "email") element.value += "@gmail.com";
                  break;
                case "number":
                  element.value = Math.floor(Math.random() * 100);
                  break;
                case "checkbox":
                case "radio":
                  element.checked = Math.random() > 0.5;
                  break;
                case "date":
                  element.value = generateRandomDate();
                  break;
              }
              break;
            case "select":
              if (element.options.length > 0) {
                const randomIndex = Math.floor(
                  Math.random() * element.options.length
                );
                element.selectedIndex = randomIndex;
              }
              break;
            case "textarea":
              element.value = generateRandomString(20);
              break;
          }
        });

        function generateRandomString(length) {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let result = "";
          for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        }

        function generateRandomDate() {
          const start = new Date(2000, 0, 1);
          const end = new Date();
          const randomDate = new Date(
            start.getTime() + Math.random() * (end.getTime() - start.getTime())
          );
          return randomDate.toISOString().split("T")[0];
        }
      },
    });
  });
});
