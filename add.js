// 초기 데이터 설정 (LocalStorage 기본값)
const defaultData = {
  about: "NOLIMIT은 대한민국 최고의 에너지와 열정을 가진 얼티밋 프리즈비(Ultimate Frisbee) 팀입니다. 우리는 한계 없는 도전을 이어가며, 스포츠맨십과 스피릿 오브 더 게임(Spirit of the Game)을 최우선으로 여깁니다.",
  members: [
    { id: 1, name: "홍길동", number: "07", position: "Handler" },
    { id: 2, name: "김철수", number: "11", position: "Cutter" },
    { id: 3, name: "이영희", number: "23", position: "Handler / Cutter" }
  ],
  questions: [],
  schedules: []
};

let scheduleViewDate = new Date();
let selectedScheduleDate = "";

// LocalStorage에서 데이터 불러오기
function getData() {
  const data = localStorage.getItem("nolimit_data");
  const parsedData = data ? JSON.parse(data) : { ...defaultData };
  parsedData.members = Array.isArray(parsedData.members) ? parsedData.members : [...defaultData.members];
  parsedData.questions = Array.isArray(parsedData.questions) ? parsedData.questions : [];
  parsedData.schedules = Array.isArray(parsedData.schedules) ? parsedData.schedules : [];
  return parsedData;
}

// LocalStorage에 데이터 저장하기
function saveData(data) {
  localStorage.setItem("nolimit_data", JSON.stringify(data));
}

function showAdminStatus(message) {
  const statusElem = document.getElementById("admin-status");
  if (!statusElem) return;

  statusElem.textContent = message;
  window.clearTimeout(showAdminStatus.timeoutId);
  showAdminStatus.timeoutId = window.setTimeout(() => {
    statusElem.textContent = "";
  }, 3000);
}

function showQuestionStatus(message) {
  const statusElem = document.getElementById("question-status");
  if (!statusElem) return;

  statusElem.textContent = message;
  window.clearTimeout(showQuestionStatus.timeoutId);
  showQuestionStatus.timeoutId = window.setTimeout(() => {
    statusElem.textContent = "";
  }, 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 사용자 페이지 Render
function renderUserPage() {
  const data = getData();

  // 소개글 업데이트
  const aboutElem = document.getElementById("user-about");
  if (aboutElem) {
    aboutElem.innerText = data.about;
  }

  // 선수 목록 업데이트
  const memberListElem = document.getElementById("user-member-list");
  if (memberListElem) {
    memberListElem.innerHTML = data.members.map(m => `
      <div class="member-card">
        <div class="member-number">#${m.number}</div>
        <div class="member-name">${m.name}</div>
        <div class="member-position">${m.position}</div>
      </div>
    `).join("");
  }

  renderUserQuestions(data.questions);
}

function toggleRoster() {
  const memberListElem = document.getElementById("user-member-list");
  const toggleButton = document.getElementById("toggle-roster-button");
  if (!memberListElem || !toggleButton) return;

  const isHidden = memberListElem.hidden;
  memberListElem.hidden = !isHidden;
  memberListElem.classList.toggle("is-hidden", !isHidden);
  toggleButton.setAttribute("aria-expanded", String(isHidden));
  toggleButton.textContent = isHidden ? "선수 소개 닫기" : "선수 소개";
}

function renderUserQuestions(questions) {
  const questionListElem = document.getElementById("user-question-list");
  if (!questionListElem) return;

  if (!questions.length) {
    questionListElem.innerHTML = '<p class="qa-empty">등록된 질문이 없습니다.</p>';
    return;
  }

  questionListElem.innerHTML = questions.slice().reverse().map(question => `
    <article class="question-item">
      <p class="question-meta">${escapeHtml(question.author)}님의 질문</p>
      <p class="question-text">${escapeHtml(question.text)}</p>
      <div class="answer-box ${question.answer ? "" : "unanswered"}">
        <strong>답변</strong>
        <p>${question.answer ? escapeHtml(question.answer) : "관리자가 답변을 준비 중입니다."}</p>
      </div>
    </article>
  `).join("");
}

function formatScheduleDate(dateValue) {
  const [year, month, day] = dateValue.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function getScheduleDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function renderSchedulePage() {
  const data = getData();
  const viewYear = scheduleViewDate.getFullYear();
  const viewMonth = scheduleViewDate.getMonth();
  const monthLabel = document.getElementById("schedule-month-label");
  const calendarElem = document.getElementById("schedule-calendar");

  if (!monthLabel || !calendarElem) return;

  monthLabel.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  if (!selectedScheduleDate || !selectedScheduleDate.startsWith(monthPrefix)) {
    selectedScheduleDate = data.schedules.find(schedule => schedule.date.startsWith(monthPrefix))?.date || "";
  }
  const scheduleDates = new Set(data.schedules.map(schedule => schedule.date));
  const cells = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push('<div class="calendar-day is-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = getScheduleDateKey(viewYear, viewMonth, day);
    const hasSchedule = scheduleDates.has(dateKey);
    const isSelected = selectedScheduleDate === dateKey;
    cells.push(`
      <button type="button" class="calendar-day ${hasSchedule ? "has-schedule" : ""} ${isSelected ? "is-selected" : ""}" onclick="selectScheduleDate('${dateKey}')">
        <span class="calendar-day-number">${day}</span>
        ${hasSchedule ? '<span class="calendar-dot" aria-label="일정 있음"></span>' : ""}
      </button>
    `);
  }

  calendarElem.innerHTML = cells.join("");
  renderScheduleList(data.schedules, selectedScheduleDate, data.members);
}

function changeScheduleMonth(offset) {
  scheduleViewDate = new Date(scheduleViewDate.getFullYear(), scheduleViewDate.getMonth() + offset, 1);
  selectedScheduleDate = "";
  renderSchedulePage();
}

function selectScheduleDate(dateKey) {
  selectedScheduleDate = dateKey;
  renderSchedulePage();
}

function renderScheduleList(schedules, dateFilter, members = getData().members) {
  const scheduleListElem = document.getElementById("schedule-list");
  if (!scheduleListElem) return;

  const visibleSchedules = schedules
    .filter(schedule => !dateFilter || schedule.date === dateFilter)
    .sort((first, second) => `${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`));

  if (!visibleSchedules.length) {
    scheduleListElem.innerHTML = '<p class="qa-empty">선택한 날짜에 등록된 일정이 없습니다.</p>';
    return;
  }

  scheduleListElem.innerHTML = visibleSchedules.map(schedule => {
    const presentCount = schedule.votes.filter(vote => vote.status === "present").length;
    const absentVotes = schedule.votes.filter(vote => vote.status === "absent");
    const presentVotes = schedule.votes.filter(vote => vote.status === "present");
    const memberOptions = members.length
      ? members.map(member => `<option value="${escapeHtml(member.name)}">${escapeHtml(member.name)} (#${escapeHtml(member.number)})</option>`).join("")
      : '<option value="">관리자가 먼저 선수를 등록해주세요</option>';
    return `
      <article class="schedule-item">
        <h3>${escapeHtml(schedule.title)}</h3>
        <p class="schedule-meta">${formatScheduleDate(schedule.date)} · ${escapeHtml(schedule.time)} · ${escapeHtml(schedule.location)}</p>
        <form class="schedule-vote" onsubmit="event.preventDefault()">
          <div class="form-group">
            <label>선수 선택</label>
            <select required ${members.length ? "" : "disabled"}>
              <option value="">이름을 선택하세요</option>
              ${memberOptions}
            </select>
          </div>
          <div class="vote-buttons">
            <button type="button" class="vote-button present" ${members.length ? "" : "disabled"} onclick="submitScheduleVote(event, ${schedule.id}, 'present')">참석</button>
            <button type="button" class="vote-button absent" ${members.length ? "" : "disabled"} onclick="submitScheduleVote(event, ${schedule.id}, 'absent')">불참</button>
          </div>
        </form>
        <p class="vote-summary">참석 ${presentVotes.length}명 · 불참 ${absentVotes.length}명</p>
        <div class="attendance-list"><strong>참석:</strong> ${presentVotes.length ? presentVotes.map(vote => escapeHtml(vote.name)).join(", ") : "없음"}<br><strong>불참:</strong> ${absentVotes.length ? absentVotes.map(vote => escapeHtml(vote.name)).join(", ") : "없음"}</div>
      </article>
    `;
  }).join("");
}

function submitScheduleVote(event, scheduleId, status) {
  const form = event.target.closest(".schedule-vote");
  const memberSelect = form.querySelector("select");
  const name = memberSelect.value;
  if (!name) return;

  const data = getData();
  const schedule = data.schedules.find(item => item.id === scheduleId);
  if (!schedule) return;

  const existingVote = schedule.votes.find(vote => vote.name === name);
  if (existingVote) {
    existingVote.status = status;
  } else {
    schedule.votes.push({ name, status });
  }
  saveData(data);
  renderSchedulePage();
}

function submitQuestion(event) {
  event.preventDefault();
  const authorInput = document.getElementById("question-author");
  const questionInput = document.getElementById("question-text");
  const author = authorInput.value.trim();
  const text = questionInput.value.trim();
  if (!author || !text) return;

  const data = getData();
  data.questions.push({
    id: Date.now(),
    author,
    text,
    answer: "",
    createdAt: new Date().toISOString()
  });
  saveData(data);
  document.getElementById("question-form").reset();
  renderUserQuestions(data.questions);
  showQuestionStatus("질문이 등록되었습니다.");
}

// 관리자 페이지 Render
function renderAdminPage() {
  const data = getData();

  // 소개글 폼 설정
  const aboutInput = document.getElementById("admin-about-input");
  if (aboutInput) {
    aboutInput.value = data.about;
  }

  // 선수 목록 테이블
  const adminMemberTable = document.getElementById("admin-member-table");
  if (adminMemberTable) {
    adminMemberTable.innerHTML = data.members.map(m => `
      <tr>
        <td>#${m.number}</td>
        <td>${m.name}</td>
        <td>${m.position}</td>
        <td>
          <button class="btn btn-danger" onclick="deleteMember(${m.id})">삭제</button>
        </td>
      </tr>
    `).join("");
  }

  renderAdminQuestions(data.questions);
  renderAdminSchedules(data.schedules);
}

function showScheduleAdminStatus(message) {
  const statusElem = document.getElementById("schedule-admin-status");
  if (!statusElem) return;

  statusElem.textContent = message;
  window.clearTimeout(showScheduleAdminStatus.timeoutId);
  showScheduleAdminStatus.timeoutId = window.setTimeout(() => {
    statusElem.textContent = "";
  }, 3000);
}

function addSchedule(event) {
  event.preventDefault();
  const date = document.getElementById("schedule-date").value;
  const time = document.getElementById("schedule-time").value;
  const title = document.getElementById("schedule-title").value.trim();
  const location = document.getElementById("schedule-location").value.trim();
  if (!date || !time || !title || !location) return;

  const data = getData();
  data.schedules.push({
    id: Date.now(),
    date,
    time,
    title,
    location,
    votes: []
  });
  saveData(data);
  document.getElementById("add-schedule-form").reset();
  renderAdminSchedules(data.schedules);
  showScheduleAdminStatus("연습 일정이 등록되었습니다.");
}

function renderAdminSchedules(schedules) {
  const scheduleListElem = document.getElementById("admin-schedule-list");
  if (!scheduleListElem) return;

  const sortedSchedules = schedules.slice().sort((first, second) => `${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`));
  if (!sortedSchedules.length) {
    scheduleListElem.innerHTML = '<p class="qa-empty">등록된 연습 일정이 없습니다.</p>';
    return;
  }

  scheduleListElem.innerHTML = sortedSchedules.map(schedule => {
    const present = schedule.votes.filter(vote => vote.status === "present").map(vote => escapeHtml(vote.name));
    const absent = schedule.votes.filter(vote => vote.status === "absent").map(vote => escapeHtml(vote.name));
    return `
      <article class="schedule-item schedule-admin-item">
        <div>
          <h3>${escapeHtml(schedule.title)}</h3>
          <p class="schedule-meta">${formatScheduleDate(schedule.date)} · ${escapeHtml(schedule.time)} · ${escapeHtml(schedule.location)}</p>
          <p class="attendance-list">참석: ${present.length ? present.join(", ") : "없음"}<br>불참: ${absent.length ? absent.join(", ") : "없음"}</p>
        </div>
        <button type="button" class="btn btn-danger" onclick="deleteSchedule(${schedule.id})">삭제</button>
      </article>
    `;
  }).join("");
}

function deleteSchedule(scheduleId) {
  const data = getData();
  data.schedules = data.schedules.filter(schedule => schedule.id !== scheduleId);
  saveData(data);
  renderAdminSchedules(data.schedules);
  showScheduleAdminStatus("연습 일정이 삭제되었습니다.");
}

function renderAdminQuestions(questions) {
  const questionListElem = document.getElementById("admin-question-list");
  if (!questionListElem) return;

  if (!questions.length) {
    questionListElem.innerHTML = '<p class="qa-empty">등록된 질문이 없습니다.</p>';
    return;
  }

  questionListElem.innerHTML = questions.slice().reverse().map(question => `
    <form class="question-item" onsubmit="saveAnswer(event, ${question.id})">
      <p class="question-meta">${escapeHtml(question.author)}님의 질문</p>
      <p class="question-text">${escapeHtml(question.text)}</p>
      <label for="answer-${question.id}">답변</label>
      <textarea id="answer-${question.id}" rows="3" required>${escapeHtml(question.answer || "")}</textarea>
      <button type="submit" class="btn">${question.answer ? "답변 수정" : "답변 등록"}</button>
      <button type="button" class="btn btn-danger" onclick="deleteQuestion(${question.id})">질문 삭제</button>
    </form>
  `).join("");
}

function saveAnswer(event, questionId) {
  event.preventDefault();
  const answer = event.target.querySelector("textarea").value.trim();
  if (!answer) return;

  const data = getData();
  const question = data.questions.find(item => item.id === questionId);
  if (!question) return;

  question.answer = answer;
  question.answeredAt = new Date().toISOString();
  saveData(data);
  renderAdminQuestions(data.questions);
  showAdminStatus("Q&A 답변이 저장되었습니다.");
}

function deleteQuestion(questionId) {
  const data = getData();
  data.questions = data.questions.filter(question => question.id !== questionId);
  saveData(data);
  renderAdminQuestions(data.questions);
  showAdminStatus("질문이 삭제되었습니다.");
}

// 소개글 저장 함수
function saveAbout() {
  const aboutInput = document.getElementById("admin-about-input");
  const data = getData();
  data.about = aboutInput.value;
  saveData(data);
  showAdminStatus("팀 소개글 변경사항이 저장되었습니다.");
}

// 선수 추가 함수
function addMember(event) {
  event.preventDefault();
  const name = document.getElementById("member-name").value;
  const number = document.getElementById("member-number").value;
  const position = document.getElementById("member-position").value;

  if (!name || !number) return;

  const data = getData();
  data.members.push({
    id: Date.now(),
    name,
    number,
    position
  });

  saveData(data);
  document.getElementById("add-member-form").reset();
  renderAdminPage();
  showAdminStatus("새 선수가 추가되었습니다.");
}

// 선수 삭제 함수
function deleteMember(id) {
  const data = getData();
  data.members = data.members.filter(m => m.id !== id);
  saveData(data);
  renderAdminPage();
  showAdminStatus("선수 정보가 삭제되었습니다.");
}

window.addEventListener("storage", event => {
  if (event.key === "nolimit_data") {
    renderUserPage();
    renderAdminPage();
    renderSchedulePage();
  }
});