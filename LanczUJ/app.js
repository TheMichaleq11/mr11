/* Obiady na Kampusie UJ — termin zwrotu dopłaty (15. dzień następnego miesiąca, przed weekendem/świętem wcześniej). */
(function () {
  "use strict";

  var MN = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
  var MG = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  var DN = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
  var FIXED = ["1-1", "1-6", "5-1", "5-3", "8-15", "11-1", "11-11", "12-24", "12-25", "12-26"];
  var MOVABLE = [0, 1, 49, 60]; // Wielkanoc, Poniedziałek Wielkanocny, Zesłanie Ducha Św., Boże Ciało
  var easterCache = {};

  function easter(y) {
    if (easterCache[y]) return easterCache[y];
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return (easterCache[y] = new Date(y, mo - 1, da));
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isHoliday(d) {
    if (FIXED.indexOf((d.getMonth() + 1) + "-" + d.getDate()) >= 0) return true;
    var e = easter(d.getFullYear());
    for (var i = 0; i < MOVABLE.length; i++) {
      if (sameDay(d, new Date(e.getFullYear(), e.getMonth(), e.getDate() + MOVABLE[i]))) return true;
    }
    return false;
  }

  function isWorkday(d) {
    var w = d.getDay();
    return w > 0 && w < 6 && !isHoliday(d);
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  /* Zwrot dopłaty: 15. dzień następnego miesiąca, cofany na ostatni dzień roboczy. */
  function payoutDate(now) {
    var d = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    while (!isWorkday(d)) d = addDays(d, -1);
    return d;
  }

  function renderRefund(now) {
    var el = document.getElementById("refund");
    if (!el) return;
    var p = payoutDate(now);
    el.textContent = "Za " + MN[now.getMonth()] + " do " + p.getDate() + " " + MG[p.getMonth()] + " (" + DN[p.getDay()] + ").";
  }

  var timer = null;
  function update() {
    var now = new Date();
    renderRefund(now);
    clearTimeout(timer);
    timer = setTimeout(update, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  }

  update();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) update(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) update(); });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
})();
