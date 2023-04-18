import { orders, answerGroups } from "./constant/tts.js";

const select = document.querySelector.bind(document);
const selectAll = document.querySelectorAll.bind(document);

const showError = async (title="Error", text="", icon="error") => {
    await Swal.fire({ title, text, icon });
};

const showSuccess = async (title="Sukses", text="", icon="success") => {
    await Swal.fire({ title, text, icon });
};

const showLoader = async () => {
    console.log("Loading...");
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

const clearProgress = () => {
    const storageKeys = ["@sciesixx_tts_identity", "@sciesixx_tts_main", "@sciesixx_tts_submitted", "@sciesixx_tts_corrected"];
    storageKeys.forEach((storageKey) => {
        deleteProgress(storageKey);
    });
};

const blurAllInput = () => {
    const tempInput = document.createElement("input");
    document.body.appendChild(tempInput);
    tempInput.focus();
    document.body.removeChild(tempInput);
};

const colorizeTTSInputs = (correctedAnswers) => {
    const tableInputs = selectAll(".tts-table input");
    const redColor = "#FF4D3F";
    const greenColor = "#00FF90";
    correctedAnswers.forEach((correctedAnswer) => {
        const color = correctedAnswer.correctAnswer ? greenColor : redColor;
        correctedAnswer.answerGroup.forEach((order) => {
            tableInputs[order - 1].style.backgroundColor = color;
        });
    });
};

const decolorizeTTSInputs = () => {
    const defaultColor = "#a4bad66c";
    const ttsInputs = selectAll(".visible-tts-input");
    ttsInputs.forEach((input) => {
        input.style.backgroundColor = defaultColor;
    });
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

const storeSubmittedTTSAnswers = (answers) => {
    const storageKey = "@sciesixx_tts_submitted";
    saveProgress(storageKey, answers);
};

const storeCorrectedTTSAnswers = (correctedAnswers) => {
    const storageKey = "@sciesixx_tts_corrected";
    saveProgress(storageKey, correctedAnswers);
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

const getSubmittedTTSAnswers = () => {
    const storageKey = "@sciesixx_tts_submitted";
    const storedData = getProgress(storageKey);
    const data = storedData && typeof storedData === "string" ? JSON.parse(storedData) : storedData;
    return data;
};

const getCorrectedTTSAnswers = () => {
    const storageKey = "@sciesixx_tts_corrected";
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

const genCorrectedTTSAnswers = (answers, answerKeys) => {
    return answers.map((answer, i) => {
        const id = answer.id;
        const alphabets = answer.answer.split("").map((a) => a.toUpperCase());
        const answerGroup = answerGroups[i];
        const correctAnswer = answer.answer.toUpperCase() === answerKeys[i].answer.toUpperCase();
        return { id, alphabets, answerGroup, correctAnswer };
    });
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
        if (!isValidTTSInputs) throw new Error("Semua kolom wajib diisi");
        if (!isValidUserIdentity) throw new Error("Data identitas tidak lengkap");
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
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
};

const sendRawUserResult = async (data, correctedData) => {
    const confirmation = await confirmSubmit();
    const submitError = checkSubmitError(data);
    if (!confirmation) return;
    showLoader();
    if (submitError instanceof Error) return await showError("Error", submitError.message);
    const sentUserResult = await sendUserResult(data);
    if (sentUserResult instanceof Error) return showError("Maaf", "Telah terjadi kesalahan, mohon periksa kembali koneksi internet anda");
    storeSubmittedTTSAnswers(data);
    storeCorrectedTTSAnswers(correctedData);
    await showSuccess("Jawaban Terkirim!", "Terima kasih telah mengerjakan!");
    location.reload();
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
    const ttsAnswers = getTTSAnswer();
    const ttsAnswerKeys = await getTTSAnswerKeys();
    const comparedResult = compareTTSAnswer(ttsAnswers, ttsAnswerKeys);
    const correctedTTSAnswers = genCorrectedTTSAnswers(ttsAnswers, ttsAnswerKeys);
    const formattedComparedResult = formatComparedResult(comparedResult);
    const userResult = { ...userIdentity, ...formattedComparedResult };
    await sendRawUserResult(userResult, correctedTTSAnswers);
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

const displayScore = () => {
    const scoreElements = selectAll(".score-table-data");
    const submittedTTSAnswers = getSubmittedTTSAnswers();
    const scoreList = [
        submittedTTSAnswers?.accuracy ?? "-",
        submittedTTSAnswers?.rightAnswer ?? "-",
        submittedTTSAnswers?.wrongAnswer ?? "-",
    ];
    scoreElements.forEach((element, i) => {
        element.innerHTML = scoreList[i];
    });
};

const emptyScore = () => {
    const scoreElements = selectAll(".score-table-data");
    scoreElements.forEach((element) => {
        element.innerHTML = "-";
    });
};

// ta = toggleactive
const taIdentityInput = (shouldActive = false) => {
    const inputs = selectAll(".profile-input");
    inputs.forEach((input) => {
        if (shouldActive) {
            input.removeAttribute("disabled");
            return;
        }
        input.setAttribute("disabled", "disabled");
    });
};

const taTTSInput = (shouldActive = false) => {
    const inputs = selectAll(".visible-tts-input");
    const correctedTTSAnswers = getCorrectedTTSAnswers();
    switch (shouldActive) {
        case true: {
            inputs.forEach((input) => {
                decolorizeTTSInputs();
                input.removeAttribute("readonly");
                emptyScore();
            });
            break;
        }
        default: {
            inputs.forEach((input) => {
                colorizeTTSInputs(correctedTTSAnswers);
                input.setAttribute("readonly", "readonly");
                displayScore();
            });
        }
    }
};

const getIsSubmitMode = () => {
    const submittedTTSAnswers = getSubmittedTTSAnswers();
    const correctedTTSAnswers = getCorrectedTTSAnswers();
    return Boolean(submittedTTSAnswers || correctedTTSAnswers);
};

// tm = togglemode
const tmIdentityInput = () => {
    const isSubmitMode = getIsSubmitMode();
    if (!isSubmitMode) return taIdentityInput(true);
    taIdentityInput(false);
};

const tmTTSInput = () => {
    const isSubmitMode = getIsSubmitMode();
    if (!isSubmitMode) return taTTSInput(true);
    taTTSInput(false);
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

const toggleMainBtn = (submitMode = false) => {
    const btnWrappers = selectAll(".main-btn-wrapper");
    const firstIndex = submitMode ? 0 : 1;
    const secondIndex = submitMode ? 1 : 0;
    btnWrappers[firstIndex].classList.add("hidden");
    btnWrappers[secondIndex].classList.remove("hidden");
};

const confirmClearTTS = (callback=Function(), errCallback=Function()) => {
    const ttsInputs = selectAll(".visible-tts-input");
    const isTTSEmpty = [...ttsInputs].every((input) => !input.value);
    if (isTTSEmpty) return errCallback();
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

const confirmResetTTS = (callback=Function(), errCallback=Function()) => {
    const confirmMessage = "Mulai ulang pengerjaan dari awal?";
    Swal.fire({
        title: confirmMessage,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#dc3741",
        confirmButtonText: "Reset",
        cancelButtonText: "Batal",
    })
    .then((result) => {
        result.isConfirmed ? callback() : errCallback();
    })
    .catch((err) => {
        errCallback();
    });
};

const clearTTS = () => {
    const ttsStorageKey = "@sciesixx_tts_main";
    const ttsInputs = selectAll(".visible-tts-input");
    deleteProgress(ttsStorageKey);
    ttsInputs.forEach((input) => {
        input.value = "";
    });
};

const resetTTS = () => {
    clearProgress();
    location.reload();
};

const limitTTSInput = (element) => {
    const value = element.value?.trim();
    if (!value) return element.value = "";
    element.value = value[0]?.toUpperCase();
};

// const unfocusTTSInput = (element) => {
//     const value = element.value?.trim();
//     if (!value) return;
//     element.blur();
// };

const initIdentityInput = () => {
    const nameInput = select(".name-input");
    const rollInput = select(".roll-input");
    const gradeInput = select(".grade-input");
    const inputLists = [nameInput, rollInput, gradeInput];

    restoreIdentityInput(...inputLists);
    tmIdentityInput();

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
    tmTTSInput();
    ttsInputs.forEach((ttsInput) => {
        ttsInput.addEventListener("input", () => {
            limitTTSInput(ttsInput);
            // unfocusTTSInput(ttsInput);
            storeTTSInput(...ttsInputs);
        });
    });
};

const initSendBtn = () => {
    const sendBtn = select(".send-btn");
    sendBtn.removeAttribute("disabled");
    sendBtn.addEventListener("click", () => {
        submitTTS();
    });
};

const initClearBtn = () => {
    const clearBtn = select(".clear-btn");
    clearBtn.removeAttribute("disabled");
    clearBtn.addEventListener("click", () => {
        confirmClearTTS(() => {
            clearTTS();
        });
    });
};

const initResetBtn = () => {
    const resetBtn = select(".reset-btn");
    resetBtn.removeAttribute("disabled");
    resetBtn.addEventListener("click", () => {
        confirmResetTTS(() => {
            resetTTS();
        });
    });
};

const initToggleBtn = () => {
    const isSubmitMode = getIsSubmitMode();
    toggleMainBtn(isSubmitMode);
};

const initInputs = () => {
    initIdentityInput();
    initTTSInput();
};

const initBtns = () => {
    initSendBtn();
    initClearBtn();
    initResetBtn();
    initToggleBtn();
};

window.addEventListener("load", () => {
    initInputs();
    initBtns();
});
