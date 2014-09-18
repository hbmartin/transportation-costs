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
    xhr.open("GET", "http://gasprices.mapquest.com/services/v1/stations?filter=gasprice%3Aregular&sortby=distance&location=" + addr + "&hits=1", true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        try {
          price.value(JSON.parse(xhr.responseText).results[0].opisGasPrices[0].amount);
          price.log[addr] = price.value();
          driving_cost.render();
        } catch (e) { console.log(e); }
      }
    };
    xhr.send();
  }
}

var driving_cost = {
  value: function(noround) {
    if (noround) { return price.value() * (1/mpg.value()) * driving_cost.distance; }
    else { return (price.value() * (1/mpg.value()) * driving_cost.distance).toFixed(2); }
  },
  update: function(cards) {
    var distance;
    if (( distance=get_distance(cards) )) {
      if (distance != driving_cost.distance) {
        driving_cost.distance = distance;
        try {
          var addr = document.getElementsByClassName('tactile-searchbox-input')[0].value;
          if (addr) {
            price.update(addr);
      }
            var details = cards[0].getElementsByClassName('cards-directions-details-right');
      var a;
            for (var i=0; i<details.length; i++) {
              if (details[i].style.display != 'none') {
                if (details[i].innerText.indexOf('Parking') == -1) {
                  a = document.createElement('a');
                  a.style.margin = '0 15px 0 0';
                  a.target = '_blank';
                  a.innerText = 'Find Parking';
                  details[i].insertBefore(a, details[i].children[0]);
                }
              }
            }
      var traffic_cards = document.getElementsByClassName('cards-traffic-title');
      if (traffic_cards[0]) {
        if (traffic_cards[0].innerText.indexOf('park') == -1) {
          traffic_cards[0].innerHTML += ' (<a id="parkme" target="_blank" href="http://www.parkme.com/map#">parking</a>)';
        }
        var searches = document.getElementsByClassName('tactile-searchbox-input');
        if (searches.length > 1) {
          document.getElementById('parkme').setAttribute("href", "http://www.parkme.com/map#" + searches[searches.length - 1].value);  
                    a.href = 'http://www.parkme.com/map#' + searches[searches.length - 1].value;
        }
      }
          
        } catch (e) { console.log(e); }
        driving_cost.render();
      }
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
    var cards = document.getElementsByClassName('cards-directions');
  	var cards_text = document.getElementById('cards').innerText;
    if (!cards || cards.length == 0) {
    	cost.el.style.display = 'none';
    }
    else if (cards_text.indexOf('Show traffic') != -1) {
      driving_cost.update(cards);
    }
   	else if (cards_text.indexOf('Show terrain') != -1) {
   		walk.update(cards);
   	}
   	else if (cards_text.indexOf('Show bike') != -1) {
   		cycle.update(cards);
   	}
    else {
      cost.el.style.display = 'none';
    }
  }
};

window.setInterval(cost.update, 1000);
