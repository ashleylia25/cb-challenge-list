function loadList() {
  fetch("./levels.json")
    .then(r => r.json())
    .then(levels => {
      const table = document.getElementById("list");
      if (!table) return;
      table.innerHTML = "";
      levels.forEach(l => {
        let rankClass = "";
        if(l.rank === 1) rankClass = "top1";
        else if(l.rank === 2) rankClass = "top2";
        else if(l.rank === 3) rankClass = "top3";
        else if(l.rank <= 10) rankClass = "top10";
        else if(l.rank <= 50) rankClass = "top50";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td><span class="rank ${rankClass}">#${l.rank}</span></td>
          <td><a href="./level.html?id=${l.id}" class="levelName">${l.name}</a></td>
          <td>${l.creator}</td>
        `;
        table.appendChild(row);
      });
    });

  const searchInput = document.getElementById("search");
  if (!searchInput) return;
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const table = document.getElementById("list");
    Array.from(table.rows).forEach(row => {
      const levelName = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
      const creator = row.querySelector("td:nth-child(3)").textContent.toLowerCase();
      row.style.display = (levelName.includes(filter) || creator.includes(filter)) ? "" : "none";
    });
  });
}

function loadLevel() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  fetch("./levels.json")
    .then(r => r.json())
    .then(levels => {
      const level = levels.find(l => l.id == id);
      if (!level) return;
      localStorage.setItem("levels", JSON.stringify(levels));
      document.getElementById("levelName").textContent = `#${level.rank} - ${level.name}`;
      document.getElementById("creator").textContent = level.creator;
      document.getElementById("verifier").textContent = level.verifier;
      document.getElementById("rank").textContent = "#" + level.rank;
      document.getElementById("points").textContent = level.points + " pts";

      const videoContainer = document.getElementById("videoContainer");
      if (videoContainer && level.video) {
        const embed = level.video.replace("watch?v=", "embed/");
        videoContainer.innerHTML = `<iframe width="700" height="400" src="${embed}" frameborder="0" allowfullscreen></iframe>`;
      }
    });

  fetch("./records.json")
    .then(r => r.json())
    .then(records => {
      const table = document.getElementById("records");
      if (!table) return;
      table.innerHTML = "";
      records
        .filter(r => r.level_id == id)
        .filter(r => {
          const level = JSON.parse(localStorage.getItem("levels")).find(l => l.id == id);
          return r.player !== level.verifier;
        })
        .forEach(rec => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${rec.player}</td>
            <td><a href="${rec.video}" target="_blank">Video</a></td>
          `;
          table.appendChild(row);
        });
    });
}

function calculateScores() {
  const scores = {};
  let players = [];

  fetch("./levels.json")
    .then(r => r.json())
    .then(levels => {
      fetch("./records.json")
        .then(r => r.json())
        .then(records => {

          records.forEach(r => { if (!players.includes(r.player)) players.push(r.player); });
          levels.forEach(l => { if (!players.includes(l.verifier)) players.push(l.verifier); });

          players.forEach(p => scores[p] = 0);
          levels.forEach(l => { scores[l.verifier] += l.points; });
          records.forEach(r => {
            const level = levels.find(l => l.id == r.level_id);
            if (!level) return;
            if (r.player !== level.verifier) scores[r.player] += level.points;
          });

          const leaderboard = Object.entries(scores).sort((a,b) => b[1]-a[1]);
          const table = document.getElementById("playersList");
          if (!table) return;
          table.innerHTML = "";

          leaderboard.forEach(([player, pts], idx) => {
            let rankClass = "";
            if (idx === 0) rankClass = "top1";
            else if (idx === 1) rankClass = "top2";
            else if (idx === 2) rankClass = "top3";

            const row = document.createElement("tr");
            row.innerHTML = `
              <td><span class="rank ${rankClass}">#${idx + 1}</span></td>
              <td class="playerName" data-player="${player}">${player}</td>
              <td>${pts} pts</td>
            `;
            table.appendChild(row);
          });

          document.querySelectorAll(".playerName").forEach(el => {
            el.addEventListener("click", () => {
              showPlayerStats(el.dataset.player, levels, records);
            });
          });
        });
    });
}

function showPlayerStats(player, levels, records) {
  const completedLevels = records
    .filter(r => r.player === player)
    .filter(r => r.player !== levels.find(l => l.id == r.level_id).verifier)
    .map(r => levels.find(l => l.id == r.level_id));

  const verifiedLevels = levels.filter(l => l.verifier === player);
  const createdLevels = levels.filter(l => l.creator === player);

  let totalPoints = 0;
  verifiedLevels.forEach(l => totalPoints += l.points);
  completedLevels.forEach(l => totalPoints += l.points);

  document.getElementById("modalPlayerName").textContent = player;
  document.getElementById("modalPoints").textContent = totalPoints;
  document.getElementById("modalCompletedCount").textContent = completedLevels.length;
  document.getElementById("modalVerifiedCount").textContent = verifiedLevels.length;
  document.getElementById("modalCreatedCount").textContent = createdLevels.length;

  const completedList = document.getElementById("modalCompletedList");
  completedList.innerHTML = "";
  completedLevels.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="./level.html?id=${l.id}">#${l.rank} - ${l.name} (${l.points})</a>`;
    completedList.appendChild(li);
  });

  const verifiedList = document.getElementById("modalVerifiedList");
  verifiedList.innerHTML = "";
  verifiedLevels.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="./level.html?id=${l.id}">#${l.rank} - ${l.name}</a>`;
    verifiedList.appendChild(li);
  });

  const createdList = document.getElementById("modalCreatedList");
  createdList.innerHTML = "";
  createdLevels.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="./level.html?id=${l.id}">#${l.rank} - ${l.name}</a>`;
    createdList.appendChild(li);
  });

  document.getElementById("playerModal").style.display = "block";
}

function setupModal() {
  const modal = document.getElementById("playerModal");
  const closeBtn = document.getElementById("closeModal");

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}