/* Keeps the bio on one screen: if the text is taller than the space
   between header and footer (small phones, short windows), the text size
   is lowered step by step until it fits. Larger screens keep the size set
   in css/style.css (--fs). */
(function(){
  var main = document.querySelector('.home');
  var bio  = document.querySelector('.bio');
  if(!main || !bio) return;

  var MIN = 9.5; // px, never smaller than this

  function fit(){
    bio.style.fontSize = '';                       // back to the CSS size
    var cs = getComputedStyle(main);
    var room = main.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var size = parseFloat(getComputedStyle(bio).fontSize);
    while(bio.scrollHeight > room && size > MIN){
      size -= 0.25;
      bio.style.fontSize = size + 'px';
    }
  }

  var t;
  function later(){ clearTimeout(t); t = setTimeout(fit, 60); }

  fit();
  window.addEventListener('resize', later);
  window.addEventListener('orientationchange', later);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
