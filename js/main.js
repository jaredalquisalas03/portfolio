const b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
const set=o=>{n.classList.toggle('open',o);b.setAttribute('aria-expanded',o)};
b.addEventListener('click',()=>set(b.getAttribute('aria-expanded')!=='true'));
n.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);b.focus()}});
document.querySelectorAll('.yr').forEach(e=>e.textContent=new Date().getFullYear());
const fs=document.querySelectorAll('[data-filter]');
fs.forEach(f=>f.addEventListener('click',()=>{fs.forEach(x=>x.setAttribute('aria-pressed',x===f));
document.querySelectorAll('.card[data-cat]').forEach(c=>c.hidden=f.dataset.filter!=='all'&&c.dataset.cat!==f.dataset.filter)}));
