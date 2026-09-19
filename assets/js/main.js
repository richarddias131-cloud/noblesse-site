/* ==========================================================================
   ÓTICA NOBLESSE — comportamento do site
   Tudo que precisa ser atualizado sem mexer no layout está no CONFIG abaixo.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     CONFIG — EDITE AQUI
     ====================================================================== */
  var CONFIG = {

    /* Número no formato internacional, só dígitos (55 + DDD + número).
       Vale para todos os links de WhatsApp da página. Ao trocar o número aqui,
       lembre de atualizar também o que aparece ESCRITO no HTML (header, rodapé,
       seções de contato e localização) e nos links `tel:`. */
    whatsapp: '5534997202967',

    /* FAIXA DE INAUGURAÇÃO (topo do hero).
       A faixa aparece somente enquanto as DUAS condições valerem: `ativo`
       true E a data atual anterior a `dataFim`. Ou seja: passou do dia, some
       sozinha; e, se precisar tirar antes, basta `ativo: false` — sem mexer
       no HTML nos dois casos.
       `dataFim` usa o fuso do próprio visitante (sem "Z" no final), que é o
       comportamento certo para um evento local.
       PENDENTE: confirmar se 26/09 é a abertura da loja ou um evento de
       inauguração de uma loja que já opera (ver comentário no index.html). */
    evento: {
      ativo: true,
      dataFim: '2026-09-26T23:59:59'
    },

    /* PENDENTE — HORÁRIO DE FUNCIONAMENTO.
       Enquanto a lista estiver vazia, o site mostra "confirme pelo WhatsApp"
       em vez de inventar um horário. Para publicar o horário real, preencha:

         horario: [
           { dias: 'Segunda a sexta', horas: '9h às 18h' },
           { dias: 'Sábado',          horas: '9h às 13h' }
         ]

       Depois atualize também o JSON-LD no final do index.html (bloco
       "openingHoursSpecification") e o Google Meu Negócio, com o MESMO horário. */
    horario: [],

    /* PENDENTE — DEPOIMENTOS REAIS.
       A seção Prova Social fica oculta enquanto esta lista estiver vazia e
       não houver link do Google. Use depoimentos verdadeiros, com autorização
       do cliente. `foto` é opcional (caminho da imagem ou null).

         depoimentos: [
           { nome: 'Maria Souza', texto: 'Trocaram minha lente em dois dias...', nota: 5, foto: null }
         ] */
    depoimentos: [],

    /* PENDENTE — PERFIL NO GOOGLE MEU NEGÓCIO.
       Preencha os três campos para o selo aparecer (nota, nº de avaliações e
       link do perfil). Deixe `url` vazio para manter o selo oculto. */
    google: {
      nota: null,          // ex.: 4.9
      avaliacoes: null,    // ex.: 87
      url: ''              // ex.: 'https://g.page/r/CODIGO-DO-PERFIL'
    }
  };

  /* ====================================================================== */

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------- 1. HEADER / SCROLL */
  var header = $('#site-header');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------- 1b. FAIXA DE EVENTO */
  (function () {
    var faixa = $('#faixa-evento');
    if (!faixa) return;

    var ev = CONFIG.evento || {};
    var fim = ev.dataFim ? new Date(ev.dataFim) : null;
    var dataValida = fim && !isNaN(fim.getTime());

    if (!dataValida && window.console && console.warn) {
      console.warn('[Noblesse] CONFIG.evento.dataFim inválida: ' + ev.dataFim);
    }
    if (!ev.ativo || !dataValida || Date.now() >= fim.getTime()) return;

    faixa.hidden = false;
    // dá folga no topo do hero para a faixa não encostar no conteúdo
    document.documentElement.classList.add('evento-ativo');
  })();

  /* -------------------------------------------------------- 2. MENU MOBILE */
  var toggle = $('#menu-toggle');
  var nav = $('#nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // fecha ao clicar em um link do painel
  $$('a', nav).forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  // fecha com Esc e devolve o foco ao botão
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  // fecha ao clicar fora
  document.addEventListener('click', function (e) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  // ao voltar para o desktop, garante o painel fechado
  window.matchMedia('(min-width: 880px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ------------------------------------------ 3. REVELAÇÃO E LINK ATIVO */
  var revealItems = $$('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealItems.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      revealObs.observe(el);
    });
  }
  // avisa o watchdog do <head> que as animações estão sob controle
  window.__noblesseRevealReady = true;

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.nav-list a');
    var sections = navLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { activeObs.observe(s); });
  }

  /* ------------------------------------------------------- 4. HORÁRIO */
  if (CONFIG.horario && CONFIG.horario.length) {
    var texto = CONFIG.horario.map(function (h) { return h.dias + ': ' + h.horas; }).join(' · ');

    var wrap = $('#horario-wrap');
    $('#horario-texto').innerHTML = CONFIG.horario.map(function (h) {
      return '<span>' + h.dias + ': <strong>' + h.horas + '</strong></span>';
    }).join('<br>');
    wrap.hidden = false;

    var pendente = $('#horario-pendente');
    if (pendente) pendente.hidden = true;

    var footerH = $('#footer-horario');
    if (footerH) { footerH.textContent = texto; footerH.hidden = false; }
  }

  /* -------------------------------------------------- 5. PROVA SOCIAL */
  var secao = $('#depoimentos');
  var track = $('#testimonials-track');
  var g = CONFIG.google || {};
  var temDepoimentos = !!(CONFIG.depoimentos && CONFIG.depoimentos.length);
  var temGoogle = !!(g.url && g.nota);

  if (temDepoimentos || temGoogle) {
    secao.hidden = false;

    if (temDepoimentos) {
      track.innerHTML = CONFIG.depoimentos.map(function (d) {
        var nota = Math.max(0, Math.min(5, Math.round(d.nota || 5)));
        var estrelas = new Array(nota + 1).join('★') + new Array(6 - nota).join('☆');
        var foto = d.foto
          ? '<img src="' + d.foto + '" alt="" loading="lazy" width="40" height="40">'
          : '';
        return '' +
          '<figure class="testimonial">' +
            '<p class="stars" aria-label="Avaliação: ' + nota + ' de 5">' + estrelas + '</p>' +
            '<blockquote>“' + d.texto + '”</blockquote>' +
            '<figcaption>' + foto + '<span>' + d.nome + '</span></figcaption>' +
          '</figure>';
      }).join('');

      initCarrossel();
    } else {
      $('.testimonials').hidden = true;
    }

    if (temGoogle) {
      var badge = $('#google-badge');
      badge.href = g.url;
      $('#google-rating').textContent = String(g.nota).replace('.', ',') + ' no Google';
      $('#google-count').textContent = g.avaliacoes ? g.avaliacoes + ' avaliações' : 'Ver avaliações';
      badge.hidden = false;

      var footerG = $('#footer-google');
      if (footerG) footerG.href = g.url;
    }
  } else if (window.console && console.info) {
    console.info(
      '[Noblesse] Seção de prova social oculta: preencha CONFIG.depoimentos ' +
      'e/ou CONFIG.google em assets/js/main.js com dados reais.'
    );
  }

  function initCarrossel() {
    var prev = $('#tst-prev');
    var next = $('#tst-next');
    var dots = $('#tst-dots');
    var cards = $$('.testimonial', track);
    if (!cards.length) return;

    cards.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir para o depoimento ' + (i + 1));
      b.addEventListener('click', function () { irPara(i); });
      dots.appendChild(b);
    });

    function passo() {
      return cards[0].offsetWidth + 20; // largura do card + gap
    }
    function indiceAtual() {
      return Math.round(track.scrollLeft / passo());
    }
    function irPara(i) {
      track.scrollTo({ left: i * passo(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { irPara(Math.max(0, indiceAtual() - 1)); });
    next.addEventListener('click', function () { irPara(Math.min(cards.length - 1, indiceAtual() + 1)); });

    // navegação por teclado dentro do carrossel
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev.click(); }
    });
    track.tabIndex = 0;

    function sincronizar() {
      var i = indiceAtual();
      $$('button', dots).forEach(function (b, n) { b.classList.toggle('is-active', n === i); });
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    }
    track.addEventListener('scroll', function () {
      window.clearTimeout(track._t);
      track._t = window.setTimeout(sincronizar, 90);
    }, { passive: true });
    window.addEventListener('resize', sincronizar);
    sincronizar();
  }

  /* ------------------------------------------------------- 5a. VITRINE
     A esteira anda sozinha por CSS. Aqui fica só o botão de pausar/retomar
     (exigência de acessibilidade para conteúdo em movimento) e a economia de
     não animar com a aba em segundo plano. Sem JS, a esteira continua
     rodando normalmente — só não dá para pausar pelo botão, por isso ele
     começa oculto e o script o revela. */
  (function () {
    var esteira = $('#vitrine-esteira');
    var botao = $('#vitrine-pausa');
    if (!esteira || !botao) return;

    botao.hidden = false;

    function definir(parada) {
      esteira.classList.toggle('vitrine-parada', parada);
      botao.setAttribute('aria-pressed', String(parada));
      $('.vitrine-pausa-texto', botao).textContent = parada ? 'Retomar vitrine' : 'Pausar vitrine';
    }

    botao.addEventListener('click', function () {
      definir(botao.getAttribute('aria-pressed') !== 'true');
    });

    // aba em segundo plano: não gasta bateria animando o que ninguém vê
    document.addEventListener('visibilitychange', function () {
      if (botao.getAttribute('aria-pressed') === 'true') return; // pausa manual manda
      esteira.classList.toggle('vitrine-parada', document.hidden);
    });

    if (reduceMotion) definir(true);
  })();

  /* ------------------------------------------------ 5b. LINKS DE WHATSAPP
     O site não tem formulário: o agendamento acontece pelos links de WhatsApp
     e pelo link de telefone, que funcionam mesmo sem JavaScript (os endereços
     estão escritos no HTML). Isto aqui apenas sincroniza o NÚMERO de todos eles
     com CONFIG.whatsapp, preservando a mensagem própria de cada link — assim,
     se o número mudar, basta trocar em um lugar. */
  $$('a[href*="wa.me/"]').forEach(function (a) {
    a.setAttribute('href', a.getAttribute('href').replace(/wa\.me\/\d+/, 'wa.me/' + CONFIG.whatsapp));
  });

  /* ------------------------------------------------------------ 6. RODAPÉ */
  $('#ano').textContent = new Date().getFullYear();

})();
