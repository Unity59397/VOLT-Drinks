// VOID Storm Tracker — cart logic for the order page

const FLAVORS = {
  original: { name: 'Original', price: 2.99 },
  watermelon: { name: 'Watermelon & Lime', price: 2.99 },
  icefire: { name: 'Ice & Spiced', price: 3.29 },
};

const cart = { original: 0, watermelon: 0, icefire: 0 };

const MAX_PER_FLAVOR = 12;
const METER_CAP = 18; // total cans at which the meter reads "full"

const trackerList = document.getElementById('tracker-list');
const trackerEmpty = document.getElementById('tracker-empty');
const trackerSubtotal = document.getElementById('tracker-subtotal');
const trackerMeterFill = document.getElementById('tracker-meter-fill');
const chargeButton = document.getElementById('charge-button');

function totalCans() {
  return Object.values(cart).reduce((sum, n) => sum + n, 0);
}

function subtotal() {
  return Object.keys(cart).reduce(
    (sum, key) => sum + cart[key] * FLAVORS[key].price,
    0
  );
}

function renderQuantities() {
  document.querySelectorAll('.qty-value').forEach((el) => {
    const flavor = el.dataset.qty;
    el.textContent = cart[flavor];
  });
}

function renderTracker() {
  trackerList.querySelectorAll('.tracker-line').forEach((el) => el.remove());

  const items = Object.keys(cart).filter((key) => cart[key] > 0);

  trackerEmpty.style.display = items.length ? 'none' : 'block';

  items.forEach((key) => {
    const li = document.createElement('li');
    li.className = 'tracker-line';
    const lineTotal = (cart[key] * FLAVORS[key].price).toFixed(2);
    li.innerHTML = `
      <span class="tracker-line-name">${FLAVORS[key].name} <span class="tracker-line-qty">× ${cart[key]}</span></span>
      <span class="tracker-line-price">$${lineTotal}</span>
    `;
    trackerList.appendChild(li);
  });

  trackerSubtotal.textContent = `$${subtotal().toFixed(2)}`;

  const cans = totalCans();
  const fillPercent = Math.min((cans / METER_CAP) * 100, 100);
  trackerMeterFill.style.width = `${fillPercent}%`;

  chargeButton.disabled = cans === 0;
  chargeButton.textContent = 'CHARGE IT UP ⚡';
  chargeButton.classList.remove('charge-button--done');
}

function changeQty(flavor, delta) {
  const next = cart[flavor] + delta;
  if (next < 0 || next > MAX_PER_FLAVOR) return;
  cart[flavor] = next;
  renderQuantities();
  renderTracker();

  const card = document.querySelector(`.flavor-card[data-flavor="${flavor}"]`);
  if (delta > 0 && card) {
    card.classList.remove('flavor-card--pulse');
    // Force reflow so the animation can retrigger on rapid clicks
    void card.offsetWidth;
    card.classList.add('flavor-card--pulse');
  }
}

document.querySelectorAll('.qty-stepper').forEach((stepper) => {
  const flavor = stepper.dataset.flavor;
  stepper.querySelector('.qty-btn--minus').addEventListener('click', () => changeQty(flavor, -1));
  stepper.querySelector('.qty-btn--plus').addEventListener('click', () => changeQty(flavor, 1));
});

chargeButton.addEventListener('click', () => {
  if (totalCans() === 0) return;
  chargeButton.textContent = 'ORDER CHARGED ⚡ WE\u2019RE ON IT';
  chargeButton.classList.add('charge-button--done');
  chargeButton.disabled = true;

  setTimeout(() => {
    cart.original = 0;
    cart.watermelon = 0;
    cart.icefire = 0;
    renderQuantities();
    renderTracker();
  }, 2200);
});

renderTracker();
