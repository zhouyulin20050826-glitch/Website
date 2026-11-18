import './styles/style.css';
import './styles/theme.css';
import { header, footer } from './components/layout.js';
import { pages } from './content/pages.js';
export const page = document.body.dataset.page;
document.querySelector('#site').innerHTML=header+(pages[page]||pages.home)+footer;
const menuButton=document.querySelector('.menu-toggle'),primaryNav=document.querySelector('#primary-nav');menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));primaryNav.classList.toggle('is-open',!open);document.body.classList.toggle('menu-open',!open)});document.querySelector('.mascot-button')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

function cameraGlitch(){
  const overlay=document.createElement('div'); overlay.className='glitch-overlay'; overlay.innerHTML='<video autoplay muted playsinline></video><div class="glitch-text">SIGNAL<br>INTERRUPTED</div>'; document.body.append(overlay);
  const video=overlay.querySelector('video'); let stream;
  navigator.mediaDevices?.getUserMedia({video:{facingMode:'user'},audio:false}).then(s=>{stream=s;video.srcObject=s}).catch(()=>{video.style.display='none';overlay.querySelector('.glitch-text').innerHTML='CAMERA<br>UNAVAILABLE'});
  setTimeout(()=>{stream?.getTracks().forEach(t=>t.stop());overlay.remove()},1000);
}
document.querySelectorAll('.signal').forEach(el=>el.addEventListener('click',cameraGlitch));


if(page === 'visual') await import('./features/references.js');
if(page === 'idea') {
  await import('./styles/idea-editor.css');
  await import('./features/idea-editor.js');
}
