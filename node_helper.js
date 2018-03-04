/* Magic Mirror
 * Module: MMM-GCP
 *
 * script from da4throux
 * MIT Licensed.
 *
 */

const NodeHelper = require("node_helper");
const BigQuery = require('@google-cloud/bigquery');
var serverSide = [];
var bigquery, options;

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
  },

  socketNotificationReceived: function(notification, payload) {
    const self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;
      if (this.config.debug) {
        console.log (' *** config received from MMM.js & set in node_helper: ');
        console.log ( payload );
      }
      this.started = true;
      //init serverSide if necessary
      this.config.lines.forEach(function(l){
        serverSide[l.id] = {};
        if (l.type === 'billing') {
          serverSide[l.id].bigQuery = new BigQuery({
            projectId: l.projectId,
            keyFilename: l.serviceAccountKey,
          });
          serverSide[l.id].options = {
            query: 'SELECT EXTRACT(DAYOFYEAR FROM _PARTITIONTIME) as day, sum(cost) as cost FROM  `' + l.projectId + '.' + l.table + '` WHERE DATE(_PARTITIONTIME) >= DATE_SUB(CURRENT_DATE(), INTERVAL ' + l.dayTrendLength + ' DAY) GROUP BY day ORDER BY day DESC;',
            timeoutMs: 10000, // Time out after 10 seconds.
            useLegacySql: false, // Use standard SQL syntax for queries.
          };
        }
        setTimeout(function(){
          if (self.config.debug) {
            console.log (' *** line ' + l.label + ' intial update in ' + l.initialLoadDelay);
          }
          self.fetchHandleAPI(l);
        }, l.initialLoadDelay);
      });
    }
  },

  fetchHandleAPI: function(_l) {
    var self = this, retry = true;
    if (this.config.debug) { console.log (' *** MMM-GCP fetchHandleAPI for: ' + _l.label);}
    switch (_l.type) {
      case'billing':
        self.getBilling(_l);
        break;
      default:
        if (this.config.debug) {
          console.log(' *** unknown request: ' + l.type);
        }
    }
    if (retry) {
      if (this.config.debug) {
        console.log (' *** line ' + _l.label + ' retries update in ' + _l.updateInterval);
      }
      setTimeout(function() {
        self.fetchHandleAPI(_l);
      }, _l.updateInterval);
    }
  },

  getBilling: function (_l) {
    var svsd = serverSide[_l.id];
    // Runs the query
    if (this.config.debug) {
      console.log ('MMM-GCP bigQuerying billing of line ' + _l.label);
    }
    svsd.bigQuery
      .query(svsd.options)
      .then(results => {
        if (this.config.debug) {
          console.log ('BQ answer received for line' + _l.label);
        }
        const rows = results[0];
        this.config.infos[_l.id].lastUpdate = new Date();
        this.config.infos[_l.id].data = rows;
        this.loaded = true;
        if (this.config.debug) {
          console.log('MMM-GCP bigQuery returned rows:');
          rows.forEach(row => console.log(row));
        }
        this.sendSocketNotification("DATA", this.config.infos)
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
  },

});
