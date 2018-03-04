/* Magic Mirror
 * Module: MMM-GCP
 *
 * By da4throux
 * MIT Licensed.
 */

Module.register("MMM-GCP",{

  // Define module defaults
  defaults: {
    debug: false, //console.log more things to help debugging
    testBasicBilling: false,
    testRandomBilling: false,
    line_template: {
      updateInterval: 1 * 60 * 1000 * 60 * 6, // every 6 hours
      initialLoadDelay: 0, // start delay seconds
      dayTrendLength: 10,
      trendWidth: 400,
      trendHeight: 100,
    },
    updateDomFrequence: 900,
  },

  // Define required scripts.
  getStyles: function() {
    return ["MMM-GCP.css"];
  },

  // Define start sequence.
  start: function() {
    var l, i;
    Log.info("Starting module: " + this.name);
    this.config.infos = [];
    if (!this.config.lines) {
      this.config.lines = [];
    }
    if (this.config.debug) {
      console.log ('GCP - lines to be used: ');
      console.log (JSON.stringify(this.config.lines));
    }
    for (i=0; i < this.config.lines.length; i++) {
      this.config.infos[i]={};
      l = Object.assign(JSON.parse(JSON.stringify(this.config.line_template)),
        JSON.parse(JSON.stringify(this.config.lineDefault || {})),
        JSON.parse(JSON.stringify(this.config.lines[i])));
      l.id = i;
      switch (l.type) {
        case 'billing':
          break;
        default:
          if (this.config.debug) { console.log('Unknown request type: ' + l.type)}
      }
      this.config.lines[i] = l;
    }
    this.sendSocketNotification('SET_CONFIG', this.config);
    this.loaded = false;
    var self = this;
    setInterval(function () {
      self.caller = 'updateInterval';
      self.updateDom();
    }, this.config.updateDomFrequence);
  },

  getHeader: function () {
    var header = this.data.header;
    return header;
  },

  buildBillingGraph: function (l, d) {
    var i, w, h, th, n, max, min, previousCost, cost;
    var rowTrend = document.createElement("tr");
    var cellTrend = document.createElement("td");
    var trendGraph = document.createElement('canvas');
    var ctx = trendGraph.getContext('2d');
    if (this.config.testBasicBilling) {
      d = { data: [{cost: 1}, {cost: 0}]};
    }
    trendGraph.className = "billingTrendGraph";
    trendGraph.width  = l.trendWidth;
    th = trendGraph.height = l.trendHeight;
    h = trendGraph.height * 0.8;
    n = d.data.length;
    w = trendGraph.width / n;
    max = min = parseInt(d.data[0].cost);
    previousCost = parseInt(d.data[n - 1].cost);
    for (i = 0; i < n; i++) {
      max = max > parseInt(d.data[i].cost) ? max : parseInt(d.data[i].cost);
      min = min < parseInt(d.data[i].cost) ? min : parseInt(d.data[i].cost);
    }
    max = (max + 1) * 1.2;
    for (i = 0; i < n; i++) {
      cost = parseInt(d.data[n - 1 - i].cost);
      if (this.config.testRandomBilling) {
        max = 1100;
        cost = Math.floor(Math.random() * 1000);
      }
      ctx.fillStyle = 'white';
      if (cost > previousCost) {
        ctx.fillStyle = 'blue';
      }
      if (cost < previousCost) {
        ctx.fillStyle = 'green';
      }
      if (l.costLimit && cost > l.costLimit) {
        ctx.fillStyle = 'red';
      }
      ctx.fillRect(i * w, h * ( 1 - (cost + 1) / max) , w, Math.max(h * cost / max, 3));
      ctx.font = Math.round(trendGraph.height * 0.15) + 'px';
      ctx.fillStyle = 'grey';
      ctx.textAlign = 'center';
      ctx.fillText(cost, i * w + w / 2, th * 0.97);
      previousCost = cost;
    }
    cellTrend.colSpan = '3'; //so that it takes the whole row
    cellTrend.appendChild(trendGraph);
    rowTrend.appendChild(cellTrend);
    return (rowTrend);
  },

  getReadableTime: function (time) {
    var readableTime = "";
    var length = Math.floor(time / 1000);
    var second = 1;
    var minute = 60 * second;
    var hour = 60 * minute;
    var day = 24 * hour;
    var seconds, minutes, hours, days;
    var last;
    days = Math.floor(length / day);
    length = length - days * day;
    hours = Math.floor(length / hour);
    length = length - hours * hour;
    minutes = Math.floor(length / minute);
    length = length - minutes * minute;
    seconds = length;
    last = false;
    if (days > 0) {
      readableTime = days == 1 ? "1 day " : days + ' days ';
      last = true;
    }
    if (hours > 0 || last) {
      readableTime += hours + "h ";
      if (last) {
        return readableTime;
      } else {
        last = true;
      }
    }
    if (minutes > 0 || last) {
      readableTime += minutes + "mn ";
      if (last) {
        return readableTime;
      } else {
        last = true;
      }
    }
    readableTime += seconds + 's';
    return readableTime;
  },

  // Override dom generator.
  getDom: function() {
    var now = new Date();
    var wrapper = document.createElement("div");
    var lines = this.config.lines;
    var i, j, l, d, n, lineColor;
    var table = document.createElement("table");
    var firstCell, secondCell, row;
    if (lines.length > 0) {
      if (!this.loaded) {
        wrapper.innerHTML = "Loading information ...";
        wrapper.className = "dimmed light small";
        return wrapper;
      } else {
        wrapper.className = "gcp";
        wrapper.appendChild(table);
        table.className = "small";
      }
    } else {
      wrapper.className = "small";
      wrapper.innerHTML = "Your configuration requires a 'lines' element.<br />Check github da4throux/MMM-GCP<br />for more information";
    }
    for (i = 0; i < lines.length; i++) {
      l = lines[i]; // line config
      d = this.infos[i]; // data received for the line
      lineColor = l.lineColor ? 'color:' + l.lineColor + ' !important' : false;
      switch (l.type) {
        case "billing":
          row = document.createElement("tr");
          row.id = 'line-' + i;
          firstCell = document.createElement("td");
          firstCell.className = "align-right bright";
          firstCell.innerHTML = l.label || l.projectId;
          if (lineColor) {
              firstCell.setAttribute('style', lineColor);
          }
          if (l.firstCellColor) {
              firstCell.setAttribute('style', 'color:' + l.firstCellColor + ' !important');
          }
          row.appendChild(firstCell);
          secondCell = document.createElement("td");
          secondCell.className = "align-center";
          secondCell.innerHTML = d ? this.getReadableTime(now - Date.parse(d.lastUpdate)) + ' ago' : 'N/A';
          secondCell.colSpan = 2;
          if (lineColor) {
              secondCell.setAttribute('style', lineColor);
          }
          row.appendChild(secondCell);
          table.appendChild(row);
          table.appendChild(this.buildBillingGraph(l, d));
          break;
        default:
          if (this.config.debug) { console.log('Unknown request type: ' + l.type)}
      }
    }
    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    var now = new Date();
    this.caller = notification;
    switch (notification) {
      case "DATA":
        this.infos = payload;
        this.loaded = true;
        break;
    }
  }
});
