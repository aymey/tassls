// -- manage user timetable --
if(document.cookie == "" || document.cookie == "account_id=")
    window.open("account.html",'_self');

function showLoading(URL) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loading-text').innerText = "fetching:\n" + URL;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

function hideError() {
    const errorBox = document.getElementById('errorBox');
    errorBox.style.display = 'none';
}

const URL = "https://tassls-dev-ghkk.1.us-1.fl0.io";
const TIMETABLE_ENDPOINT = "/timetable";
const STUDENT_ENDPOINT = "/students";

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function login() {
    async function sendGet(url) {
        console.log("GETting " + url)
        try {
            let res = await fetch(url)
            if(!res.ok)
                throw new Error(`fetching error: ${res.status}`)
            return res.json();
        } catch(error) {
            showError(error)
            hideLoading()
        }
    }

    const id = getCookie("account_id");
    showLoading(URL+STUDENT_ENDPOINT + "/dao/" + id)
    const account = (await sendGet(URL+STUDENT_ENDPOINT + "/dao/" + id))[0];
    hideLoading()
    if(typeof account == "undefined") {
        document.cookie = "account_id=;";
        document.getElementById("nav-account").click();
        return;
    }
    document.getElementById("nav-account").innerText = account.name;
    return account;
}

document.addEventListener('DOMContentLoaded', async function() {
    let account = await login();
    if(typeof account.timetable_id == "undefined")
        document.getElementById("nav-account").click();
    async function sendGet(url) {
        console.log("GETting " + url)
        try {
            let res = await fetch(url)
            if(!res.ok)
                throw new Error(`fetching error: ${res.status}`)
            return res.json();
        } catch(error) {
            showError(error)
            hideLoading()
            document.getElementById("nav-account").click();
        }
    }

    showLoading(URL+TIMETABLE_ENDPOINT + "/" + account.timetable_id)
    let timetable = (await sendGet(URL+TIMETABLE_ENDPOINT + "/" + account.timetable_id));
    hideLoading()
    timetableButton = timetable.data;
    createPeriods(timetable.data);
    globalTimetable = timetable.data;
});

function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

var week = 0;
var skip = 0;
function getWeekdayValue(date) {
    let start = new Date(date.getFullYear(), 0, 0);
    let diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);

    const map = [[-1, 0, 1, 2, 3, 4, -1], [-1, 5, 6, 7, 8, 9, -1]];
    if(day % 7 == 0)
        week++;
    return [map[week&1][date.getDay()], dateDiffInDays(new Date(), date)];
}

let timetableButton;
let day = new Date();
function createPeriods(timetable) {
    document.querySelectorAll('.extra').forEach(e => e.remove());
    const timetableDay = getWeekdayValue(day);
    let sign = "";
    if(timetableDay[1] > 0)
        sign = "+";
    document.getElementById("timetable-heading").innerText = "Timetable for " + day.toString().slice(0, 15) + " (" + (timetableDay[0]+1) + "/10)" + " " + sign + timetableDay[1];
    const index = timetableDay[0]*10;
    for(let i = 0; i < 10; i++) {
        // weekend
        let subjectText = "N/A"
        let roomText = "N/A"
        let teacherText = "N/A"
        if(timetableDay[0] != -1) {
            subjectText = timetable[index+i].subject;
            roomText = timetable[index+i].room;
            teacherText = timetable[index+i].teacher;
        }

        period = document.getElementsByClassName("periods")[i];
        // bad
        let subject = document.createElement('td');
        let room = document.createElement('td');
        let teacher = document.createElement('td');
        subject.className = "extra";
        room.className = "extra";
        teacher.className = "extra";
        subject.innerText = subjectText;
        room.innerText = roomText;
        teacher.innerText = teacherText;
        period.appendChild(subject);
        period.appendChild(room);
        period.appendChild(teacher);
    }
}

function TodayButtonClick() {
    day = new Date();
    createPeriods(timetableButton);
}

function NextDayButtonClick() {
    day.setDate(day.getDate() + 1)
    for(i = 0; skip && (day.getDay() == 0 || day.getDay() == 6); i++) {
        day.setDate(day.getDate() + 1)
        week+=i;
    }
    createPeriods(timetableButton);
}

function PreviousDayButtonClick() {
    day.setDate(day.getDate() - 1)
    for(i = 0; skip && (day.getDay() == 0 || day.getDay() == 6); i++) {
        day.setDate(day.getDate() - 1)
        week+=i;
    }
    createPeriods(timetableButton);
}

function toggleSlider() {
    const slider = document.querySelector('.toggle-slider');
    slider.classList.toggle('active');
    skip = !skip;
}

function tableCreate() {
    var tbl = document.createElement('table');
    tbl.id = "table-print";
    tbl.style.width = '100%';
    tbl.style.tableLayout = "auto";
    tbl.setAttribute('border', '1');

    return tbl
}

function giveHeading(label) {
    let bold = document.createElement('strong');
    let text = document.createTextNode(label);

    bold.appendChild(text);
    bold.style.textTransform = "uppercase";

    return bold;
}

function printP() {
    let save = document.body;

    document.body.outerHTML = '';

    let img = document.createElement('img');
    img.src = "logo-clear.png";
    img.alt = "logo image";
    img.style.display = "block";
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
    img.style.width = "100%";
    document.body.appendChild(img);
    for(let i = 0; i < 2; i++)
        document.body.appendChild(document.createElement("br"));


    document.body.appendChild(tableCreate());
    const table = document.getElementById("table-print");

    const header = table.insertRow();
    let dayH = header.insertCell();
    dayH.appendChild(giveHeading("day <W>"));
    let periodH = header.insertCell();
    periodH.appendChild(giveHeading("period"));
    let roomH = header.insertCell();
    roomH.appendChild(giveHeading("room"));
    let subjectH = header.insertCell();
    subjectH.appendChild(giveHeading("subject"));
    let teacherH = header.insertCell();
    teacherH.appendChild(giveHeading("teacher"));

    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    let currDay = 0;
    for(let i = 0; i < 100; i++) {
        const row = table.insertRow();

        if(i%10 == 0 && i)
            currDay++;
        let day = row.insertCell();
        day.appendChild(document.createTextNode(days[currDay%days.length] + " " + (currDay/days.length < 1 ? "A" : "B")));

        let period = row.insertCell();
        period.appendChild(document.createTextNode("Period " + ((i%10)+1)));

        let room = row.insertCell();
        room.appendChild(document.createTextNode(timetableButton[i].room));

        let subject = row.insertCell();
        subject.appendChild(document.createTextNode(timetableButton[i].subject));

        let teacher = row.insertCell();
        teacher.appendChild(document.createTextNode(timetableButton[i].teacher));
    }

    window.print();

    document.body.replaceWith(save);
}
