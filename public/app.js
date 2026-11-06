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
function filter(){if(!league||!day)return;let count=0;document.querySelectorAll('#predictions .match').forEach(row=>{const isDone=row.dataset.done==='true';row.hidden=isDone||!(league.value==='all'||row.dataset.league===league.value)||!(day.value==='all'||row.dataset.date===day.value);if(!row.hidden)count++});document.querySelectorAll('#predictions .day').forEach(section=>section.hidden=![...section.querySelectorAll('.match')].some(row=>!row.hidden));document.querySelector('#count').textContent=`${count} matchup${count===1?'':'s'}`;document.querySelector('#empty').hidden=count!==0;}
league?.addEventListener('change',filter);day?.addEventListener('change',filter);

const espnDate=document.querySelector('#espn-date');
const espnGrid=document.querySelector('#espn-grid');
const espnStatus=document.querySelector('#espn-status');
const espnCount=document.querySelector('#espn-slate-count');

const featuredSlugs={
  '401909922':'76ers-pistons-2026-11-05',
  '401909924':'bucks-celtics-2026-11-05',
  '401909930':'timberwolves-rockets-2026-11-05',
  '401909934':'lakers-kings-2026-11-05',
  '401909287':'wizards-hawks-2026-11-07',
  '401909288':'celtics-hornets-2026-11-07',
  '401909289':'76ers-cavaliers-2026-11-07',
  '401909290':'jazz-mavericks-2026-11-07',
  '401909291':'thunder-grizzlies-2026-11-07',
  '401909292':'raptors-bucks-2026-11-07',
  '401909293':'timberwolves-pelicans-2026-11-07',
  '401909294':'blazers-lakers-2026-11-07',
  '401909295':'spurs-kings-2026-11-07',
  '401909938':'nuggets-pacers-2026-11-08',
  '401909939':'nets-hawks-2026-11-08',
  '401909940':'knicks-cavaliers-2026-11-08',
  '401909941':'wizards-thunder-2026-11-08',
  '401909942':'magic-warriors-2026-11-08',
  '401909943':'rockets-suns-2026-11-08',
  '401909944':'spurs-blazers-2026-11-08',
  '401909945':'76ers-bulls-2026-11-09',
  '401909946':'lakers-pistons-2026-11-09',
  '401909947':'jazz-timberwolves-2026-11-09',
  '401909948':'nets-mavericks-2026-11-09',
  '401909949':'celtics-bucks-2026-11-09',
  '401909950':'pelicans-clippers-2026-11-09',
  '401909951':'heat-kings-2026-11-09',
  '401909952':'lakers-hawks-2026-11-10',
  '401909953':'cavaliers-hornets-2026-11-10',
  '401909954':'wizards-pistons-2026-11-10',
  '401909955':'grizzlies-raptors-2026-11-10',
  '401909956':'pacers-mavericks-2026-11-10',
  '401909957':'nuggets-rockets-2026-11-10',
  '401909958':'spurs-suns-2026-11-10',
  '401909959':'pelicans-warriors-2026-11-10',
  '401909960':'bucks-knicks-2026-11-11',
  '401909961':'celtics-76ers-2026-11-11',
  '401909962':'clippers-suns-2026-11-11',
  '401909963':'heat-jazz-2026-11-11',
  '401909964':'magic-kings-2026-11-11',
  '401909965':'thunder-blazers-2026-11-11'
};

function formatPhtTime(iso){
  return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso));
}

function setLiveStatus(msg){
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

async function syncEspnSchedule(){
  if(!espnGrid)return;
  const rawDate=(espnDate?.value||'2026-11-04').replaceAll('-','');
  try{
    const res=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${rawDate}`);
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
    const nowPht=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());
    setLiveStatus(parsed.length?`Auto-updating live · Last synced ${nowPht} PHT`:`No NBA games scheduled on ${espnDate.value} (ET).`);
  }catch{
    setLiveStatus('Auto-updating live · Philippine Standard Time (PHT)');
  }
}

if(espnGrid){
  espnDate?.addEventListener('change',syncEspnSchedule);
  espnDate?.addEventListener('input',syncEspnSchedule);
  syncEspnSchedule();
  setInterval(()=>{if(!document.hidden)syncEspnSchedule();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncEspnSchedule();});
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
  const updatePhtBadge=()=>{
    const now=new Date();
    if(phtMonthEl)phtMonthEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',month:'short'}).format(now).toUpperCase();
    if(phtDayEl)phtDayEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',day:'2-digit'}).format(now);
    if(phtYearEl)phtYearEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',year:'numeric'}).format(now);
    if(phtTimeEl)phtTimeEl.textContent=`${new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit'}).format(now)} PHT`;
  };
  updatePhtBadge();
  setInterval(updatePhtBadge,10000);
}

const archiveMatches=document.querySelectorAll('.archive-match[data-espn-id]');
function toEspnDateParam(iso){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso)).replaceAll('-','');
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
async function syncArchiveResults(){
  if(!archiveMatches.length)return;
  try{
    const dateParams=[...new Set([...archiveMatches].map(r=>{
      const iso=r.querySelector('time')?.getAttribute('datetime');
      return iso?toEspnDateParam(iso):'20261104';
    }))];
    const byId=new Map();
    for(const dp of dateParams){
      const res=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dp}`);
      if(!res.ok)continue;
      const data=await res.json();
      for(const ev of data.events||[])byId.set(String(ev.id),ev);
    }
    for(const row of archiveMatches){
      const ev=byId.get(row.dataset.espnId);
      if(!ev)continue;
      const comp=ev.competitions?.[0]||{};
      const home=comp.competitors?.find(c=>c.homeAway==='home')||{};
      const away=comp.competitors?.find(c=>c.homeAway==='away')||{};
      const isFinal=Boolean(ev.status?.type?.completed||ev.status?.type?.state==='post');
      const winComp=isFinal?(home.winner?home:(away.winner?away:null)):null;
      const loseComp=winComp?(winComp===home?away:home):null;
      const winName=winComp?.team?.displayName||'';
      const winLogo=winComp?.team?.logo||'';
      if(winName)row.dataset.winner=winName;
      const scoreText=winComp&&loseComp?`${winComp.score}–${loseComp.score}`:'';
      const label=winName?`${winName}${scoreText?` (${scoreText})`:''}`:(ev.status?.type?.shortDetail||'Pending');
      const resultEl=row.querySelector('[data-role="result-winner"]');
      if(resultEl)resultEl.textContent=label;
      const badgeEl=row.querySelector('[data-role="winner-badge"]');
      if(badgeEl){
        badgeEl.replaceChildren();
        const dot=document.createElement('span');
        dot.className='statusdot';
        badgeEl.append(dot);
        if(winLogo){
          const img=document.createElement('img');
          img.className='teamlogo';
          img.src=winLogo;
          img.alt='';
          img.width=20;
          img.height=20;
          badgeEl.append(img);
        }
        const span=document.createElement('span');
        span.append('Winner: ');
        const strong=document.createElement('strong');
        strong.textContent=label;
        span.append(strong);
        badgeEl.append(span);
      }
    }
    updateArchiveScorecard();
  }catch{
    updateArchiveScorecard();
  }
}

if(archiveMatches.length){
  updateArchiveScorecard();
  syncArchiveResults();
  setInterval(()=>{if(!document.hidden)syncArchiveResults();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncArchiveResults();});
}

const upcomingRows=document.querySelectorAll('#predictions .match[data-datetime]');
async function syncUpcomingLifecycle(){
  if(!upcomingRows.length)return;
  const now=new Date();
  const todayPht=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  let changed=false;
  for(const row of upcomingRows){
    const dt=row.dataset.datetime;
    const dKey=row.dataset.date||'';
    if((dKey&&dKey<todayPht)||(dt&&now.getTime()>=new Date(dt).getTime()+3.5*3600*1000)){
      if(row.dataset.done!=='true'){
        row.dataset.done='true';
        changed=true;
      }
    }
  }
  try{
    const dateParams=[...new Set([...upcomingRows].map(r=>r.dataset.datetime?toEspnDateParam(r.dataset.datetime):'').filter(Boolean))];
    for(const dp of dateParams){
      const res=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dp}`);
      if(!res.ok)continue;
      const data=await res.json();
      const byId=new Map((data.events||[]).map(ev=>[String(ev.id),ev]));
      for(const row of upcomingRows){
        const ev=byId.get(row.dataset.espnId);
        if(ev&&(ev.status?.type?.completed||ev.status?.type?.state==='post')){
          if(row.dataset.done!=='true'){
            row.dataset.done='true';
            changed=true;
          }
        }
      }
    }
  }catch{
    // Date-based check above still applies offline
  }
  if(changed)filter();
}

if(upcomingRows.length){
  syncUpcomingLifecycle();
  setInterval(()=>{if(!document.hidden)syncUpcomingLifecycle();},30000);
}
