(function () {
  'use strict';

  var port = 9751;

  function Gauge(name, labels) {
    this.name = name;
    this.val = 0;
    this.labels = labels;
  }

  Gauge.prototype.set = function(val) {
    this.val = val;
  };

  Gauge.prototype.inc = function(val) {
    this.val += val;
  };

  Gauge.prototype.toString = function() {
    if (this.labels.length%2 != 0) {
      console.log('error: invalid label length');
    }
    var labels = ""
    var i = 0;
    while (i < this.labels.length) {
      labels += this.labels[i] + '="' + this.labels[i+1] + '"';

      if (i+2 < this.labels.length) {
        labels += ',';
      }

      i += 2;
    }

    return this.name + '{' + labels + '} '+ this.val;
  };

  function httpServer() {
    var server = network.createListener();
    server.on('connection', function(conn) {
      conn.on('data', function() {
        var park_cash = new Gauge("park_cash", ["park", park.name]);
        park_cash.set(park.cash/10);
        var park_rating = new Gauge("park_rating", ["park", park.name]);
        park_rating.set(park.rating);
        var park_bankLoan = new Gauge("park_bankLoan", ["park", park.name]);
        park_bankLoan.set(park.bankLoan);

        conn.write('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n');
        conn.write('# TYPE park_cash gauge\n' + park_cash + '\n');
        conn.write('# TYPE park_rating gauge\n' + park_rating + '\n');
        conn.write('# TYPE park_bank_loan gauge\n' + park_bankLoan + '\n');
        conn.write('# TYPE park_max_bank_loan counter\npark_max_bank_loan{park="' + park.name + '"} ' + park.maxBankLoan/10 + '\n');

        var guest_count = new Gauge("guest_count", ["park", park.name]);
        var staff_count = new Gauge("staff_count", ["park", park.name]);
        var peep_count = new Gauge("peep_count", ["park", park.name]);
        var duck_count = new Gauge("duck_count", ["park", park.name]);

        var peeps = map.getAllEntities("peep");
        peep_count.set(peeps.length);

        var ducks = map.getAllEntities("duck");
        duck_count.set(ducks.length);

        peeps.forEach(function(peep) {
          if (peep.peepType === 'guest' && peep.getFlag("hasPaidForParkEntry")) {
            guest_count.inc(1);
          } else if (peep.peepType === 'staff') {
            staff_count.inc(1);
          }
        });

        conn.write('# TYPE peep_count gauge\n' + peep_count + '\n');
        conn.write('# TYPE guest_count gauge\n' + guest_count + '\n');
        conn.write('# TYPE staff_count gauge\n' + staff_count + '\n');
        conn.write('# TYPE duck_count gauge\n' + duck_count + '\n');
        conn.end();
      });
    });
    server.listen(port);
    console.log('listening on port ' + port + '...');
  }

  function main() {
    httpServer();
  }

  registerPlugin({
    name: 'openrct2-prometheus-exporter',
    version: '0.0.0',
    licence: 'MIT',
    authors: ['Terin Stock'],
    type: 'local',
    main: main
  });

}());
