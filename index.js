(function () {
  "use strict";

  var port = 9751;

  registerPlugin({
    name: "openrct2-prometheus-exporter",
    version: "0.0.0",
    licence: "MIT",
    authors: ["Terin Stock"],
    type: "local",
    minApiVersion: 4,
    main: main,
  });

  function main() {
    var registry = new Registry();
    ParkCollector(registry);

    httpServer(registry);
  }

  function httpServer(registry) {
    var server = network.createListener();
    server.on("connection", function (conn) {
      conn.on("data", function () {
        conn.write(
          "HTTP/1.1 200 OK\r\nContent-Type: text/plain; version=0.0.4; charset=utf-8\r\n\r\n"
        );

        var metrics = registry.metrics();
        for (var i = 0; i < metrics.length; i++) {
          conn.write(TextFormatter.description(metrics[i].describe()));
          conn.write(TextFormatter.metric(metrics[i].collect()));
        }

        conn.end();
      });
    });
    server.listen(port);
    console.log("listening on port " + port + "...");
  }

  function ParkCollector(registry) {
    var entranceFee = new GaugeFunction(
      {
        name: "park_entrance_fee_cash",
        help: "The current entrance fee for the park.",
        const_labels: ["park", park.name],
      },
      function () {
        return park.entranceFee;
      }
    );
    registry.register(entranceFee);

    var park_cash = new GaugeFunction(
      {
        name: "park_cash",
        help: "The amount of cash in the bank.",
        const_labels: ["park", park.name],
      },
      function () {
        return park.cash;
      }
    );
    registry.register(park_cash);

    var park_bank_loan = new GaugeFunction(
      {
        name: "park_bank_loan_cash",
        help: "The amount of cash loaned from the bank.",
        const_labels: ["park", park.name],
      },
      function () {
        return park.bankLoan;
      }
    );
    registry.register(park_bank_loan);

    var park_max_bank_loan = new Gauge({
      name: "park_max_bank_loan_cash",
      help: "The maximium amount the bank will loan.",
      const_labels: ["park", park.name],
    });
    park_max_bank_loan.set(park.maxBankLoan);
    registry.register(park_max_bank_loan);

    var park_rating = new GaugeFunction(
      {
        name: "park_rating",
        help: "The current park rating 0-999.",
        const_labels: ["park", park.name],
      },
      function () {
        return park.rating;
      }
    );
    registry.register(park_rating);

    var guest_count = new GaugeFunction(
      {
        name: "guests",
        help: "The current number of guests.",
        const_labels: ["park", park.name],
      },
      function () {
        return map.getAllEntities("peep").filter(function (peep) {
          return peep.peepType == "guest";
        }).length;
      }
    );
    registry.register(guest_count);

    var staff_count = new GaugeFunction(
      {
        name: "staff",
        help: "The current number of park staff.",
        const_labels: ["park", park.name],
      },
      function () {
        return map.getAllEntities("peep").filter(function (peep) {
          return peep.peepType == "staff";
        }).length;
      }
    );
    registry.register(staff_count);

    var peep_count = new GaugeFunction(
      {
        name: "peeps",
        help: "The current number of peeps (guests + staff).",
        const_labels: ["park", park.name],
      },
      function () {
        return map.getAllEntities("peep").length;
      }
    );
    registry.register(peep_count);

    var duck_count = new GaugeFunction(
      {
        name: "ducks",
        help: "The current number of ducks.",
        const_labels: ["park", park.name],
      },
      function () {
        return map.getAllEntities("duck").length;
      }
    );
    registry.register(duck_count);
  }

  function Registry() {
    this._metrics = [];
  }
  Registry.prototype.register = function (metric) {
    this._metrics.push(metric);
  };
  Registry.prototype.metrics = function () {
    return this._metrics;
  };

  function Gauge(opts) {
    this.name = opts.name;
    this.help = opts.help;
    this.const_labels = opts.const_labels;
    this.value = 0;
  }
  Gauge.prototype.set = function (val) {
    this.value = val;
  };
  Gauge.prototype.inc = function (val) {
    this.value += val;
  };
  Gauge.prototype.describe = function () {
    return {
      name: this.name,
      type: "gauge",
      help: this.help,
    };
  };
  Gauge.prototype.collect = function () {
    return {
      name: this.name,
      labels: this.const_labels,
      value: this.value,
    };
  };

  function GaugeFunction(opts, fn) {
    this.name = opts.name;
    this.help = opts.help;
    this.const_labels = opts.const_labels;
    this.fn = fn;
  }
  GaugeFunction.prototype.describe = function () {
    return {
      name: this.name,
      type: "gauge",
      help: this.help,
    };
  };
  GaugeFunction.prototype.collect = function () {
    return {
      name: this.name,
      labels: this.const_labels,
      value: this.fn(),
    };
  };

  function TextFormatter() {}
  TextFormatter.description = function (desc) {
    return (
      [
        ["# TYPE", desc.name, desc.type].join(" "),
        ["# HELP", desc.name, desc.help].join(" "),
      ].join("\n") + "\n"
    );
  };
  TextFormatter.metric = function (metric) {
    if (metric.labels.length % 2 != 0) {
      console.log("error: invalid label length");
    }
    var labels = "";
    var i = 0;
    while (i < metric.labels.length) {
      labels += metric.labels[i] + '="' + metric.labels[i + 1] + '"';

      if (i + 2 < metric.labels.length) {
        labels += ",";
      }

      i += 2;
    }

    return metric.name + "{" + labels + "} " + metric.value + "\n";
  };
})();
