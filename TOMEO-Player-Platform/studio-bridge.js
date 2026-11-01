// Shared local workspace adapter. Google account authentication is not enabled.
(()=>{
 if(!new URLSearchParams(location.search).has('platform'))return;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 try{
  // Preserve every Lorcana deck and draft before bridge requests can replace the active draft.
  const backupKey='verso-lorcana-pre-lorcanajson-backup-v1';
  if(!localStorage.getItem(backupKey)){
   const decks={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key==='verso-lorcana-deck-v1'||key==='verso-lorcana-saved-decks-v1'||key?.startsWith('verso-lorcana-draft-'))decks[key]=localStorage.getItem(key);}
   localStorage.setItem(backupKey,JSON.stringify({savedAt:new Date().toISOString(),decks}));
  }
  const player=read('verso-player-preview-v1',null),session=read('verso-local-session-v1',null),ownerId=session?.active&&session.userId===player?.id?player.id:null;
  const requested=read('verso-studio-open-request',null);
  if(requested&&typeof requested.cards==='object'){
   const draft=read('verso-lorcana-deck-v1',null),draftOwner=read('verso-lorcana-draft-owner-id',null),library=read('verso-lorcana-saved-decks-v1',[]);
   if(ownerId&&draft&&(!draftOwner||draftOwner===ownerId)&&Object.keys(draft.cards||{}).length&&JSON.stringify(draft)!==JSON.stringify(requested)&&Array.isArray(library)&&!library.some(e=>e.ownerId===ownerId&&JSON.stringify(e.deck)===JSON.stringify(draft))){library.push({id:crypto.randomUUID(),ownerId,date:new Date().toISOString(),deck:draft});localStorage.setItem('verso-lorcana-saved-decks-v1',JSON.stringify(library));}
   const openedId=read('verso-studio-open-id',null);if(openedId)localStorage.setItem('verso-lorcana-active-deck-id',openedId);else localStorage.removeItem('verso-lorcana-active-deck-id');localStorage.removeItem('verso-studio-open-id');
   localStorage.setItem('verso-lorcana-deck-v1',JSON.stringify(requested));if(ownerId){localStorage.setItem('verso-lorcana-draft-owner-id',JSON.stringify(ownerId));localStorage.setItem(`verso-lorcana-draft-${ownerId}`,JSON.stringify(requested));}localStorage.removeItem('verso-studio-open-request');
  }
  const theme=localStorage.getItem('verso-theme')||'light';localStorage.setItem('verso-lorcana-theme',theme);document.documentElement.dataset.theme=theme;
 }catch{}
 const activeProfile=()=>{const player=read('verso-player-preview-v1',null),session=read('verso-local-session-v1',null);return session?.active&&session.userId===player?.id?player:null;};
 const parentOrigin=location.origin==='null'?'*':location.origin;
 const send=data=>{if(parent!==window)parent.postMessage(data,parentOrigin);};
 const context=value=>{
  const theme=value.theme==='dark'?'dark':'light';
  // Use the studio's own toggle so its logo, labels, and color tokens stay consistent.
  if(document.documentElement.dataset.theme!==theme){const toggle=document.getElementById('theme-toggle');if(toggle)toggle.click();else document.documentElement.dataset.theme=theme;}
  const account=document.querySelector('.user-menu-content');if(account){account.replaceChildren();const name=document.createElement('strong'),status=document.createElement('span');name.textContent=value.profile?.name||'TOMEO Player';status.textContent=value.profile?'Local profile · Google not linked':'Local workspace · Not signed in';account.append(name,status);}
  const summary=document.querySelector('.user-menu summary');if(summary){summary.setAttribute('aria-label','Player preview');summary.title='Player preview';}
  const avatar=document.querySelector('.user-avatar');if(avatar){avatar.replaceChildren();if(['hello','win','peek'].includes(value.profile?.mascot)){const image=document.createElement('img');image.src='../../TOMEO-Player-Platform/assets/verso-spirit-'+value.profile.mascot+'.webp';image.alt='';image.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';avatar.append(image);}else avatar.textContent='T';}
 };
 window.addEventListener('message',event=>{if(event.source!==parent||(location.origin!=='null'&&event.origin!==location.origin))return;if(event.data?.type==='verso-context')context(event.data);if(event.data?.type==='verso-theme')context({theme:event.data.theme,profile:activeProfile()});});
 window.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.classList.add('platform-connected');
  const css=document.createElement('link');css.rel='stylesheet';css.href='../../TOMEO-Player-Platform/studio-integration.css';document.head.append(css);
  const brand=document.querySelector('.brand');if(brand){brand.href='../../TOMEO-Player-Platform/index.html#decks';brand.setAttribute('aria-label','Back to My Deck');brand.onclick=e=>{if(parent!==window){e.preventDefault();send({type:'verso-return'});}};}
  const exit=document.createElement('a');exit.className='studio-exit';exit.href='../../TOMEO-Player-Platform/index.html#decks';exit.textContent='← My Deck';exit.setAttribute('aria-label','Exit Studio and return to My Deck');exit.onclick=e=>{if(parent!==window){e.preventDefault();send({type:'verso-return'});}};document.querySelector('.topbar')?.prepend(exit);
  const label=document.querySelector('.local-label');if(label)label.textContent='SHARED LOCAL PREVIEW';
  const toggle=document.getElementById('theme-toggle');if(toggle)toggle.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme;try{localStorage.setItem('verso-theme',theme);}catch{}send({type:'verso-theme',theme});});
  let currentTheme='light';try{currentTheme=localStorage.getItem('verso-theme')||'light';}catch{}context({theme:currentTheme,profile:activeProfile()});
  const detailId=read('verso-studio-detail-card-id',null);
  if(typeof detailId==='string'&&detailId){location.hash='cards';let attempts=0;const timer=setInterval(()=>{attempts++;if(typeof window.versoStudioOpenCard==='function'&&window.versoStudioOpenCard(detailId)){localStorage.removeItem('verso-studio-detail-card-id');localStorage.removeItem('verso-studio-detail-card-name');clearInterval(timer);send({type:'verso-studio-ready'});return;}if(attempts>=60){clearInterval(timer);send({type:'verso-studio-ready'});}},200);}
  else send({type:'verso-studio-ready'});
 });
})();
