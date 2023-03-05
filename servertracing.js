var Calculator = require("./gen-nodejs/Calculator");
var ttypes = require("./gen-nodejs/tutorialtracing_types");
var SharedStruct = require("./gen-nodejs/sharedtracing_types").SharedStruct;
var thrift = require('thrift');
const opentracing = require('opentracing');
const tracer = require('dd-trace').init({
  service: 'thrift-server'
});

var data = {};

var server = thrift.createServer(Calculator, {
  ping: function(result) {
    console.log("ping()");
    result(null);
  },

  add: function(n1, n2, result) {
    console.log("add(", n1, ",", n2, ")");
    result(null, n1 + n2);
  },

  calculate: function(logid, work, headers, result) {
    console.log("calculate(", logid, ",", work, ")");
    const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, headers);
    const span = tracer.startSpan('calculate', { childOf: parentSpanContext });

    var val = 0;
    if (work.op == ttypes.Operation.ADD) {
      span.log({ event: 'add' });
      val = work.num1 + work.num2;
    } else if (work.op === ttypes.Operation.SUBTRACT) {
      span.log({ event: 'subtract' });
      val = work.num1 - work.num2;
    } else if (work.op === ttypes.Operation.MULTIPLY) {
      span.log({ event: 'multiply' });
      val = work.num1 * work.num2;
    } else if (work.op === ttypes.Operation.DIVIDE) {
      span.log({ event: 'divide' });
      if (work.num2 === 0) {
        var x = new ttypes.InvalidOperation();
        x.whatOp = work.op;
        x.why = 'Cannot divide by 0';
        result(x);
        span.finish();
        return;
      }
      val = work.num1 / work.num2;
    } else {
      span.log({ event: 'invalid operation' });
      var x = new ttypes.InvalidOperation();
      x.whatOp = work.op;
      x.why = 'Invalid operation';
      result(x);
      span.finish();
      return;
    }

    var entry = new SharedStruct();
    entry.key = logid;
    entry.value = ""+val;
    data[logid] = entry;

    result(null, val);
    span.finish();
  },

  getStruct: function(key, headers, result) {
    console.log("getStruct(", key, ")");
    const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, headers);
    const span = tracer.startSpan('getStruct', { childOf: parentSpanContext });

    result(null, data[key]);
    span.finish();
  },

  zip: function() {
    console.log("zip()");
  }

});

server.listen(9090);
