const page = window.location.pathname

if(page.includes("index")) loadList()
if(page.includes("level")) loadLevel()
if(page.includes("players")) loadPlayers()

function loadList(){

fetch("levels.json")
.then(r=>r.json())
.then(levels=>{

const table = document.getElementById("list")

levels.forEach(l=>{

const row=document.createElement("tr")

let rankClass = ""

if(l.rank === 1) rankClass = "top1"
else if(l.rank <= 10) rankClass = "top10"
else if(l.rank <= 50) rankClass = "top50"

row.innerHTML = `
<td class="${rankClass}">#${l.rank}</td>
<td><a href="level.html?id=${l.id}">${l.name}</a></td>
<td>${l.creator}</td>
`

table.appendChild(row)

})

})

}

function loadLevel(){

  const params = new URLSearchParams(window.location.search)
  const id = params.get("id")

  fetch("levels.json")
  .then(r=>r.json())
  .then(levels=>{
      const level = levels.find(l=>l.id==id)

      document.getElementById("levelName").textContent = level.name
      document.getElementById("creator").textContent = level.creator
      document.getElementById("verifier").textContent = level.verifier
      document.getElementById("rank").textContent = "#" + level.rank
      document.getElementById("points").textContent = level.points + " pts"

      const videoContainer = document.getElementById("videoContainer")
      const embed = level.video.replace("watch?v=","embed/")
      videoContainer.innerHTML = `<iframe width="700" height="400" src="${embed}" frameborder="0" allowfullscreen></iframe>`
  })

  fetch("records.json")
  .then(r=>r.json())
  .then(records=>{
      const table=document.getElementById("records")
      table.innerHTML = ""

      records
        .filter(r=>r.level_id==id)
        .forEach(rec=>{
            const row=document.createElement("tr")
            row.innerHTML=`
              <td>${rec.player}</td>
              <td><a href="${rec.video}">Video</a></td>
            `
            table.appendChild(row)
        })
  })
}

function loadPlayers(){

Promise.all([
fetch("levels.json").then(r=>r.json()),
fetch("records.json").then(r=>r.json())
]).then(([levels,records])=>{

const scores={}

records.forEach(r=>{

const level=levels.find(l=>l.id==r.level_id)

if(!scores[r.player]) scores[r.player]=0

scores[r.player]+=level.points

})

const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1])

const table=document.getElementById("players")

sorted.forEach((p,i)=>{

const row=document.createElement("tr")

row.innerHTML=`
<td>#${i+1}</td>
<td>${p[0]}</td>
<td>${p[1]}</td>
`

table.appendChild(row)

})

})

}