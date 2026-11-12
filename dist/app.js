const menuToggle=document.querySelector('#menu-toggle'),mainNav=document.querySelector('#main-nav');
if(menuToggle&&mainNav){
  menuToggle.addEventListener('click',()=>{
    const open=menuToggle.getAttribute('aria-expanded')!=='true';
    menuToggle.setAttribute('aria-expanded',String(open));
    mainNav.classList.toggle('is-open',open);
  });
  mainNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    menuToggle.setAttribute('aria-expanded','false');
    mainNav.classList.remove('is-open');
  }));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&mainNav.classList.contains('is-open')){
      menuToggle.setAttribute('aria-expanded','false');
      mainNav.classList.remove('is-open');
      menuToggle.focus();
    }
  });
}

const league=document.querySelector('#league'),day=document.querySelector('#day');
function filter(){
  if(!league||!day)return;
  let count=0;
  document.querySelectorAll('#predictions .match').forEach(row=>{
    row.hidden=!(league.value==='all'||row.dataset.league===league.value)||!(day.value==='all'||row.dataset.date===day.value);
    if(!row.hidden)count++;
  });
  document.querySelectorAll('#predictions .day').forEach(section=>{
    section.hidden=![...section.querySelectorAll('.match')].some(row=>!row.hidden);
  });
  document.querySelector('#count').textContent=`${count} matchup${count===1?'':'s'}`;
  document.querySelector('#empty').hidden=count!==0;
}
league?.addEventListener('change',filter);
day?.addEventListener('change',filter);

const espnDate=document.querySelector('#espn-date');
const espnGrid=document.querySelector('#espn-grid');
const espnStatus=document.querySelector('#espn-status');
const espnCount=document.querySelector('#espn-slate-count');

let slugMapPromise=null;
function getFeaturedSlugs(){
  if(!slugMapPromise){
    slugMapPromise=fetch('/games.json')
      .then(r=>r.ok?r.json():[])
      .then(list=>Object.fromEntries(list.map(g=>[String(g.espnId),g.slug])))
      .catch(()=>({}));
  }
  return slugMapPromise;
}

function formatPhtTime(iso){
  return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso));
}

function setScheduleStatus(msg){
  if(!espnStatus)return;
  espnStatus.replaceChildren();
  const dot=document.createElement('span');
  dot.className='statusdot';
  espnStatus.append(dot,document.createTextNode(msg));
}

function renderScheduleCards(items){
  espnGrid.replaceChildren();
  for(const s of items){
    const card=document.createElement('article');
    card.className='sched-card';

    const head=document.createElement('div');
    head.className='sched-head';
    const timeEl=document.createElement('time');
    timeEl.dateTime=s.date;
    timeEl.textContent=`${formatPhtTime(s.date)} PHT`;
    const statusEl=document.createElement('span');
    statusEl.className='sched-status';
    statusEl.textContent=s.status;
    head.append(timeEl,statusEl);

    const teams=document.createElement('div');
    teams.className='sched-teams';

    for(const side of ['away','home']){
      const row=document.createElement('div');
      row.className='sched-team';
      if(s[`${side}Logo`]){
        const img=document.createElement('img');
        img.className='teamlogo';
        img.src=s[`${side}Logo`];
        img.alt='';
        img.width=24;
        img.height=24;
        img.loading='lazy';
        row.append(img);
      }
      const name=document.createElement('span');
      name.className='sched-name';
      name.textContent=s[side];
      if(side==='home'){
        const badge=document.createElement('small');
        badge.textContent='HOME';
        name.append(' ',badge);
      }
      const rec=document.createElement('span');
      rec.className='sched-rec';
      const scoreVal=s[`${side}Score`];
      rec.textContent=scoreVal?`${s[`${side}Record`]||''} · ${scoreVal}`:(s[`${side}Record`]||'');
      row.append(name,rec);
      teams.append(row);
    }

    const foot=document.createElement('div');
    foot.className='sched-foot';
    const venue=document.createElement('span');
    venue.textContent=s.venue||'NBA Arena';
    foot.append(venue);
    if(s.predictionSlug){
      const link=document.createElement('a');
      link.href=`/predictions/${s.predictionSlug}/`;
      link.textContent='Editorial pick →';
      foot.append(link);
    }else{
      const evId=document.createElement('span');
      evId.textContent=`Event #${s.espnId}`;
      foot.append(evId);
    }

    card.append(head,teams,foot);
    espnGrid.append(card);
  }
}

async function loadSelectedDateSchedule(){
  if(!espnGrid)return;
  const rawDate=(espnDate?.value||'2026-11-04').replaceAll('-','');
  try{
    const [featuredSlugs,res]=await Promise.all([
      getFeaturedSlugs(),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${rawDate}`)
    ]);
    if(!res.ok)throw Error();
    const data=await res.json();
    const events=data.events||[];
    const parsed=events.map(ev=>{
      const comp=ev.competitions?.[0]||{};
      const home=comp.competitors?.find(c=>c.homeAway==='home')||{};
      const away=comp.competitors?.find(c=>c.homeAway==='away')||{};
      const venueName=comp.venue?.fullName||'';
      const venueCity=comp.venue?.address?.city||'';
      const isLiveOrFinal=ev.status?.type?.state&&ev.status.type.state!=='pre';
      return {
        espnId:String(ev.id),
        date:ev.date,
        venue:[venueName,venueCity].filter(Boolean).join(', '),
        home:home.team?.displayName||'Home',
        homeLogo:home.team?.logo||'',
        homeRecord:home.records?.[0]?.summary||'',
        homeScore:isLiveOrFinal?home.score:'',
        away:away.team?.displayName||'Away',
        awayLogo:away.team?.logo||'',
        awayRecord:away.records?.[0]?.summary||'',
        awayScore:isLiveOrFinal?away.score:'',
        status:ev.status?.type?.shortDetail&&isLiveOrFinal?ev.status.type.shortDetail:(ev.status?.type?.description||'Scheduled'),
        predictionSlug:featuredSlugs[String(ev.id)]||null
      };
    });
    renderScheduleCards(parsed);
    if(espnCount)espnCount.textContent=`${parsed.length} game${parsed.length===1?'':'s'} on slate`;
    setScheduleStatus(parsed.length?`Showing slate for ${espnDate.value} (ET) · Philippine Standard Time (PHT)`:`No NBA games scheduled on ${espnDate.value} (ET).`);
  }catch{
    setScheduleStatus('Philippine Standard Time (PHT)');
  }
}

if(espnGrid){
  espnDate?.addEventListener('change',loadSelectedDateSchedule);
}

const tipAddr=document.querySelector('#tip-address');
const tipCopy=document.querySelector('#tip-copy');

tipCopy?.addEventListener('click',async()=>{
  const symbol=tipCopy.dataset.symbol||'USDT';
  const addr=tipAddr?.textContent||'';
  try{
    await navigator.clipboard.writeText(addr);
    tipCopy.textContent=`Copied ${symbol} address ✓`;
    setTimeout(()=>{tipCopy.textContent=`Copy ${symbol} address`;},2000);
  }catch{
    tipCopy.textContent='Select address above to copy';
  }
});

const phtBadge=document.querySelector('#pht-badge');
if(phtBadge){
  const phtMonthEl=document.querySelector('#pht-month');
  const phtDayEl=document.querySelector('#pht-day');
  const phtYearEl=document.querySelector('#pht-year');
  const phtTimeEl=document.querySelector('#pht-time');
  const now=new Date();
  if(phtMonthEl)phtMonthEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',month:'short'}).format(now).toUpperCase();
  if(phtDayEl)phtDayEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',day:'2-digit'}).format(now);
  if(phtYearEl)phtYearEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',year:'numeric'}).format(now);
  if(phtTimeEl)phtTimeEl.textContent=`${new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit'}).format(now)} PHT`;
}

function updateArchiveScorecard(){
  const pctEl=document.querySelector('#archive-win-pct');
  const wlEl=document.querySelector('#archive-wl-count');
  if(!pctEl||!wlEl)return;
  let wins=0,losses=0;
  document.querySelectorAll('.archive-match').forEach(row=>{
    const level=row.dataset.level||'';
    const pick=row.dataset.pick||'';
    const winner=row.dataset.winner||'';
    if(!winner||level==='No pick'||!pick||pick.toLowerCase().startsWith('wait'))return;
    if(pick===winner)wins++;
    else losses++;
  });
  const total=wins+losses;
  const pct=total?`${Math.round((wins/total)*1000)/10}%`:'0%';
  pctEl.textContent=pct;
  wlEl.textContent=`${wins} ${wins===1?'Win':'Wins'} · ${losses} ${losses===1?'Loss':'Losses'}`;
}

updateArchiveScorecard();
