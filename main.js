function get_distance(cards) {
  try {
    var re = /(\d+\.?\d*)\s+mi(?!n)/ ;
    var distance = cards[0].innerText.match(re)[1];
    return distance;
  } catch (e) { return false; }
}

var cycle = {
  value: function() {
    return (cycle.distance * ((walk.lbs() * 0.2835) - 0.8853)).toFixed(0);
  },
  update: function(cards) {
    var distance;
    if (( distance=get_distance(cards) )) {
      if (distance != cycle.distance) {
        cycle.distance = distance;
				cycle.render();
			}
		}
	},
  render: function() {
    cost.el.innerHTML = "<span id='calories' class='pointer'>Calories: " + cycle.value() + "</span>";
    cost.el.style.display = 'block';
		document.getElementById('calories').addEventListener("click", function() {
	    walk.lbs( prompt("Enter your weight (lbs)") );
	    cycle.render();
		});
	}
};

var walk = {
  value: function() {
    return (walk.distance * walk.lbs() * 0.53).toFixed(0);
  },
	lbs: function(lbs) {
		if (lbs) { walk.weight = lbs; }
		return walk.weight || 162;
	},
  update: function(cards) {
    var distance;
    if (( distance=get_distance(cards) )) {
      if (distance != walk.distance) {
        walk.distance = distance;
				walk.render();
			}
		}
	},
  render: function() {
    cost.el.innerHTML = "<span id='calories' class='pointer'>Calories: " + walk.value() + "</span>";
    cost.el.style.display = 'block';
		document.getElementById('calories').addEventListener("click", function() {
	    walk.lbs( prompt("Enter your weight (lbs)") );
	    walk.render();
		});
	}
};

var mpg = {
  value: function(val) {
    if (typeof val != "undefined") {
      val = Number(val);
      mpg.val = val;
      localStorage.mpg = val;
    }
    return mpg.val || localStorage.mpg || 20;
  },
  update: function () {
    mpg.value( prompt("Enter miles per gallon (mpg)") );
    driving_cost.render();
  }
};

var price = {
  log: {},
  value: function(val) {
    if (typeof val != "undefined") {
      val = Number(val) || 5;
      price.val = val;
      localStorage.price = val;
    }
    return price.val || localStorage.price || 5;
  },
  update: function(addr) {
    if (price.log[addr]) {
      return price.value( price.log[addr] );
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://www.gasbuddy.com/Home/Search", true);
	xhr.setRequestHeader('Content-type', 'application/json');
	
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        try {
          price.value(JSON.parse(xhr.responseText).stations[0].CheapestFuel.CreditPrice.Amount);
          price.log[addr] = price.value();
          driving_cost.render();
        } catch (e) { console.log(e); }
      }
    };
    xhr.send(JSON.stringify({s:addr}));
  }
}

var driving_cost = {
  value: function(noround) {
    if (noround) { return price.value() * (1/mpg.value()) * driving_cost.distance; }
    else { return (price.value() * (1/mpg.value()) * driving_cost.distance).toFixed(2); }
  },
  update: function(distance) {
    if (distance != driving_cost.distance) {
      driving_cost.distance = distance;
      try {
        var addr = document.getElementsByClassName('tactile-searchbox-input')[0].value;
        if (addr) {
          price.update(addr);
        }
        var details = document.getElementsByClassName('last-waypoint')[0];
        var destination = details.innerText;
        var a;
        if (details.style.display != 'none' && details.innerText.indexOf('Parking') == -1) {
          a = document.createElement('a');
          a.id = 'transportation-costs-parking'
          a.target = '_blank';
          a.class = 'line';
          var h2 = document.createElement('h2');
          h2.innerText = 'Find Parking';
          a.appendChild(document.createElement('br'));
          a.appendChild(h2);
          details.appendChild(a);
        } else {
          a = document.getElementById('transportation-costs-parking');
        }
        a.href = 'http://www.parkme.com/map#' + destination;
      } catch (e) { console.log(e); }
      driving_cost.render();
    }
  },
  render: function() {
    cost.el.innerHTML = "Cost: <span class='detail'>$" +
                        price.value()  + " &times; " +
                        driving_cost.distance + " mi " +
                        " / <span id='mpg'>" + mpg.value() + " mpg</span> = </span>$" +
                        driving_cost.value();
    cost.el.style.display = 'block';
    document.getElementById('mpg').addEventListener("click", mpg.update);
  }
};

var cost = {
  el : function() {
    var el = document.createElement("div");
    el.id = "cost";
    document.body.appendChild(el);
    return el;
  }(),
  update: function() {
  	//     var cards = document.getElementsByClassName('travel-mode');
  	// var cards_text = document.getElementById('cards').innerText;
  	//     if (!cards || cards.length == 0) {
  	//     	cost.el.style.display = 'none';
  	//     }
  	//     else if (cards_text.indexOf('Show traffic') != -1) {
  	//       driving_cost.update(cards);
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
	var distance, elements;
	
	elements = document.getElementsByClassName('section-trip-summary-subtitle');
	if (elements && elements.length > 0) {
		var re=/[\d\.]+/;
		var matches = re.exec(elements[0].innerText);
		if (matches && matches.length > 0) {
			var _d = parseFloat(matches[0]);
			if (_d && !isNaN(_d)) {
				distance = _d;
			}
		}
	}
	
	if (!distance) {
		elements = document.getElementsByClassName('section-directions-trip-secondary-text');
		if (elements && elements.length > 0) {
			var _d = parseFloat(elements[0].innerText);
			if (_d && !isNaN(_d)) {
				distance = _d;
			}
		}
	}
	
	if (!distance) {
		cost.el.style.display = 'none';
	} else {
		driving_cost.update(distance);
	}
  }
};

window.setInterval(cost.update, 1000);
