include "sharedtracing.thrift"

namespace cl tutorial
namespace cpp tutorial
namespace d tutorial
namespace dart tutorial
namespace java tutorial
namespace php tutorial
namespace perl tutorial
namespace haxe tutorial
namespace netstd tutorial

typedef i32 MyInteger
const i32 INT32CONSTANT = 9853
const map<string,string> MAPCONSTANT = {'hello':'world', 'goodnight':'moon'}

enum Operation {
  ADD = 1,
  SUBTRACT = 2,
  MULTIPLY = 3,
  DIVIDE = 4
}
struct Work {
  1: i32 num1 = 0,
  2: i32 num2,
  3: Operation op,
  4: optional string comment,
}
exception InvalidOperation {
  1: i32 whatOp,
  2: string why
}


service Calculator extends sharedtracing.SharedService {
  void ping(1: map<string, string> carrier),
  i32 add(1:i32 num1, 2:i32 num2, 3:map<string, string> carrier),
  i32 calculate(1:i32 logid, 2:Work w, 3:map<string, string> carrier) throws (1:InvalidOperation ouch),
  oneway void zip(1:map<string, string> carrier)
}
