const $=id=>document.getElementById(id);let events=[];let alerts=0;
function now(){return new Date().toLocaleTimeString('en-GB',{hour12:false})}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addEvent(title,desc,severity='low'){events.unshift({title,desc,severity,time:now()});if(severity!=='low')alerts++;renderEvents()}
function renderEvents(){$('eventFeed').innerHTML=events.length?events.slice(0,25).map(e=>`<div class="event"><span class="event-marker ${e.severity}"></span><div><strong>${escapeHtml(e.title)}</strong><p>${escapeHtml(e.desc)}</p><span class="severity ${e.severity}">${e.severity.toUpperCase()}</span></div><time>${e.time}</time></div>`).join(''):'<p class="empty">No events yet. Refresh telemetry or try a safe scenario.</p>';$('feedCount').textContent=events.length+' EVENTS';$('alertCount').textContent=alerts}
async function refresh(){ $('monitorStatus').textContent='…';try{const r=await fetch('/api/connections');const d=await r.json();if(!r.ok)throw new Error(d.error||'Monitor unavailable');$('connectionCount').textContent=d.connections.length;$('listeningCount').textContent=d.listening_count;$('connections').innerHTML=d.connections.length?d.connections.slice(0,150).map(c=>`<tr><td>${escapeHtml(c.protocol)}</td><td>${escapeHtml(c.local)}</td><td>${escapeHtml(c.remote||'—')}</td><td>${escapeHtml(c.state)}</td><td>${escapeHtml(c.pid??'—')}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No visible connections were returned.</td></tr>';$('monitorMessage').textContent=d.note;$('lastRefresh').textContent='Updated '+now();$('monitorStatus').textContent='ON';if(d.connections.length) $('mode').textContent='LOCAL MONITOR';}catch(e){$('monitorStatus').textContent='ERROR';$('monitorMessage').textContent=e.message+' — try running with the appropriate permissions.';$('connections').innerHTML='<tr><td colspan="5" class="empty">Could not read connections. Check server console and permissions.</td></tr>'}}
document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.scenario;if(s==='scan')addEvent('Port-scan pattern (simulated)','A sample detection alert was added. No scan was sent.','high');if(s==='login')addEvent('Repeated login failures (simulated)','A sample authentication anomaly was added. No login attempts were made.','medium');if(s==='traffic')addEvent('Traffic anomaly (simulated)','A sample traffic-baseline alert was added. No traffic was generated.','high')}));
$('refreshBtn').addEventListener('click',refresh);$('resetBtn').addEventListener('click',()=>{events=[];alerts=0;renderEvents()});$('exportBtn').addEventListener('click',()=>{const rows=[['time','event','description','severity'],...events.map(e=>[e.time,e.title,e.desc,e.severity])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='cybertwin-events.csv';a.click();URL.revokeObjectURL(a.href)});
$('clock').textContent=now();setInterval(()=>$('clock').textContent=now(),1000);renderEvents();refresh();setInterval(refresh,10000);
const trafficHistory = { sent: [], received: [] };
let previousTraffic = null;

async function refreshTraffic() {
  const status = document.getElementById("trafficStatus");

  try {
    const response = await fetch("/api/traffic");
    if (!response.ok) throw new Error("Traffic API unavailable");

    const data = await response.json();

    document.getElementById("sentMB").textContent = data.sent_mb + " MB";
    document.getElementById("recvMB").textContent = data.recv_mb + " MB";

    if (previousTraffic) {
      const sentRate = Math.max(0, (data.bytes_sent - previousTraffic.sent) / 5120);
      const receivedRate = Math.max(0, (data.bytes_recv - previousTraffic.received) / 5120);

      trafficHistory.sent.push(sentRate);
      trafficHistory.received.push(receivedRate);
    } else {
      trafficHistory.sent.push(0);
      trafficHistory.received.push(0);
    }

    previousTraffic = {
      sent: data.bytes_sent,
      received: data.bytes_recv
    };

    trafficHistory.sent = trafficHistory.sent.slice(-20);
    trafficHistory.received = trafficHistory.received.slice(-20);

    drawTrafficChart();
    status.textContent = "Live system network data updated at " + now();

  } catch (error) {
    status.textContent = "Traffic data unavailable: " + error.message;
  }
}

function drawTrafficChart() {
  const canvas = document.getElementById("trafficChart");
  if (!canvas) return;

  const width = canvas.clientWidth;
  const height = 180;
  const ratio = window.devicePixelRatio || 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  const allValues = [...trafficHistory.sent, ...trafficHistory.received];
  const max = Math.max(10, ...allValues) * 1.2;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#26364c";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 3; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  function drawLine(values, color) {
    if (!values.length) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    values.forEach((value, index) => {
      const x = values.length > 1
        ? (index / (values.length - 1)) * width
        : width;

      const y = height - (value / max) * (height - 12);

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  drawLine(trafficHistory.sent, "#53e0d0");
  drawLine(trafficHistory.received, "#ffbf69");
}

refreshTraffic();
setInterval(refreshTraffic, 5000);
window.addEventListener("resize", drawTrafficChart);
