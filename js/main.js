/* ===== EDIT THESE ===== */
const GHL_CALENDAR_URL = "";   // paste your GHL calendar embed URL
const VIDEO_EMBED_URL = "";    // e.g. https://www.youtube.com/embed/VIDEO_ID
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
    var vidSection = document.getElementById("video-section");
    if (vidSection) vidSection.hidden = false;
    vid.textContent = "";
    var v = document.createElement("iframe");
    v.src = VIDEO_EMBED_URL; v.title = "Walkthrough video"; v.loading = "lazy"; v.allowFullscreen = true;
    vid.appendChild(v);
  }
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
        x.beginPath();x.arc(d.x,d.y,d.r,0,6.283);x.fillStyle="rgba(245,175,0,.35)";x.fill();});
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
