function getDistance(cards) {
  try {
    const re = /(\d+\.?\d*)\s+mi(?!n)/;
    const distance = cards[0].innerText.match(re)[1];
    return distance;
  } catch (e) { return false; }
}

const cycle = {
  value() {
    return (cycle.distance * ((walk.lbs() * 0.2835) - 0.8853)).toFixed(0);
  },
  update(cards) {
    let distance;
    if ((distance = getDistance(cards))) {
      if (distance != cycle.distance) {
        cycle.distance = distance;
        cycle.render();
      }
    }
  },
  render() {
    cost.el.innerHTML = `<span id='calories' class='pointer'>Calories: ${cycle.value()}</span>`;
    cost.el.style.display = 'block';
    document.getElementById('calories').addEventListener('click', () => {
	    walk.lbs(prompt('Enter your weight (lbs)'));
	    cycle.render();
    });
  },
};

const walk = {
  value() {
    return (walk.distance * walk.lbs() * 0.53).toFixed(0);
  },
  lbs(lbs) {
    if (lbs) { walk.weight = lbs; }
    return walk.weight || 162;
  },
  update(cards) {
    let distance;
    if ((distance = getDistance(cards))) {
      if (distance != walk.distance) {
        walk.distance = distance;
        walk.render();
      }
    }
  },
  render() {
    cost.el.innerHTML = `<span id='calories' class='pointer'>Calories: ${walk.value()}</span>`;
    cost.el.style.display = 'block';
    document.getElementById('calories').addEventListener('click', () => {
	    walk.lbs(prompt('Enter your weight (lbs)'));
	    walk.render();
    });
  },
};

const mpg = {
  value(val) {
    if (!isNaN(val)) {
      localStorage.mpg = parseFloat(val);
    }
    return localStorage.mpg ? parseFloat(localStorage.mpg) : 20;
  },
  update() {
    mpg.value(prompt('Enter miles per gallon (mpg)'));
    drivingCost.render();
  },
};

const xhrGet = (url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('content-type', 'application/json');
  xhr.setRequestHeader('accept', '*/*');
  xhr.setRequestHeader('accept-language', 'en-US,en;q=0.9');
  xhr.setRequestHeader('authority', 'www.gasbuddy.com');
  xhr.setRequestHeader('cache-control', 'no-cache');

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      try {
        callback(xhr.responseText);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  };
  xhr.send();
};

const price = {
  regex: /\$\w?(\d+\.\d+)/g,
  lastAddress: '',
  value(val) {
    if (!isNaN(val)) {
      localStorage.price = parseFloat(val);
    }
    return localStorage.price ? parseFloat(localStorage.price) : 4.00;
  },
  update(address) {
    if (price.lastAddress === address) { return; }
    const search = encodeURI(address);
    xhrGet(`https://www.gasbuddy.com/home?search=${search}&fuel=1`, (responseText) => {
      const matches = responseText.match(price.regex);
      if (matches) {
        const newPrice = matches[matches.length - 1];
        price.value(newPrice.replace('$', ''));
        drivingCost.render();
      }
    });
  },
};

const drivingCost = {
  value(noround) {
    if (noround) {
      return price.value() * (1 / mpg.value()) * drivingCost.distance;
    }
    return (price.value() * (1 / mpg.value()) * drivingCost.distance).toFixed(2);
  },
  update(distance) {
    if (distance !== drivingCost.distance) {
      drivingCost.distance = distance;
      try {
        const addresses = Array.from(document.getElementsByClassName('tactile-searchbox-input')).map(input => input.value);
        price.update(addresses[0]);
        // const details = document.getElementsByClassName('last-waypoint')[0];
        // const destination = details.innerText;
        // let a = document.createElement('a');
        // if (details.style.display !== 'none' && details.innerText.indexOf('Parking') === -1) {
        //   a.id = 'transportation-costs-parking';
        //   a.target = '_blank';
        //   a.class = 'line';
        //   const h2 = document.createElement('h2');
        //   h2.innerText = 'Find Parking';
        //   a.appendChild(document.createElement('br'));
        //   a.appendChild(h2);
        //   details.appendChild(a);
        // } else {
        //   a = document.getElementById('transportation-costs-parking');
        // }
        // a.href = `http://www.parkme.com/map#${destination}`;
      } catch (e) { console.log(e); }
      drivingCost.render();
    }
  },
  render() {
    cost.el.innerHTML = `Cost: <span class='detail'>$${price.value().toFixed(2)} &times; ${drivingCost.distance} mi `
                        + ` / <span id='tc_mpg'>${mpg.value()} mpg</span> = </span>$${drivingCost.value()}`;
    cost.el.style.display = 'block';
    document.getElementById('tc_mpg').addEventListener('click', mpg.update);
  },
};

const cost = {
  el: (() => {
    const el = document.createElement('div');
    el.id = 'cost';
    document.body.appendChild(el);
    return el;
  })(),
  update() {
  	//     var cards = document.getElementsByClassName('travel-mode');
  	// var cards_text = document.getElementById('cards').innerText;
  	//     if (!cards || cards.length == 0) {
  	//     	cost.el.style.display = 'none';
  	//     }
  	//     else if (cards_text.indexOf('Show traffic') != -1) {
  	//       drivingCost.update(cards);
  	//     }
  	//    	else if (cards_text.indexOf('Show terrain') != -1) {
  	//    		walk.update(cards);
  	//    	}
  	//    	else if (cards_text.indexOf('Show bike') != -1) {
  	//    		cycle.update(cards);
  	//    	}
  	//     else {
  	//       cost.el.style.display = 'none';
  	//     }
    let distance;

    const elements = document.getElementsByClassName('section-directions-trip-distance');
    if (elements.length > 0) {
      const re = /[\d\.]+/;
      const matches = re.exec(elements[0].innerText);
      if (matches && matches.length > 0) {
        if (!isNaN(matches[0])) {
          distance = parseFloat(matches[0]);
        }
      }
    }

    if (!distance) {
      cost.el.style.display = 'none';
    } else {
      drivingCost.update(distance);
    }
  },
};

window.setInterval(cost.update, 1000);
