let toolRunnerSettings = localStorage.getItem("settings")
    ? JSON.parse(localStorage.getItem("settings"))
    : {
          autoSaveInterval: { value: 60, type: "number" },
          getIPsecInterface: { value: true, type: "checkbox" },
          templateSeperator: { value: false, type: "checkbox" },
          seperationText: { value: "========================", type: "text" },
          SHORTGWDETECT: { value: true, type: "checkbox" },
          placeholderAnimation: { value: false, type: "checkbox" },
      };

localStorage.setItem("settings", JSON.stringify(toolRunnerSettings));

let autoSaveInterval = toolRunnerSettings["autoSaveInterval"].value;
let getIPsecInterface = toolRunnerSettings["getIPsecInterface"].value;
let templateSeperator = toolRunnerSettings["templateSeperator"].value;
let seperationText = toolRunnerSettings["seperationText"].value;
let SHORTGWDETECT = toolRunnerSettings["SHORTGWDETECT"].value;
let placeholderAnimation = toolRunnerSettings["placeholderAnimation"].value;

let ignoreList = ["settings", "theme"];

const tools = {
    Ping: "{PCs",
    PingHTS: "{PHm",
    PingECM: "{PCm",
    PingJupEntTerminal: "{PJm",
    PingOrCurrentStatusFortimgr: "{PFr",
    PingOrCurrentStatusMeraki: "{PMr",
    PingOrCurrentStatusVeloCloud: "{PVr",
    PingOrCurrentStatusWattbox: "{PWb",
    PingOrCurrentStatusHughesApe: "{PHa",
    PingInterfaces: "{In",
    getIPSecStatus: "{Ip",
    getSysArp: "{As",
    getRouterGWDetect: "{Gd",
}; //dictionary of tools and the tags for the notes

const assetOrder = [
    "Router",
    "Dedicated Fiber L3",
    "Dedicated IP BB",
    "Cable L3",
    "891F",
    "Acceleration Appliance",
    "Wireless Modem",
    "Modem",
    "IBR650C-150M-D",
    "Satellite Modem",
    "Wireline Modem",
    "Switch",
    "IoT Device",
]; //easiest way I could find to have the assets in a less random order

const toolOrder = [
    "Ping",
    "PingHTS",
    "PingECM",
    "PingJupEntTerminal",
    "PingOrCurrentStatusFortimgr",
    "PingOrCurrentStatusMeraki",
    "PingOrCurrentStatusVeloCloud",
    "PingOrCurrentStatusWattbox",
    "PingOrCurrentStatusHughesApe",
    "PingInterfaces",
    "getIPSecStatus",
    "getSysArp",
    "getRouterGWDetect",
]; //provides order for the tool results to be uniform

function toggleOpenNMP() {
    if (openNMP) {
        document.getElementById("toggleNMP").style.backgroundColor =
            "var(--color-17)";
        document.getElementById("toggleNMP").style.color = "var(--color-17)";
        openNMP = !openNMP;
    } else {
        document.getElementById("toggleNMP").style.backgroundColor =
            "var(--color-06)";
        document.getElementById("toggleNMP").style.color = "var(--color-06)";
        openNMP = !openNMP;
    }
}

function firstContaining(lines, subString) {
    let index = lines.findIndex((element) => element.includes(subString));
    if (index !== -1) {
        return lines[index];
    } else {
        return "";
    }
}

function getAssets() {
    if (document.getElementById("assetBox").value == "") {
        return;
    }
    if (openNMP) {
        open(
            "https://faultuser.hughes.net/RapidSuite/externalObjectDetails.gsp?name=" +
                document.getElementById("assetBox").value
        );
    }

    chrome.runtime.sendMessage(
        extensionID,
        {
            request: "assets",
            assetID: document.getElementById("assetBox").value.trim(),
        },
        function (response) {
            let page = new DOMParser().parseFromString(
                response.page,
                "text/html"
            );
            let assets = {
                0: {
                    assetID: document.getElementById("assetBox").value,
                    type: page.getElementsByClassName("table")[0].children[0]
                        .children[1].children[1].textContent,
                },
            };
            if (page.getElementById("otherDevicesTable")) {
                let otherDevicesTable =
                    page.getElementById("otherDevicesTable").rows;
                for (let row = 1; row < otherDevicesTable.length; row++) {
                    assets[row] = {
                        assetID:
                            otherDevicesTable[row].cells[0].children[0]
                                .innerHTML,
                        // name : otherDevicesTable[row].cells[1].innerHTML,
                        type: otherDevicesTable[row].cells[2].innerHTML,
                    };
                }
            }
            // console.log(assets);
            createAssetTemplate(assets);
        }
    );
}

function createAssetTemplate(assets) {
    let template = "";
    // it is not the best means of doing this likely but
    // the nested loops go through the array of asset types from above
    // checks for all of the devices of that type from the list of assets from site
    // just to add the devices in the right order
    for (type in assetOrder) {
        for (asset in assets) {
            if (assets[asset].type == assetOrder[type]) {
                if (templateSeperator) {
                    template += `${seperationText}\n`;
                }
                template +=
                    assets[asset].type +
                    " " +
                    assets[asset].assetID +
                    ":\n{" +
                    assets[asset].assetID +
                    "}\n";
            }
        }
    }

    document.getElementById("ToolRes2").value = template;
    getTools(assets);
}

function getTools(assets) {
    for (asset in assets) {
        chrome.runtime.sendMessage(
            extensionID,
            {
                request: "tools",
                assetID: assets[asset].assetID,
                type: assets[asset].type,
            },
            function (response) {
                let page = new DOMParser().parseFromString(
                    response.page,
                    "text/html"
                );
                let assetID = response.assetID;
                let type = response.type;
                let troubleshooting = page.getElementById(
                    "troubleshootingActions"
                );
                let advanced = page.getElementById("advancedActions");
                let toolList = { hasTools: false };
                for (let i = 0; i < troubleshooting.length; i++) {
                    try {
                        let tool = troubleshooting.options[i]
                            .getAttribute("onclick")
                            .split("action=")[1]
                            .split("', '")[0];
                        if (tools[tool]) {
                            toolList[i] = {
                                id: tool,
                                name: troubleshooting[i].value,
                            };
                            toolList.hasTools = true;
                        }
                    } catch (error) {}
                }
                if (advanced) {
                    for (let i = 0; i < advanced.length; i++) {
                        try {
                            let tool = advanced.options[i]
                                .getAttribute("onclick")
                                .split("action=")[1]
                                .split("', '")[0];
                            if (tools[tool]) {
                                toolList[i + troubleshooting.length] = {
                                    id: tool,
                                    name: advanced[i].value,
                                };
                                toolList.hasTools = true;
                            }
                        } catch (error) {}
                    }
                }
                if (toolList.hasTools) {
                    delete toolList.hasTools;
                    createTemplate(type, assetID, toolList);
                } else {
                    removeAsset(assetID);
                }
            }
        );
    }
}

function createTemplate(type, assetID, toolList) {
    let template;
    let hasInterface = false;
    for (tool in toolList) {
        if (toolList[tool].id == "PingInterfaces") hasInterface = true;
    }
    if (hasInterface) {
        template = `{uT${assetID}}\n`;
    } else {
        template = "\n";
    }

    for (order in toolOrder) {
        for (tool in toolList) {
            if (toolList[tool].id == toolOrder[order]) {
                template +=
                    toolList[tool].name +
                    " -\n" +
                    tools[toolList[tool].id] +
                    assetID +
                    "}\n";
            }
        }
    }

    let n = document.getElementById("ToolRes2").value;
    document.getElementById("ToolRes2").value = n.replace(
        "{" + assetID + "}",
        template
    );
    runAllTools(type, assetID, toolList);
}

function removeAsset(assetID) {
    let str = document.getElementById("ToolRes2").value;
    let n;
    n = str.split("\n");
    let lineNum = n.indexOf("{" + assetID + "}");
    if (lineNum == -1) {
        return;
    }
    if (templateSeperator) {
        n.splice(lineNum - 2, 3);
    } else {
        n.splice(lineNum - 1, 2);
    }
    n = n.join("\n").trim();
    document.getElementById("ToolRes2").value = n;
}

function runAllTools(type, assetID, toolList) {
    for (tool in toolList) {
        remoteRunTool(type, assetID, toolList[tool].id);
    }
}

function remoteRunTool(type, assetID, tool) {
    chrome.runtime.sendMessage(
        extensionID,
        {
            request: "run",
            assetID: assetID,
            tool: tool,
            type: type,
        },
        function (response) {
            let page = new DOMParser().parseFromString(
                response.page,
                "text/html"
            );
            let assetID = response.assetID;
            let tool = response.tool;
            let type = response.type;
            let results = "";
            try {
                switch (tool) {
                    case "Ping":
                        results = page.getElementById("pingResults");
                        let pingResult = "";
                        let offset = results.children.length % 7 == 1 ? 3 : 2; //Hackiest bit of code so far, failed PCS on core2 has an extra child at the end that makes the result one earlier
                        pingResult =
                            results.children[
                                results.children.length - offset
                            ].textContent
                                .split("\n")
                                .slice(0, 3)
                                .join("\n") + "\n\n";
                        if (type.trim() == "Acceleration Appliance") {
                            try {
                                for (
                                    let i = 0;
                                    i <
                                    results.querySelectorAll("table").length;
                                    i++
                                ) {
                                    pingResult +=
                                        results.querySelectorAll("table")[i]
                                            .innerText + "\n";
                                }
                            } catch (exception) {}
                        }
                        addToolResult(assetID, tool, pingResult);
                        break;
                    case "PingHTS":
                        results = page.getElementById("pingResults");

                        let pingHTSResult = results.children[8].innerText;
                        pingHTSResult += results.children[9].innerText;
                        pingHTSResult += results.children[10].innerText;

                        if (pingHTSResult.trim() == "") {
                            pingHTSResult += results.children[3].innerText;
                            pingHTSResult += results.children[4].innerText;
                        }
                        addToolResult(assetID, tool, pingHTSResult);
                        break;
                    case "PingECM":
                        results = page.querySelectorAll("table");

                        let pingECMResult = tableParse(results[0]);
                        pingECMResult += `\n${tableParse(results[1])}`;

                        addToolResult(assetID, tool, pingECMResult);
                        break;
                    case "PingJupEntTerminal":
                        results = page.querySelectorAll("table");

                        let pingJupiter = tableParse(results[0]);

                        pingJupiter += `\n${tableParse(results[1])}`;

                        addToolResult(assetID, tool, pingJupiter);
                        break;
                    case "PingOrCurrentStatusFortimgr":
                        results = page.getElementById("pingResults");

                        let pingFortimgrResult = tableParse(
                            results.querySelectorAll("table")[0]
                        );

                        addToolResult(assetID, tool, pingFortimgrResult);
                        break;
                    case "PingOrCurrentStatusMeraki":
                        let pingMerakiResult = tableParse(
                            page.querySelector("table")
                        );
                        addToolResult(assetID, tool, pingMerakiResult);
                        break;
                    case "PingOrCurrentStatusVeloCloud":
                        results = page.getElementById("pingResults");

                        let pingVeloCloudResult = tableParse(
                            results.querySelectorAll("table")[0]
                        ).trim();
                        pingVeloCloudResult +=
                            "\n" +
                            tableParse(results.querySelectorAll("table")[1]);
                        if (results.querySelectorAll("table").length > 2) {
                            pingVeloCloudResult +=
                                "\n" +
                                tableParse(
                                    results.querySelectorAll("table")[2]
                                );
                        }
                        // .innerText.split("\n")
                        // .map((s) => s.trim())
                        // .join("\n")
                        // .replace(/\n{3,}/g, "|")
                        // .replace(/\n{1}/g, " ")
                        // .replaceAll("|", "\n")
                        // .trim();

                        addToolResult(assetID, tool, pingVeloCloudResult);
                        break;
                    case "PingInterfaces":
                        results = page.querySelector("table");
                        let uptime = page.querySelectorAll("b");
                        let interfaceResult;
                        if (results) {
                            interfaceResult = results.innerText
                                .replaceAll(" ", "")
                                .split("\n\n")
                                .filter((line) => line.includes("wan"))
                                .join(".")
                                .replaceAll("\n", " ")
                                .replaceAll(".", "\n");
                            if (getIPsecInterface) {
                                interfaceResult +=
                                    "\n" +
                                    results.innerText
                                        .replaceAll(" ", "")
                                        .split("\n\n")
                                        .filter((line) =>
                                            line.includes("ipsec-tunnel")
                                        )
                                        .join(".")
                                        .replaceAll("\n", " ")
                                        .replaceAll(".", "\n");

                                interfaceResult +=
                                    "\n" +
                                    results.innerText
                                        .replaceAll(" ", "")
                                        .split("\n\n")
                                        .filter((line) =>
                                            line.includes("ipsec-backup")
                                        )
                                        .join(".")
                                        .replaceAll("\n", " ")
                                        .replaceAll(".", "\n");
                            }
                        }
                        if (uptime[2]) {
                            // console.log(uptime)
                            addUptimeResult(
                                uptime[2].innerText.replace("=", "-"),
                                assetID
                            );
                        } else {
                            removeUptimeResult(assetID);
                        }

                        addToolResult(assetID, tool, interfaceResult);
                        break;
                    case "getIPSecStatus":
                        results = page.getElementById("pingResults");
                        let textResult = results.textContent.split("\n");

                        let IPSecResult =
                            firstContaining(textResult, "ipsec-tunnel") +
                            "\n" +
                            firstContaining(textResult, "ipsec-backup");

                        addToolResult(assetID, tool, IPSecResult);
                        break;
                    case "getSysArp":
                        results = page.getElementById("pingResults");

                        let sysArpResult = results.textContent
                            .split("\n")
                            .filter((line) => line.includes("wan"))
                            .join("\n");

                        addToolResult(assetID, tool, sysArpResult);
                        break;
                    case "getRouterGWDetect":
                        results = page.getElementById("pingResults");
                        let GWDetectResult = "";
                        if (SHORTGWDETECT) {
                            GWDetectResult =
                                results.children[0].children[5].textContent
                                    .split("\n")
                                    .filter((line) => line.includes("WAN"))
                                    .join("\n");

                            if (GWDetectResult.trim().length < 1) {
                                GWDetectResult =
                                    results.children[0].children[5].textContent
                                        .split("\n")
                                        .filter((line) => line.includes("VLAN"))
                                        .join("\n");
                            }
                        } else {
                            GWDetectResult =
                                results.children[0].children[5].textContent
                                    .split("#")[1]
                                    .split("\n")
                                    .slice(1, -1)
                                    .join("\n")
                                    .split("\n\n")
                                    .filter((line) => line.includes("wan"))
                                    .join("\n\n");

                            if (GWDetectResult.trim().length < 1) {
                                GWDetectResult =
                                    results.children[0].children[5].textContent
                                        .split("#")[1]
                                        .split("\n")
                                        .slice(1, -1)
                                        .join("\n")
                                        .split("\n\n")
                                        .filter((line) => line.includes("vlan"))
                                        .join("\n\n");
                            }
                        }
                        addToolResult(assetID, tool, GWDetectResult);
                        break;
                    case "PingOrCurrentStatusWattbox":
                        results = page.getElementById("pingResults");
                        let WBPingResults = "";
                        WBPingResults = tableParse(
                            results.querySelectorAll("table")[0]
                        )
                            .split("\n")
                            .slice(0, 12)
                            .join("\n");
                        addToolResult(assetID, tool, WBPingResults);
                        break;
                    case "PingOrCurrentStatusHughesApe":
                        results = page.getElementById("pingResults");
                        let HAPingResults = "";
                        HAPingResults = tableParse(
                            results.querySelectorAll("table")[1]
                        );
                        addToolResult(assetID, tool, HAPingResults);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                addToolResult(assetID, tool, "");
                console.error(assetID, tool, error);
            }
        }
    );
}

function addUptimeResult(uptime, asset) {
    let str = document.getElementById("ToolRes2").value; //gets current tool results box contents
    let n;
    if (uptime.replace(/\s/g, "").length > 0) {
        n = str.replace(`{uT${asset}}`, uptime.trim() + "\n").trim(); //replaces the appropriate placeholder based on tool result
    } else {
        n = str.split("\n");
        let lineNum = n.indexOf(`{uT${asset}}`);
        if (lineNum != -1) {
            n[lineNum] = "";
        }
        n = n.join("\n").trim();
    }
    document.getElementById("ToolRes2").value = n; //sets the box value to the new value with the tool result inserted in place of the tag
}

function removeUptimeResult(asset) {
    let str = document.getElementById("ToolRes2").value; //gets current tool results box contents
    let n;

    n = str.split("\n");
    let lineNum = n.indexOf(`{uT${asset}}`);
    if (lineNum != -1) {
        n[lineNum] = "";
    }
    n = n.join("\n").trim();
    document.getElementById("ToolRes2").value = n; //sets the box value to the new value with the tool result inserted in place of the tag
}

function addToolResult(assetID, tool, res) {
    let str = document.getElementById("ToolRes2").value; //gets current tool results box contents
    let n;
    if (res && typeof res === "string") {
        if (res.replace(/\s/g, "").length > 0) {
            n = str
                .replace(tools[tool] + assetID + "}", res.trim() + "\n")
                .trim(); //replaces the appropriate placeholder based on tool result
        } else {
            n = str.split("\n");
            let lineNum = n.indexOf(tools[tool] + assetID + "}");
            if (lineNum != -1) {
                n.splice(lineNum - 1, 2);
            }
            n = n.join("\n").trim();
        }
    } else {
        n = str.split("\n");
        let lineNum = n.indexOf(tools[tool] + assetID + "}");
        if (lineNum != -1) {
            n.splice(lineNum - 1, 2);
        }
        n = n.join("\n").trim();
    }
    document.getElementById("ToolRes2").value = n; //sets the box value to the new value with the tool result inserted in place of the tag
}

function saveLastCase() {
    saveNotes("previousNotes");
}

function saveNotes(name) {
    if (document.getElementById("callDet2").value.length >= 1) {
        let noteFields = {};

        let textAreas = document.querySelectorAll("textArea");
        let inputs = document.querySelectorAll("input");
        let selects = document.querySelectorAll("select");

        for (textArea in textAreas) {
            noteFields[textAreas[textArea].id] = textAreas[textArea].value;
        }
        for (input in inputs) {
            noteFields[inputs[input].id] = inputs[input].value;
        }
        for (select in selects) {
            noteFields[selects[select].id] = selects[select].value;
        }

        localStorage.setItem(name, JSON.stringify(noteFields));
    }
}

function loadNotes(name) {
    if (typeof name == "object") {
        name = name.innerText;
    }
    let noteList = JSON.parse(localStorage.getItem(name));
    try {
        SideModalClose("Load");
    } catch (exception) {}
    for (note in noteList) {
        if (note != "") {
            try {
                document.getElementById(note).value = noteList[note];
            } catch (error) {}
        }
    }
}

function manualSave() {
    let now = new Date();
    let name = prompt("Save notes as:", now.getTime());
    if (name != null) {
        saveNotes(name);
    }
}

function manualLoad() {
    let loadDialog = document.getElementById("savedNotes");
    let num = loadDialog.querySelectorAll("button.accordion").length;
    for (let i = 0; i < num; i++) {
        loadDialog.removeChild(
            loadDialog.querySelectorAll("button.accordion")[0]
        );
    }
    let button;
    for (note in localStorage) {
        if (
            typeof localStorage[note] == "string" &&
            !ignoreList.includes(note)
        ) {
            button = document.createElement("button");
            button.innerText = note;
            button.className = "accordion";
            button.onclick = function () {
                loadNotes(this);
            };
            loadDialog.appendChild(button);
            button = 0;
        }
    }
    Template("Load");
}

let autoSaveID = setInterval(function () {
    saveNotes("autoSave");
}, autoSaveInterval * 1000);

function addLoadingElements() {
    if (!document.getElementById("Modal_Load")) {
        let loadModal = document.createElement("div");
        loadModal.innerHTML =
            '<div id="Modal_Load" class="modal_right"><div class="modal_right-content" style= "height : 100%"><span class="close" onclick="SideModalClose(\'Load\')"></span><div class= "H2"><strong>Choose Saved Case to Load</strong></div><br><div class="containerside" id="savedNotes"><button class="accordiontitle">Saved Cases</button></div><div class="containerside3" id="areadebotones"><div class="row"><button class="boton_n bClose" onclick="SideModalClose(\'Load\')"><span>CLOSE </span></button></div></div></div></div>';
        document.body.appendChild(loadModal);
    }
    let headerContainer = document.getElementsByClassName("container-header");

    let headerText =
        headerContainer[0].children[headerContainer[0].children.length - 1];
    headerContainer[0].children[
        headerContainer[0].children.length - 1
    ].remove();

    if (!document.querySelector("[title='Load Previous Notes']")) {
        headerContainer[0].innerHTML += `<div class="icon-top headertext" title="Load Previous Notes">
        <i
            style="float: right; margin-top: 5px; margin-right: 10px"
            class="fas fa-sync"
            onclick="loadNotes('previousNotes')"
        ></i>
    </div>`;
    }
    if (!document.querySelector("[title='Load Autosaved Notes']")) {
        headerContainer[0].innerHTML += `<div class="icon-top headertext" title="Load Autosaved Notes">
        <i
            style="float: right; margin-top: 5px; margin-right: 10px"
            class="fas fa-redo"
            onclick="loadNotes('autoSave')"
        ></i>
    </div>`;
    }
    if (!document.querySelector("[title='Load Saved Notes Notes']")) {
        headerContainer[0].innerHTML += `<div class="icon-top headertext" title="Load Saved Notes">
        <i
            style="float: right; margin-top: 5px; margin-right: 10px"
            class="fas fa-upload"
            onclick="manualLoad()"
        ></i>
    </div>`;
    }
    if (!document.querySelector("[title='Save Notes As']")) {
        headerContainer[0].innerHTML += `<div class="icon-top headertext" title="Save Notes As">
        <i
            style="float: right; margin-top: 5px; margin-right: 10px"
            class="fas fa-download"
            onclick="manualSave()"
        ></i>
    </div>`;
    }

    headerContainer[0].appendChild(headerText);
}

let baseline = `Click here to start documenting your interaction.

Each line must start with a timestamp. You can use the F5 key on your keyboard to automatically jump a line and add a timestamp.`;

let dir = true;

// let chars =
// "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()";

let index = 0;

let pause = 0;
let pauseDir = 600;

let replaceChar = "*";

function placeholderAnimator() {
    if (document.getElementById("callDet2")) {
        let temp = document.getElementById("callDet2").placeholder.split("");
        let i = 0;
        index = Math.floor(Math.random() * (baseline.length + 1));
        if (pause > 0) pause--;
        if (pause == 0) {
            if (dir) {
                while (
                    document.getElementById("callDet2").placeholder[index] ==
                        replaceChar ||
                    document.getElementById("callDet2").placeholder[index] ==
                        "\n" ||
                    document.getElementById("callDet2").placeholder[index] ==
                        " " ||
                    i < 100
                ) {
                    index = Math.floor(Math.random() * (baseline.length + 1));
                    i++;
                }
                temp[index] = replaceChar;
                document.getElementById("callDet2").placeholder = temp.join("");
            } else {
                while (
                    document.getElementById("callDet2").placeholder[index] ==
                        baseline[index] ||
                    i < 100
                ) {
                    index = Math.floor(Math.random() * (baseline.length + 1));
                    i++;
                }
                temp[index] = baseline[index];
                document.getElementById("callDet2").placeholder = temp.join("");
            }
        }
        if (
            (document.getElementById("callDet2").placeholder == baseline ||
                document
                    .getElementById("callDet2")
                    .placeholder.split("")
                    .every((a) => a == replaceChar || a == "\n" || a == " ")) &&
            pause == 0
        ) {
            pause = pauseDir;
            dir = !dir;
        }
        // console.log(index)
    }
    if (placeholderAnimation) {
        requestAnimationFrame(placeholderAnimator);
    }
}

function tableParse(HTMLtable) {
    let output = "";
    for (let row = 0; row < HTMLtable.rows.length; row++) {
        for (let cell = 0; cell < HTMLtable.rows[row].cells.length; cell++) {
            output += `${HTMLtable.rows[row].cells[cell].innerText.trim()}\t`;
        }
        output = output.trim() + "\n";
    }
    return output.trim();
}
if (placeholderAnimation) {
    requestAnimationFrame(placeholderAnimator);
}

function addSettings() {
    let sep = document.createElement("div");
    sep.classList += "nav-rightseparador";
    sep.innerText = "|";
    document.getElementById("navBar").appendChild(sep);

    let settingButton = document.createElement("a");
    settingButton.classList += "nav-right";
    settingButton.innerText = "Settings";
    settingButton.onclick = settingsPopup;
    document.getElementById("navBar").appendChild(settingButton);

    let test = document.createElement("style");
    test.innerHTML = `input[type="checkbox"]:before {display: none;} input[type="checkbox"]:checked:after {display: none;}`;
    document.head.appendChild(test);
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        addLoadingElements();
        addSettings();
    },
    false
);

function settingsPopup() {
    if (!document.getElementById("settingHolder")) {
        let settingsEditor = document.createElement("div");

        settingsEditor.style.padding = "8px";
        settingsEditor.style.color = "var(--color-02)";
        settingsEditor.style.position = "absolute";
        settingsEditor.style.transform = "translate(-50%, -50%)";
        settingsEditor.style.left = "50%";
        settingsEditor.style.top = "50%";
        settingsEditor.style.width = "350px";
        settingsEditor.style.height = "250px";
        settingsEditor.style.backgroundColor = "var(--color-06)";
        settingsEditor.style.borderRadius = "8px";
        settingsEditor.id = "settingsEditor";

        settingsEditor.innerHTML = `<div id="settingHolder"></div><div style="display: flex;justify-content: space-evenly;position: absolute;transform: translate(-50%, -100%);left: 50%;bottom: 0px;width: 100%;
    "><a onclick="closeSettings(true)">Save</a><a onclick="closeSettings(false)">Close</a></div>`;
        let temp;
        for (setting in toolRunnerSettings) {
            temp = document.createElement("div");
            temp.style.display = "flex";
            temp.style.justifyContent = "space-evenly";
            temp.style.margin = "8px";

            temp.innerHTML = `<label for="${setting}" style="padding:0px;">${setting}</label><input type="${toolRunnerSettings[setting].type}" id="${setting}"></input>`;
            if (toolRunnerSettings[setting].type != "checkbox") {
                temp.children[1].value = toolRunnerSettings[setting].value;
            } else if (toolRunnerSettings[setting].type == "checkbox") {
                temp.children[1].checked = toolRunnerSettings[setting].value;
            }
            settingsEditor.children[0].appendChild(temp);
        }

        document.body.appendChild(settingsEditor);
    }
}

function closeSettings(save) {
    if (save) {
        let childrenTemp = document.getElementById("settingHolder").children;
        for (let i = 0; i < childrenTemp.length; i++) {
            toolRunnerSettings[childrenTemp[i].children[0].innerText].value =
                childrenTemp[i].children[1].type == "checkbox"
                    ? childrenTemp[i].children[1].checked
                    : childrenTemp[i].children[1].value;
        }

        autoSaveInterval = toolRunnerSettings["autoSaveInterval"].value;
        getIPsecInterface = toolRunnerSettings["getIPsecInterface"].value;
        templateSeperator = toolRunnerSettings["templateSeperator"].value;
        seperationText = toolRunnerSettings["seperationText"].value;
        SHORTGWDETECT = toolRunnerSettings["SHORTGWDETECT"].value;
        placeholderAnimation = toolRunnerSettings["placeholderAnimation"].value;
        localStorage.setItem("settings", JSON.stringify(toolRunnerSettings));

        if (placeholderAnimation) {
            requestAnimationFrame(placeholderAnimator);
        }
        clearInterval(autoSaveID);
        autoSaveID = setInterval(function () {
            saveNotes("autoSave");
        }, autoSaveInterval * 1000);
    }
    document.getElementById("settingsEditor").remove();
}
