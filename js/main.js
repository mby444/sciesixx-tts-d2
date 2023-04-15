import { orders } from "./constant/tts.js";

const select = document.querySelector.bind(document);
const selectAll = document.querySelectorAll.bind(document);

const getProgress = (key) => {
    return localStorage.getItem(key);
};

const saveProgress = (key, data) => {
    data = typeof data === "string" ? data : JSON.stringify(data);
    localStorage.setItem(key, data);
};

const deleteProgress = (key) => {
    localStorage.removeItem(key);
};

const setSubmitMode = () => {

};

const unsetSubmitMode = () => {

};

const storeIdentityInput = (name, roll, grade) => {
    const storageKey = "@sciesixx_tts_identity";
    const data = {
        name: name.value || "",
        roll: roll.value || "",
        grade: grade.value || "",
    };
    saveProgress(storageKey, data);
};

const storeTTSInput = (...ttsInputLists) => {
    const storageKey = "@sciesixx_tts_main";
    const ttsValues = ttsInputLists.map((input) => input.value);
    saveProgress(storageKey, ttsValues);
};

const getTTSAnswerKeys = async () => {
    try {
        const rawResponse = await fetch("./rest/tts.php", {
            method: "PATCH",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });
        const response = await rawResponse.json();
        const { data } = response;
        return data;
    } catch (err) {
        console.log(err);
        return [];
    }
};

const compareTTSAnswer = (answers, answerKeys) => {
    
};

const submitTTS = async () => {
    const ttsAnswerKeys = await getTTSAnswerKeys();
    console.log(ttsAnswerKeys);
};

const restoreIdentityInput = (...inputLists) => {
    const storageKey = "@sciesixx_tts_identity";
    const jsonData = getProgress(storageKey);
    if (!jsonData) return;
    const data = JSON.parse(jsonData);
    const dataValues = [data.name, data.roll, data.grade];
    inputLists.forEach((input, i) => {
        input.value = dataValues[i];
    });
};

const restoreTTSInput = (...ttsInputLists) => {
    const storageKey = "@sciesixx_tts_main";
    const jsonData = getProgress(storageKey);
    if (!jsonData) return;
    const data = JSON.parse(jsonData);
    ttsInputLists.forEach((input, i) => {
        input.value = data[i];
    });
};

const enableTTS = () => {
    const inputs = selectAll(".tts-table input");
    orders.forEach((order) => {
        inputs[order - 1].classList.add("visible-tts-input");
    });
};

const confirmClearTTS = (callback=Function(), errCallback=Function()) => {
    const isSubmitMode = false;
    const ttsInputs = selectAll(".visible-tts-input");
    const isTTSEmpty = [...ttsInputs].every((input) => !input.value);
    if (isSubmitMode || isTTSEmpty) return errCallback();
    const confirmMessage = "Hapus semua kolom?";
    switch (typeof Swal) {
        case "function": {
            Swal.fire({
                title: confirmMessage,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#dc3741",
                confirmButtonText: "Hapus",
                cancelButtonText: "Batal",
            })
            .then((result) => {
                result.isConfirmed ? callback() : errCallback();
            })
            .catch((err) => {
                errCallback();
            });
            break;
        }
        default: {
            const confirmed = confirm(confirmMessage);
            confirmed ? callback() : errCallback();
        }
    }
};

const clearTTS = () => {
    const ttsStorageKey = "@sciesixx_tts_main";
    const ttsInputs = selectAll(".visible-tts-input");
    deleteProgress(ttsStorageKey);
    ttsInputs.forEach((input) => {
        input.value = "";
    });
};

const initIdentityInput = () => {
    const nameInput = select(".name-input");
    const rollInput = select(".roll-input");
    const gradeInput = select(".grade-input");
    const inputLists = [nameInput, rollInput, gradeInput];

    restoreIdentityInput(...inputLists);

    nameInput.addEventListener("input", () => {
        storeIdentityInput(...inputLists);
    });
    rollInput.addEventListener("input", () => {
        storeIdentityInput(...inputLists);
    });
    gradeInput.addEventListener("input", () => {
        storeIdentityInput(...inputLists);
    });
};

const initTTSInput = () => {
    enableTTS();
    const ttsInputs = selectAll(".visible-tts-input");
    restoreTTSInput(...ttsInputs);
    ttsInputs.forEach((ttsInput) => {
        ttsInput.addEventListener("input", () => {
            storeTTSInput(...ttsInputs);
        });
    });
};

const initSendBtn = () => {
    const sendBtn = select(".send-btn");
    sendBtn.addEventListener("click", () => {
        submitTTS();
    });
};

const initClearBtn = () => {
    const clearBtn = select(".clear-btn");
    clearBtn.addEventListener("click", () => {
        confirmClearTTS(() => {
            clearTTS();
        });
    });
};

const initResetBtn = () => {

};

const initInputs = () => {
    initIdentityInput();
    initTTSInput();
};

const initBtns = () => {
    initSendBtn();
    initClearBtn();
    initResetBtn();
};

window.addEventListener("load", () => {
    initInputs();
    initBtns();
});
