import { orders, answerGroups } from "./constant/tts.js";

const select = document.querySelector.bind(document);
const selectAll = document.querySelectorAll.bind(document);

const showError = async (title="Error", text="", icon="error") => {
    await Swal.fire({ title, text, icon });
};

const showSuccess = async (title="Sukses", text="", icon="success") => {
    await Swal.fire({ title, text, icon });
};

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

const storeSubmittedTTSAnswer = (answers) => {
    const storageKey = "@sciesixx_tts_submitted";
    saveProgress(storageKey, answers);
};

const getUserIdentity = () => {
    const inputs = selectAll(".profile-input");
    const [name, roll, grade] = [...inputs].map((input) => input.value?.trim());
    return { name, roll, grade };
};

const getTTSAnswer = () => {
    const tableInputs = selectAll(".tts-table input");
    const ttsInputs = answerGroups.map((answerGroup, i) => {
        const answer = answerGroup.map((answerOrder) => {
            return tableInputs[answerOrder - 1].value;
        }).join("");
        return { id : String(i + 1), answer };
    });
    return ttsInputs;
};

const getSubmittedTTSAnswer = () => {
    const storageKey = "@sciesixx_tts_submitted";
    const storedData = getProgress(storageKey);
    const data = storedData && typeof storedData === "string" ? JSON.parse(storedData) : storedData;
    return data;
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

const confirmSubmit = async () => {
    const confirmation = await Swal.fire({
        title: "Konfirmasi",
        text: "Jawaban akan dikirim dan diproses",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Kirim",
        cancelButtonText: "Batal",
    });
    return confirmation.isConfirmed;
};

const checkSubmitError = (data) => {
    try {
        const ttsInputs = selectAll(".visible-tts-input");
        const isValidUserIdentity = Boolean(data.name?.trim() && data.roll?.trim() && data.grade?.trim());
        const isValidTTSInputs = [...ttsInputs].every((input) => Boolean(input.value?.trim()));
        if (!isValidUserIdentity) throw new Error("Data identitas tidak lengkap");
        if (!isValidTTSInputs) throw new Error("Semua kolom wajib diisi");
        return null;
    } catch (err) {
        return err;
    }

};

const sendUserResult = async (data) => {
    try {
        const currentDate = Date();
        const payload = {
            name: data.name,
            roll: data.roll,
            grade_class: data.grade,
            accuracy: data.accuracy,
            right_answer: data.rightAnswer,
            wrong_answer: data.wrongAnswer,
            date: currentDate,
        };
        const rawResponse = await fetch("./rest/users.php", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const response = await rawResponse.json();
        console.log(response);
    } catch (err) {
        console.log(err);
    }
};

const sendRawUserResult = async (data) => {
    const confirmation = await confirmSubmit();
    const submitError = checkSubmitError(data);
    if (!confirmation) return;
    if (submitError instanceof Error) {
        return await showError("Error", submitError.message);
    }
    await sendUserResult(data);
    await showSuccess("Jawaban Terkirim!", "Terima kasih telah mengerjakan!");
};

const compareTTSAnswer = (answers, answerKeys) => {
    const output = {
        accuracy: 0,
        rightAnswer: 0,
        wrongAnswer: 0,
    };
    output.rightAnswer = answers.reduce((totalAnswer, currentAnswer, i) => {
        const answer1 = currentAnswer.answer?.toUpperCase()?.trim();
        const answer2 = answerKeys[i].answer?.toUpperCase()?.trim();
        const incrementValue = answer1 === answer2 ? 1 : 0;
        return totalAnswer + incrementValue;
    }, 0);
    output.wrongAnswer = 15 - output.rightAnswer;
    output.accuracy = output.rightAnswer / 15 * 100;
    return output;
};

const formatComparedResult = ({ accuracy, rightAnswer, wrongAnswer }) => {
    return {
        accuracy: String(Math.floor(accuracy * 10) / 10) + "%",
        rightAnswer: String(rightAnswer),
        wrongAnswer: String(wrongAnswer),
    }
};

const submitTTS = async () => {
    const userIdentity = getUserIdentity();
    const ttsAnswer = getTTSAnswer();
    const ttsAnswerKeys = await getTTSAnswerKeys();
    const comparedResult = compareTTSAnswer(ttsAnswer, ttsAnswerKeys);
    const formattedComparedResult = formatComparedResult(comparedResult);
    const userResult = { ...userIdentity, ...formattedComparedResult };
    await sendRawUserResult(userResult);
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

// ta = toggleactive
const taIdentityInput = (shouldActive = false) => {
    const inputs = selectAll(".profile-input");
    inputs.forEach((input) => {
        shouldActive ? input.removeAttribute("disabled") : input.setAttribute("disabled", "disabled");
    });
};

const taTTSInput = (shouldActive = false) => {
    const inputs = selectAll(".visible-tts-input");
    inputs.forEach((input) => {
        shouldActive ? input.removeAttribute("readonly") : input.setAttribute("readonly", "readonly");
    });
};

// tm = togglemode
const tmIdentityInput = () => {
    const submittedTTSAnswers = getSubmittedTTSAnswer();
    if (submittedTTSAnswers)  return taIdentityInput(true);
    taIdentityInput(false);
};

const tmTTSInput = () => {
    
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
