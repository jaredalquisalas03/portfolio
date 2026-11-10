/* ===== EDIT THESE ===== */
const GHL_CALENDAR_URL = "";   // paste your GHL calendar embed URL
const VIDEO_EMBED_URL = "";    // e.g. https://www.youtube.com/embed/VIDEO_ID
const CHAT_ENDPOINT = "";      // your Cloudflare Worker URL (see worker/README in README.md)
const EMAIL = "pro.alquisalas.jared@gmail.com";
/* ====================== */
(function () {
  var btn = document.querySelector(".menu-btn"), menu = document.getElementById("menu");
  function closeMenu() { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function () {
    var o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", String(o));
  });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  var cal = document.getElementById("cal");
  if (cal && GHL_CALENDAR_URL) {
    var f = document.createElement("iframe");
    f.src = GHL_CALENDAR_URL; f.title = "Book a call"; f.loading = "lazy"; cal.appendChild(f);
  }
  var vid = document.getElementById("video");
  if (vid && VIDEO_EMBED_URL) {
    vid.textContent = "";
    var v = document.createElement("iframe");
    v.src = VIDEO_EMBED_URL; v.title = "Walkthrough video"; v.loading = "lazy"; v.allowFullscreen = true;
    vid.appendChild(v);
  }

  /* ---- Assistant ---- */
  var FACTS = [
    [["service", "offer", "do you", "help"], "Jared sets up lead capture, booking and reminders, CRM pipelines, email and SMS, booking recovery, and review requests and reporting for coaches and clinics."],
    [["tool", "software", "ghl", "gohighlevel", "make"], "Jared builds in GoHighLevel and uses Make and AI workflows for extra automation."],
    [["process", "how", "work"], "The process is discover, map, build, then test and hand off with a recorded walkthrough. Async-first, with a weekly email update."],
    [["case", "project", "portfolio", "calmora", "primal", "bloom", "dental"], "Three case studies are on this site: Calmora Psychological Services, Primal Fitness Coaching, and Bloom Dental. See the Selected work section."],
    [["time", "zone", "hours", "async", "where"], "Jared is based in the Philippines and works async, with overlap for US and Australian clients by arrangement."],
    [["price", "cost", "rate", "quote", "how much"], "Pricing depends on scope. Book a call or email Jared for a quote."]
  ];
  var open = document.createElement("button");
  open.className = "chat-btn"; open.type = "button"; open.textContent = "Ask my assistant";
  open.setAttribute("aria-expanded", "false"); open.setAttribute("aria-controls", "chat");
  var box = document.createElement("div");
  box.className = "chat"; box.id = "chat"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Assistant");
  box.innerHTML = '<h2>Ask about Jared\u2019s work</h2><div class="msgs" aria-live="polite"></div><div class="chips"></div><form><input type="text" maxlength="300" placeholder="Ask a question" aria-label="Your question"><button type="submit">Send</button></form>';
  document.body.appendChild(open); document.body.appendChild(box);
  var msgs = box.querySelector(".msgs"), input = box.querySelector("input"), chips = box.querySelector(".chips");
  var history = [];

  function add(text, who, link) {
    var d = document.createElement("div"); d.className = "m " + who; d.textContent = text;
    if (link) { d.appendChild(document.createTextNode(" ")); var a = document.createElement("a"); a.href = "#book"; a.textContent = "Book a call"; a.addEventListener("click", function () { box.classList.remove("open"); }); d.appendChild(a); }
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }
  function local(q) {
    q = q.toLowerCase();
    for (var i = 0; i < FACTS.length; i++) for (var j = 0; j < FACTS[i][0].length; j++) if (q.indexOf(FACTS[i][0][j]) > -1) return FACTS[i][1];
    return "I'm not sure about that. Book a call or email " + EMAIL + ".";
  }
  async function ask(q) {
    add(q, "me"); history.push({ role: "user", content: q });
    var a;
    if (CHAT_ENDPOINT) {
      try {
        var r = await fetch(CHAT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-6) }) });
        var j = await r.json(); a = j.reply;
      } catch (e) { a = null; }
    }
    if (!a) a = local(q);
    history.push({ role: "assistant", content: a }); add(a, "bot", true);
  }
  ["What do you build?", "Which tools?", "How do you work?"].forEach(function (t) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = t;
    b.addEventListener("click", function () { ask(t); }); chips.appendChild(b);
  });
  box.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ""; ask(q);
  });
  function toggle(force) {
    var o = typeof force === "boolean" ? force : !box.classList.contains("open");
    box.classList.toggle("open", o); open.setAttribute("aria-expanded", String(o));
    if (o) { if (!msgs.children.length) add("Hi, I answer questions about Jared\u2019s services and process.", "bot"); input.focus(); }
  }
  open.addEventListener("click", function () { toggle(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
})();
(function(){
  var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var el=document.getElementById("typed");
  if(el&&!rm){
    var cmds=["new_lead --source landing_page","send_sms --delay 2m --tag primal","book_call --reminders on"],i=0,j=0,del=false;
    (function tick(){var c=cmds[i];
      if(!del){j++;el.textContent=c.slice(0,j);if(j===c.length){del=true;return setTimeout(tick,1600);}return setTimeout(tick,55);}
      j--;el.textContent=c.slice(0,j);if(j===0){del=false;i=(i+1)%cmds.length;}setTimeout(tick,25);})();
  }
  var c=document.getElementById("dots");
  if(c&&!rm){
    var x=c.getContext("2d"),w,h,p=[];
    function size(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;}
    size();addEventListener("resize",size);
    for(var k=0;k<50;k++)p.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+.6,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15});
    (function draw(){x.clearRect(0,0,w,h);
      p.forEach(function(d){d.x+=d.vx;d.y+=d.vy;if(d.x<0)d.x=w;if(d.x>w)d.x=0;if(d.y<0)d.y=h;if(d.y>h)d.y=0;
        x.beginPath();x.arc(d.x,d.y,d.r,0,6.283);x.fillStyle="rgba(255,118,27,.35)";x.fill();});
      requestAnimationFrame(draw);})();
  }
})();

(function () {
  var imgs = document.querySelectorAll('img.zoomable');
  if (!imgs.length) return;

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Enlarged image');
  var big = document.createElement('img');
  box.appendChild(big);
  document.body.appendChild(box);

  function open(img) {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    box.classList.remove('open');
    document.body.style.overflow = '';
  }

  imgs.forEach(function (img) {
    img.tabIndex = 0;
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
    });
  });

  box.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
