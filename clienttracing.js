const opentracing = require('opentracing');
const tracer = require('dd-trace').init();
const span = tracer.startSpan('client');

var Calculator = require('./gen-nodejs/Calculator');
var ttypes = require('./gen-nodejs/tutorialtracing_types');
const assert = require('assert');
var thrift = require('thrift');

var transport = thrift.TBufferedTransport;
var protocol = thrift.TBinaryProtocol;

var connection = thrift.createConnection("localhost", 9090, {
  transport : transport,
  protocol : protocol
});

connection.on('error', function(err) {
  assert(false, err);
});

// Create a Calculator client with the connection
var client = thrift.createClient(Calculator, connection);

// Inject context into the span
const carrier = {};
tracer.inject(span, opentracing.FORMAT_TEXT_MAP, carrier);

client.ping(carrier, function(err, response) {
  console.log('ping()');
});


client.add(1,1, carrier, function(err, response) {
  console.log("1+1=" + response);
});

// Start a new span for calculate function
const calcSpan = tracer.startSpan('calculate', {
  childOf: span
});
// Inject context into the new span
const calcCarrier = {};
tracer.inject(calcSpan, opentracing.FORMAT_TEXT_MAP, calcCarrier);

work = new ttypes.Work();
work.op = ttypes.Operation.DIVIDE;
work.num1 = 1;
work.num2 = 0;

client.calculate(1, work, calcCarrier, function(err, message) {
  if (err) {
    console.log("InvalidOperation " + err);
  } else {
    console.log('Whoa? You know how to divide by zero?');
  }
});

work.op = ttypes.Operation.SUBTRACT;
work.num1 = 15;
work.num2 = 10;

client.calculate(1, work, calcCarrier, function(err, message) {
  console.log('15-10=' + message);

  // Start a new span for getStruct function
  const structSpan = tracer.startSpan('getStruct', {
    childOf: span
  });
  // Inject context into the new span
  const structCarrier = {};
  tracer.inject(structSpan, opentracing.FORMAT_TEXT_MAP, structCarrier);

  client.getStruct(1, structCarrier, function(err, message){
    console.log('Check log: ' + message.value);

    //close the connection once we're done
    connection.end();

    // End all spans when the connection is closed
    calcSpan.finish();
    structSpan.finish();
    span.finish();
  });
});
