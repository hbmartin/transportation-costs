var mpg = {
  value: function(val) {
    if (typeof val != "undefined") {
      val = Number(val) || 20;
      mpg.val = val;
      localStorage.mpg = val;
    }
    return mpg.val || localStorage.mpg || 20;
  },
  update: function () {
    mpg.value( prompt("Enter miles per gallon (mpg)") );
    cost.render();
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
          console.log(price.value(JSON.parse(xhr.responseText).results[0].opisGasPrices[0].amount));
          price.log[addr] = price.value();
          cost.render();
        } catch (e) { console.log(e); }
      }
    };
    xhr.send();
  }
}

var cost = {
  value: function(noround) {
    if (noround) { return price.value() * (1/mpg.value()) * cost.distance; }
    else { return Math.round(100 * (price.value() * (1/mpg.value()) * cost.distance)) / 100; }
  },
  update: function() {
    var cards = document.getElementsByClassName('cards-directions-table');
    if (cards[0]) {
      try {
        var re = /(\d+\.?\d*)\s+mi(?!n)/ ;
        var distance = cards[0].innerText.match(re)[1];
        if (distance != cost.distance) {
          cost.distance = distance;
          var addr = document.getElementsByClassName('tactile-searchbox-input')[0].value;
          if (addr) { price.update(addr); }
          cost.render();
        }
      } catch (e) { console.log(e); }
    } else {
      if (cost.el) { cost.el.style.display = 'none'; }
    }
  },
  render: function() {
    if (!cost.el) {
      cost.el = document.getElementById('cost');
      if (!cost.el) {
        cost.el = document.createElement("div");
        cost.el.id = "cost";
        document.body.appendChild(cost.el);
      }
    }
    cost.el.innerHTML = "Cost: <span class='detail'>$" +
                        price.value()  + " &times; " +
                        cost.distance + " mi " +
                        " / <span id='mpg'>" + mpg.value() + " mpg</span> = </span>$" +
                        cost.value();
    cost.el.style.display = 'block';
    document.getElementById('mpg').addEventListener("click", mpg.update);
  }
}

window.setInterval(cost.update, 1000);
