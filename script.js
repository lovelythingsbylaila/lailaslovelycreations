const itemsEl = document.getElementById('items');
const form = document.getElementById('order-form');
const errorEl = document.getElementById('form-error');
let nextId = 1;

function itemTemplate(id, style = 'carabiner') {
  return `<section class="order-item" data-id="${id}">
    <div class="item-top"><strong>Keychain <span class="item-number">${itemsEl.children.length + 1}</span></strong><button class="remove-item" type="button" aria-label="Remove keychain">Remove</button></div>
    <div class="form-grid">
      <label>Price & style
        <select class="style-select">
          <option value="keyring" ${style === 'keyring' ? 'selected' : ''}>$8 — The Key Ring (key ring + ribbon saying)</option>
          <option value="carabiner" ${style === 'carabiner' ? 'selected' : ''}>$8 — The Ribbon Clip (carabiner + ribbon saying)</option>
          <option value="rod" ${style === 'rod' ? 'selected' : ''}>$10 — The Letter Rod (carabiner + separate rod)</option>
        </select>
      </label>
      <label>Clip type
        <select class="clip-select">
          <option value="carabiner">Carabiner clip</option>
          <option value="keyring">Key ring with attached clip</option>
        </select>
      </label>
    </div>
    <div class="form-grid">
      <label>Ribbon color
        <select class="ribbon-select">
          <option>Pink gingham</option><option>Red gingham</option><option>Blue gingham</option><option>Yellow gingham</option><option>Green gingham</option>
        </select>
      </label>
      <label>Charm
        <select class="charm-select"><option>Cross</option><option>Star</option></select>
      </label>
    </div>
    <div class="form-grid">
      <label>Saying (up to 7 letters)
        <input class="saying-input" maxlength="14" placeholder="FAITH" required>
      </label>
      <label>Saying placement
        <select class="placement-select"><option value="ribbon">On the ribbon</option><option value="rod">On separate letter rod</option></select>
      </label>
    </div>
    <div class="form-grid">
      <label>Optional lace ribbon (+$1)
        <select class="lace-select"><option value="no">No lace ribbon</option><option value="yes">Yes, add lace ribbon (+$1)</option></select>
      </label>
      <label>Optional pearl rod (free)
        <select class="pearl-rod-select"><option value="no">No pearl rod</option><option value="yes">Yes, add pearl rod (free)</option></select>
      </label>
    </div>
    <label>Design details (optional)
      <input class="details-input" placeholder="Any small details or preferences">
    </label>
    <div class="item-price"><span>Keychain + add-ons</span><strong class="item-price-value">$8.00</strong></div>
  </section>`;
}

function addItem(style = 'carabiner') {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = itemTemplate(nextId++, style);
  const item = wrapper.firstElementChild;
  itemsEl.appendChild(item);
  item.querySelector('.remove-item').addEventListener('click', () => {
    if (itemsEl.children.length > 1) { item.remove(); renumber(); updateTotals(); }
    else { errorEl.textContent = 'Keep at least one keychain in your order.'; }
  });
  item.querySelectorAll('select,input').forEach(el => el.addEventListener('change', () => { syncItem(item); updateTotals(); }));
  item.querySelector('.saying-input').addEventListener('input', () => { errorEl.textContent = ''; });
  item.querySelector('.style-select').addEventListener('change', () => { syncItem(item); updateTotals(); });
  syncItem(item);
  renumber();
  updateTotals();
  return item;
}

function syncItem(item) {
  const style = item.querySelector('.style-select').value;
  const clip = item.querySelector('.clip-select');
  const placement = item.querySelector('.placement-select');
  if (style === 'keyring') clip.value = 'keyring';
  else clip.value = 'carabiner';
  clip.disabled = true;
  placement.value = style === 'rod' ? 'rod' : 'ribbon';
  placement.disabled = true;
  const rodOption = placement.querySelector('option[value="rod"]');
  rodOption.disabled = style !== 'rod';
  const basePrice = style === 'rod' ? 10 : 8;
  const lacePrice = item.querySelector('.lace-select')?.value === 'yes' ? 1 : 0;
  item.querySelector('.item-price-value').textContent = money(basePrice + lacePrice);
}

function renumber() {
  [...itemsEl.children].forEach((item, index) => {
    item.querySelector('.item-number').textContent = index + 1;
    item.querySelector('.remove-item').style.visibility = itemsEl.children.length > 1 ? 'visible' : 'hidden';
  });
}

function updateTotals() {
  const subtotal = [...itemsEl.children].reduce((sum, item) => sum + (item.querySelector('.style-select').value === 'rod' ? 10 : 8) + (item.querySelector('.lace-select')?.value === 'yes' ? 1 : 0), 0);
  const discount = itemsEl.children.length >= 3 ? subtotal * .10 : 0;
  document.getElementById('subtotal').textContent = money(subtotal);
  document.getElementById('discount').textContent = '−' + money(discount);
  document.getElementById('total').textContent = money(subtotal - discount);
}
function money(n) { return '$' + n.toFixed(2); }

document.getElementById('add-item').addEventListener('click', () => addItem());
document.querySelectorAll('.add-style').forEach(button => button.addEventListener('click', () => {
  addItem(button.dataset.style);
  document.getElementById('order').scrollIntoView({behavior:'smooth'});
}));
addItem();

form.addEventListener('submit', event => {
  event.preventDefault();
  errorEl.textContent = '';
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  if (!name || !phone) { errorEl.textContent = 'Please enter your name and phone number.'; return; }

  try {
  const orders = [...itemsEl.children].map((item, index) => {
    const style = item.querySelector('.style-select').value;
    const clip = item.querySelector('.clip-select').value;
    const ribbon = item.querySelector('.ribbon-select').value;
    const charm = item.querySelector('.charm-select').value;
    const saying = item.querySelector('.saying-input').value.trim();
    const placement = item.querySelector('.placement-select').value;
    const details = item.querySelector('.details-input').value.trim();
    const lace = item.querySelector('.lace-select')?.value === 'yes';
    const pearlRod = item.querySelector('.pearl-rod-select')?.value === 'yes';
    const letters = saying.replace(/\s/g, '').length;
    if (!saying) throw new Error(`Please enter a saying for keychain ${index + 1}.`);
    if (letters > 7) throw new Error(`The saying for keychain ${index + 1} must be 7 letters or fewer (spaces don’t count).`);
    if (style === 'keyring' && (clip !== 'keyring' || placement !== 'ribbon')) throw new Error(`The Key Ring uses a key ring and ribbon saying.`);
    if (style === 'carabiner' && (clip !== 'carabiner' || placement !== 'ribbon')) throw new Error(`The Ribbon Clip uses a carabiner and ribbon saying.`);
    if (style === 'rod' && (clip !== 'carabiner' || placement !== 'rod')) throw new Error(`The Letter Rod uses a carabiner and separate letter rod.`);
    const styleName = style === 'keyring' ? '$8 The Key Ring' : style === 'carabiner' ? '$8 The Ribbon Clip' : '$10 The Letter Rod';
    return `${index + 1}. ${styleName}; clip: ${clip === 'keyring' ? 'key ring with attached clip' : 'carabiner'}; ribbon: ${ribbon}; lace ribbon: ${lace ? 'Yes (+$1)' : 'No'}; pearl rod: ${pearlRod ? 'Yes (free)' : 'No'}; charm: ${charm}; saying: "${saying}"; placement: ${placement === 'rod' ? 'separate letter rod' : 'ribbon'}${details ? '; details: ' + details : ''}`;
  });
    const lines = orders;
    const subtotal = [...itemsEl.children].reduce((sum, item) => sum + (item.querySelector('.style-select').value === 'rod' ? 10 : 8) + (item.querySelector('.lace-select')?.value === 'yes' ? 1 : 0), 0);
    const discount = itemsEl.children.length >= 3 ? subtotal * .10 : 0;
    const total = subtotal - discount;
    const message = `Hi! I'd love to order from Laila's Lovely Creations!

CUSTOMER
Name: ${name}
Phone: ${phone}

MY KEYCHAINS
${lines.join('\n')}

ORDER TOTAL
Subtotal: ${money(subtotal)}
Discount: ${money(discount)}
Estimated total: ${money(total)}

Preferred contact: ${document.getElementById('contact-method').value}
Payment preference: ${document.getElementById('payment-method').value}
Special requests: ${document.getElementById('special-requests').value.trim() || 'None'}
Pickup: Local meetup (to be coordinated)

Please confirm my order before I send payment. Thank you! ♡`;
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending order...';
    }
    fetch('https://formsubmit.co/ajax/lovelythingsbylaila@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `New Laila's Lovely Creations order from ${name}`,
        customer_name: name,
        customer_phone: phone,
        order_details: message
      })
    })
      .then(response => {
        if (!response.ok) throw new Error('The order could not be sent right now.');
        return response.json();
      })
      .then(data => {
        if (data.success === 'true' || data.success === true) {
          form.reset();
          itemsEl.innerHTML = '';
          addItem();
          errorEl.textContent = 'Your order request was sent! Please wait for Laila to confirm it before paying. ♡';
          errorEl.classList.add('success-message');
        } else {
          throw new Error('The order could not be sent right now. Please try again or contact Laila directly.');
        }
      })
      .catch(() => {
        errorEl.textContent = 'We couldn’t send your order. Please try again in a moment or contact Laila directly.';
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Send Order';
        }
      });
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
