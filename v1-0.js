/*
    Copyright 2005-2008 Jeff Watkins <http://coherentjs.org>

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
if ("undefined" !== typeof(coherent)) {
  throw new Error("Library module (coherent) already defined")
}
var coherent = {
  version: "1.0.0",
  revision: "175",
  generateUid: (function() {
    var A = 0;
    return function() {
      return++A
    }
  })()
};
coherent.Browser = {
  IE: !!(window.attachEvent && !window.opera),
  Safari: navigator.userAgent.indexOf("AppleWebKit/") > -1,
  Safari2: (function() {
    var A = /AppleWebKit\/(\d+(?:\.\d+)?)/;
    var B = A.exec(navigator.userAgent);
    return (B && parseInt(B[1], 10) < 420)
  })(),
  Mozilla: navigator.userAgent.indexOf("Gecko") > -1 && navigator.userAgent.indexOf("KHTML") == -1,
  MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
};
coherent.Support = {
  Properties: ("__defineGetter__" in Object.prototype),
  QuerySelector: ("querySelector" in document)
};
if (coherent.Browser.IE || coherent.Browser.Safari2) {
  Array.from = function(D, E) {
    var B = D.length;
    var A = [];
    A.length = B;
    for (var C = (E || 0); C < B; ++C) {
      A[C] = D[C]
    }
    return A
  }
} else {
  Array.from = function(A, B) {
    return Array.prototype.slice.call(A, B || 0)
  }
}
if (!Function.prototype.bind) {
  Function.prototype.bind = function(C) {
    var A = this;
    if (!arguments.length) {
      return A
    }
    if (1 == arguments.length) {
      return function() {
        return A.apply(C, arguments)
      }
    }
    var B = Array.from(arguments, 1);
    return function() {
      return A.apply(C, B.concat(Array.from(arguments)))
    }
  }
}
if (!Function.prototype.delay) {
  Function.prototype.delay = function(D) {
    var B = this;
    D = D || 10;
    if (arguments.length < 2) {
      function A() {
        B()
      }
      return window.setTimeout(A, D)
    }
    var C = Array.from(arguments, 1);
    function E() {
      B.apply(B, C)
    }
    return window.setTimeout(E, D)
  }
}
if (!Function.prototype.bindAndDelay) {
  Function.prototype.bindAndDelay = function(F, D) {
    var B = this;
    D = D || 10;
    if (arguments.length < 3) {
      function A() {
        B.call(F || B)
      }
      return window.setTimeout(A, D)
    }
    var C = Array.from(arguments, 2);
    function E() {
      B.apply(B, C)
    }
    return window.setTimeout(E, D)
  }
}
Function.prototype.sync = function() {
  var B = arguments.length ? this.bind.apply(this, arguments) : this;
  var A = {};
  var C = false;
  B.stop = function() {
    C = true
  };
  B.waitFor = function(D) {
    A[D] = true;
    return function() {
      A[D] = false;
      for (var E in A) {
        if (A[E]) {
          return
        }
      }
      if (C) {
        return
      }
      B()
    }
  };
  return B
};
String.prototype.titleCase = function() {
  return this.charAt(0).toUpperCase() + this.substr(1)
};
String.prototype.trim = function() {
  var B = this.replace(/^\s+/, "");
  for (var A = B.length - 1; A > 0; --A) {
    if (/\S/.test(B.charAt(A))) {
      B = B.substring(0, A + 1);
      break
    }
  }
  return B
};
if (!String.prototype.localeCompare) {
  String.prototype.localeCompare = function(A) {
    if (this < A) {
      return - 1
    } else {
      if (this > A) {
        return 1
      } else {
        return 0
      }
    }
  }
}
RegExp.escape = function(A) {
  return A.replace(RegExp._escapeRegex, "\\$1")
};
RegExp.specialCharacters = ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\"];
RegExp._escapeRegex = new RegExp("(\\" + RegExp.specialCharacters.join("|\\") + ")", "g");
Object.clone = function(B) {
  var A = (function() {});
  A.prototype = B;
  return new A()
};
Object.applyDefaults = function(C, B) {
  C = C || {};
  if (!B) {
    return C
  }
  for (var A in B) {
    if (A in C) {
      continue
    }
    C[A] = B[A]
  }
  return C
};
if (!Object.extend) {
  Object.extend = Object.applyDefaults
}
coherent.typeOf = function(C) {
  if (null === C) {
    return "object"
  }
  var B = typeof(C);
  if ("object" !== B && "function" !== B) {
    return B
  }
  switch (C.constructor) {
  case Array:
    return "array";
  case Boolean:
    return "boolean";
  case Date:
    return "date";
  case Function:
    return "function";
  case Object:
    return "object";
  case RegExp:
    return "regex";
  case String:
    return "string";
  default:
    var A = C.constructor.toString().match(/function\s*([^( ]+)\(/);
    if (A) {
      return A[1]
    } else {
      return "object"
    }
  }
};
coherent.compareValues = function(F, D) {
  var C = coherent.typeOf(F);
  if (C !== coherent.typeOf(D)) {
    var A = String(F);
    var E = String(D);
    return A.localeCompare(E)
  }
  switch (C) {
  case "boolean":
  case "number":
    var B = (F - D);
    if (0 === B) {
      return B
    }
    return (B < 0 ? -1 : 1);
  case "regex":
  case "function":
    break;
  case "string":
  case "array":
  case "object":
    if (F.localeCompare) {
      return F.localeCompare(D)
    }
    if (F.compare) {
      return F.compare(D)
    }
    break;
  case "undefined":
    return true;
  default:
    throw new TypeError("Unknown type for comparison: " + C)
  }
  return String(F).localeCompare(String(D))
};
if ("undefined" !== typeof(window.Prototype)) { (function() {
    var A = ["indexOf", "lastIndexOf", "forEach", "filter", "map", "some", "every", "reduce", "reduceRight"];
    for (var B = 0; B < A.length; ++B) {
      delete Array.prototype[A[B]]
    }
  })()
}
Array.prototype.distinct = function() {
  var B = this.length;
  var A = new Array(B);
  var C;
  var E;
  var D = 0;
  for (C = 0; C < B; ++C) {
    E = this[C];
    if ( - 1 == A.indexOf(E)) {
      A[D++] = E
    }
  }
  A.length = D;
  return A
};
Array.prototype.compare = function(B) {
  var D = this.length - B.length;
  if (0 !== D) {
    return D
  }
  var E;
  var A;
  var C;
  for (E = 0, A = this.length; E < A; ++E) {
    C = coherent.compareValues(this[E], B[E]);
    if (0 !== C) {
      return C
    }
  }
  return 0
};
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(C, B) {
    if ("undefined" === typeof(B)) {
      B = 0
    } else {
      if (B < 0) {
        B = Math.max(0, this.length + B)
      }
    }
    for (var A = B; A < this.length; A++) {
      if (this[A] === C) {
        return A
      }
    }
    return - 1
  }
}
if (!Array.indexOf) {
  Array.indexOf = function(C, B, A) {
    return Array.prototype.indexOf.call(C, B, A)
  }
}
if (!Array.prototype.lastIndexOf) {
  Array.prototype.lastIndexOf = function(C, B) {
    if ("undefined" === typeof(B)) {
      B = this.length - 1
    } else {
      if (B < 0) {
        B = Math.max(0, this.length + B)
      }
    }
    for (var A = B; A >= 0; A--) {
      if (this[A] === C) {
        return A
      }
    }
    return - 1
  }
}
if (!Array.lastIndexOf) {
  Array.lastIndexOf = function(C, B, A) {
    return Array.prototype.lastIndexOf.call(C, B, A)
  }
}
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(C, D) {
    var A = this.length;
    for (var B = 0; B < A; B++) {
      C.call(D, this[B], B, this)
    }
  }
}
if (!Array.forEach) {
  Array.forEach = function(C, A, B) {
    return Array.prototype.forEach.call(C, A, B)
  }
}
if (!Array.prototype.filter) {
  Array.prototype.filter = function(D, E) {
    var A = this.length;
    var C = [];
    for (var B = 0; B < A; B++) {
      if (D.call(E, this[B], B, this)) {
        C.push(this[B])
      }
    }
    return C
  }
}
if (!Array.filter) {
  Array.filter = function(C, A, B) {
    return Array.prototype.filter.call(C, A, B)
  }
}
if (!Array.prototype.map) {
  Array.prototype.map = function(D, E) {
    var A = this.length;
    var C = [];
    for (var B = 0; B < A; B++) {
      C.push(D.call(E, this[B], B, this))
    }
    return C
  }
}
if (!Array.map) {
  Array.map = function(C, A, B) {
    return Array.prototype.map.call(C, A, B)
  }
}
if (!Array.prototype.some) {
  Array.prototype.some = function(C, D) {
    var A = this.length;
    for (var B = 0; B < A; B++) {
      if (C.call(D, this[B], B, this)) {
        return true
      }
    }
    return false
  }
}
if (!Array.some) {
  Array.some = function(C, A, B) {
    return Array.prototype.some.call(C, A, B)
  }
}
if (!Array.prototype.every) {
  Array.prototype.every = function(C, D) {
    var A = this.length;
    for (var B = 0; B < A; B++) {
      if (!C.call(D, this[B], B, this)) {
        return false
      }
    }
    return true
  }
}
if (!Array.every) {
  Array.every = function(C, A, B) {
    return Array.prototype.every.call(C, A, B)
  }
}
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(B) {
    var A = this.length;
    if (typeof B != "function") {
      throw new TypeError()
    }
    if (0 === A && 1 === arguments.length) {
      throw new TypeError()
    }
    var C = 0;
    if (arguments.length >= 2) {
      var D = arguments[1]
    } else {
      do {
        if (C in this) {
          D = this[C++];
          break
        }
        if (++C >= A) {
          throw new TypeError()
        }
      } while ( true )
    }
    for (; C < A; C++) {
      if (C in this) {
        D = B.call(null, D, this[C], C, this)
      }
    }
    return D
  }
}
if (!Array.reduce) {
  Array.reduce = function(B, A) {
    if (arguments.length > 2) {
      return Array.prototype.reduce.apply(B, A, arguments[2])
    } else {
      return Array.prototype.reduce.apply(B, A)
    }
  }
}
if (!Array.prototype.reduceRight) {
  Array.prototype.reduceRight = function(B) {
    var A = this.length;
    if (typeof B != "function") {
      throw new TypeError()
    }
    if (0 === A && 1 === arguments.length) {
      throw new TypeError()
    }
    var C = A - 1;
    if (arguments.length >= 2) {
      var D = arguments[1]
    } else {
      do {
        if (C in this) {
          D = this[C--];
          break
        }
        if (--C < 0) {
          throw new TypeError()
        }
      } while ( true )
    }
    for (; C >= 0; C--) {
      if (C in this) {
        D = B.call(null, D, this[C], C, this)
      }
    }
    return D
  }
}
if (!Array.reduceRight) {
  Array.reduceRight = function(B, A) {
    if (arguments.length > 2) {
      return Array.prototype.reduceRight.apply(B, A, arguments[2])
    } else {
      return Array.prototype.reduceRight.apply(B, A)
    }
  }
}
function Set() {
  var D = this;
  if (D.constructor !== Set) {
    D = new Set()
  }
  var B = arguments;
  if (1 == B.length && B[0] instanceof Array) {
    B = B[0]
  }
  var C;
  var A = B.length;
  for (C = 0; C < A; ++C) {
    D[B[C]] = true
  }
  return D
}
Set.union = function(C, B) {
  var A = Object.clone(C);
  if (!B) {
    return A
  }
  var D;
  for (D in B) {
    A[D] = true
  }
  return A
};
Set.intersect = function(C, B) {
  var A = new Set();
  var D;
  for (D in C) {
    if (D in B) {
      A[D] = true
    }
  }
  return A
};
Set.add = function(B, A) {
  B[A] = true;
  return B
};
Set.remove = function(B, A) {
  delete B[A];
  return B
};
Set.toArray = function(C) {
  var B;
  var A = [];
  for (B in C) {
    A.push(B)
  }
  return A
};
Set.forEach = function(E, C, B) {
  var D;
  var A = 0;
  for (D in E) {
    C.call(B, D, A++)
  }
};
var $S = Set;
coherent.defineError = function(B) {
  function A(C) {
    this.message = C
  }
  A.prototype = new Error;
  A.prototype.constructor = A;
  A.prototype.name = B;
  return A
};
var InvalidArgumentError = coherent.defineError("InvalidArgumentError");
coherent.findTransformerWithName = function(transformerName) {
  if (!this.namedTransformers) {
    this.namedTransformers = {}
  }
  var valueTransformer = this.namedTransformers[transformerName.toLowerCase()];
  if (valueTransformer) {
    return valueTransformer
  }
  try {
    valueTransformer = eval("new " + transformerName + "()");
    this.namedTransformers[transformerName.toLowerCase()] = valueTransformer;
    return valueTransformer
  } catch(e) {
    throw new InvalidArgumentError("The transformerName argument does not specify a valid ValueTransformer instance or constructor: " + transformerName)
  }
};
coherent.registerTransformerWithName = function(valueTransformer, name) {
  if ("string" == typeof(valueTransformer)) {
    name = valueTransformer;
    var valueTransformerClassName = valueTransformer;
    try {
      valueTransformer = eval(valueTransformerClassName)
    } catch(e) {
      throw new InvalidArgumentError("The valueTransformer argument does not specify a valid ValueTransformer instance or constructor: " + valueTransformerClassName)
    }
    if ("function" == typeof(valueTransformer)) {
      valueTransformer = new valueTransformer()
    }
  }
  if (!valueTransformer.transformedValue) {
    throw new InvalidArgumentError("The valueTransformer argument does not support the ValueTransformer method transformedValue")
  }
  if (!this.namedTransformers) {
    this.namedTransformers = {}
  }
  name = name.toLowerCase();
  this.namedTransformers[name] = valueTransformer
};
coherent.NotTransformer = {};
coherent.NotTransformer.transformedValue = function(A) {
  return (A ? false: true)
};
coherent.NotTransformer.reverseTransformedValue = function(A) {
  return !! A
};
coherent.registerTransformerWithName(coherent.NotTransformer, "Not");
coherent.BooleanTransformer = function(A, B) {
  this.trueValue = A;
  this.falseValue = B
};
coherent.BooleanTransformer.prototype.transformedValue = function(A) {
  return (A == this.trueValue)
};
coherent.BooleanTransformer.prototype.reverseTransformedValue = function(A) {
  return (A ? this.trueValue: this.falseValue)
};
coherent.RegexTransformer = function(A) {
  this.trueRegex = A
};
coherent.RegexTransformer.prototype.transformedValue = function(A) {
  return this.trueRegex.test(A)
};
coherent.GenericTransformer = function(A, B) {
  this.modelValues = A;
  this.displayValues = B
};
coherent.GenericTransformer.prototype.transformedValue = function(B) {
  var A = this.modelValues.indexOf(B);
  if ( - 1 == A) {
    return undefined
  } else {
    return this.displayValues[A]
  }
};
coherent.GenericTransformer.prototype.reverseTransformedValue = function(B) {
  var A = this.displayValues.indexOf(B);
  if ( - 1 == A) {
    return undefined
  } else {
    return this.modelValues[A]
  }
};
coherent.TruncatingTransformer = function(A) {
  this.max = A || 50
};
coherent.TruncatingTransformer.prototype.ellipsis = String.fromCharCode(8230);
coherent.TruncatingTransformer.prototype.transformedValue = function(C) {
  if (!C && 0 !== C) {
    return C
  }
  C = "" + C;
  var A = C.length;
  if (A <= this.max) {
    return C
  }
  var B = this.max / 2 - 2;
  return [C.substr(0, B), this.ellipsis, C.substr(A - B)].join(" ")
};
coherent.Truncated = new coherent.TruncatingTransformer(50);
coherent.registerTransformerWithName(coherent.Truncated, "Truncated");
var Class = (function() {
  function D(G, J) {
    var H;
    if (!G && !J) {
      return G
    }
    if (!G) {
      H = function() {
        J.apply(this, arguments)
      }
    } else {
      var I = /this\.base/.test(G);
      if (!I && !J) {
        return G
      }
      if (!I) {
        H = function() {
          J.call(this);
          G.apply(this, arguments)
        }
      } else {
        H = function() {
          var K = this.base;
          this.base = J ||
          function() {};
          try {
            G.apply(this, arguments)
          } finally {
            this.base = K
          }
        }
      }
    }
    H.valueOf = function() {
      return G
    };
    H.toString = function() {
      return String(G)
    };
    return H
  }
  function C(G, I) {
    if (G && !(G instanceof Function)) {
      throw new Error("Invalid constructor")
    }
    if (I && !(I instanceof Function)) {
      throw new Error("Invalid superclass")
    }
    I = I ? I.valueOf() : null;
    G = D(G, I);
    var H;
    if (G) {
      H = function() {
        G.apply(this, arguments);
        if (this.__postConstruct instanceof Function) {
          this.__postConstruct()
        }
      }
    } else {
      H = function() {
        if (this.__postConstruct instanceof Function) {
          this.__postConstruct()
        }
      }
    }
    H.valueOf = function() {
      return G
    };
    H.toString = function() {
      return String(G || H)
    };
    return H
  }
  function B(H) {
    function G() {}
    G.prototype = H.prototype;
    return new G()
  }
  function E(I, G) {
    if (!I || !/this\.base/.test(I)) {
      return I
    }
    function H() {
      try {
        var J = this.base;
        this.base = G ||
        function() {};
        return I.apply(this, arguments)
      } finally {
        this.base = J
      }
    }
    H.valueOf = function() {
      return I
    };
    H.toString = function() {
      return String(I)
    };
    return H
  }
  function F(I, G, J) {
    var H = I[G];
    if (H instanceof Function && J instanceof Function && H.valueOf() != J.valueOf()) {
      J = E(J, H)
    }
    I[G] = J;
    return J
  }
  function A(H) {
    var G;
    for (G = H.superclass; G; G = G.superclass) {
      if ("__subclassCreated" in G) {
        G.__subclassCreated(H)
      }
    }
  }
  return {
    create: function(J, H) {
      var G;
      var I = {};
      switch (arguments.length) {
      case 0:
        throw new TypeError("Missing superclass and declaration arguments");
      case 1:
        H = J;
        J = undefined;
        break;
      default:
        I = B(J);
        break
      }
      if ("function" == typeof(H)) {
        H = H();
        if (!H) {
          throw new Error("Class declaration function did not return a prototype")
        }
      }
      if (H.hasOwnProperty("constructor")) {
        G = H.constructor;
        delete H.constructor
      }
      G = C(G, J);
      G.prototype = I;
      G.prototype.constructor = G;
      G.superclass = J;
      this.extend(G, H);
      A(G);
      return G
    },
    findPropertyName: function(I, G) {
      for (var H in I) {
        if (I[H] === G) {
          return H
        }
      }
      return null
    },
    extend: (function() {
      if (coherent.Support.Properties) {
        return function(G, H) {
          var L = G.prototype;
          var I;
          for (var M in H) {
            var K = H.__lookupGetter__(M);
            var J = H.__lookupSetter__(M);
            if (K || J) {
              K && L.__defineGetter__(M, K);
              J && L.__defineSetter__(M, J)
            } else {
              F(L, M, H[M])
            }
          }
          return G
        }
      } else {
        return function(G, H) {
          var I = G.prototype;
          for (var J in H) {
            F(I, J, H[J])
          }
        }
      }
    })()
  }
})();
coherent.Error = Class.create({
  constructor: function(A) {
    Object.applyDefaults(this, A)
  }
});
coherent.KeyInfo = Class.create({
  constructor: function(D, B) {
    var A = coherent.KVO.getPropertyMethodsForKeyOnObject(B, D);
    this.__uid = [B, coherent.generateUid()].join("_");
    this.reader = A.getter;
    this.mutator = A.mutator;
    this.validator = A.validator;
    this.key = B;
    this.mutable = ((this.mutator || !this.reader) ? true: false);
    if (!this.reader && !this.mutator) {
      this.mutable = true
    }
    this.changeCount = 0;
    var C = A.value;
    if (!C) {
      return
    }
    var E = coherent.typeOf(C);
    if (E in coherent.KVO.typesOfKeyValuesToIgnore || !C._addParentLink) {
      return
    }
    C._addParentLink(D, this)
  },
  get: function(B) {
    if (this.reader) {
      return this.reader.call(B)
    }
    var A;
    if (this.key in B) {
      A = B[this.key]
    } else {
      A = null
    }
    if (A && A._addParentLink) {
      A._addParentLink(B, this)
    }
    return A
  },
  set: function(B, A) {
    if (this.mutator) {
      this.mutator.call(B, A)
    } else {
      B.willChangeValueForKey(this.key, this);
      B[this.key] = A;
      B.didChangeValueForKey(this.key, this)
    }
  },
  unlinkParentLink: function() {
    if (!this.parentLink) {
      return
    }
    this.parentLink.observer = null;
    this.parentLink.callback = null;
    this.parentLink = null
  }
});
coherent.ChangeType = {
  setting: 0,
  insertion: 1,
  deletion: 2,
  replacement: 3
};
coherent.ChangeNotification = Class.create({
  constructor: function(D, A, E, C, B) {
    this.object = D;
    this.changeType = A;
    this.newValue = E;
    this.oldValue = C;
    this.indexes = B;
    this.objectKeyPath = []
  },
  toString: function() {
    var A = "[ChangeNotification changeType: ";
    switch (this.changeType) {
    case coherent.ChangeType.setting:
      A += "setting";
      break;
    case coherent.ChangeType.insertion:
      A += "insertion";
      break;
    case coherent.ChangeType.deletion:
      A += "deletion";
      break;
    case coherent.ChangeType.replacement:
      A += "replacement";
      break;
    default:
      A += "<<unknown>>";
      break
    }
    A += " newValue=" + this.newValue + " oldValue=" + this.oldValue + (this.indexes ? " indexes=" + this.indexes.join(", ") : "") + "]";
    return A
  }
});
coherent.ObserverEntry = Class.create({
  constructor: function(A, C, B) {
    this.observer = A;
    this.callback = C;
    this.context = B
  },
  observeChangeForKeyPath: function(A, B) {
    if (!this.callback || !this.observer || -1 !== A.objectKeyPath.indexOf(this.observer)) {
      return
    }
    this.callback.call(this.observer, A, B, this.context)
  }
});
coherent.KVO = Class.create({
  constructor: function() {},
  setValueForKeyPath: function(B, C) {
    if (!C || 0 === C.length) {
      throw new InvalidArgumentError("keyPath may not be empty")
    }
    if ("string" == typeof(C)) {
      C = C.split(".")
    }
    if (1 == C.length) {
      this.setValueForKey(B, C[0]);
      return
    }
    if ("@" == C[0].charAt(0)) {
      return
    }
    var A = this.valueForKey(C[0]);
    if (!A) {
      return
    }
    A.setValueForKeyPath(B, C.slice(1))
  },
  setValueForKey: function(B, A) {
    if (!A || 0 === A.length) {
      throw new InvalidArgumentError("key may not be empty")
    }
    var C = this.infoForKey(A);
    if (!C || !C.mutable) {
      return
    }
    C.set(this, B)
  },
  valueForKeyPath: function(D) {
    if (!D || 0 === D.length) {
      throw new InvalidArgumentError("keyPath may not be empty")
    }
    if ("string" == typeof(D)) {
      D = D.split(".")
    }
    if (1 == D.length) {
      return this.valueForKey(D[0])
    }
    if ("@" == D[0].charAt(0)) {
      var B = D[0].substr(1);
      var A = this.valueForKeyPath(D.slice(1));
      return coherent.ArrayOperator[B](A)
    }
    var C = this.valueForKey(D[0]);
    if ("undefined" === typeof(C) || null === C) {
      return undefined
    }
    return C.valueForKeyPath(D.slice(1))
  },
  valueForKey: function(A) {
    if (!A || 0 === A.length) {
      throw new InvalidArgumentError("the key is empty")
    }
    var B = this.infoForKey(A);
    if (!B) {
      return null
    }
    return B.get(this)
  },
  validateValueForKeyPath: function(B, C) {
    if (!C || 0 === C.length) {
      throw new InvalidArgumentError("keyPath may not be empty")
    }
    if ("string" == typeof(C)) {
      C = C.split(".")
    }
    if (1 == C.length) {
      return this.validateValueForKey(B, C[0])
    }
    var A = this.valueForKey(C[0]);
    if ("undefined" === typeof(A) || null === A) {
      return B
    }
    return A.validateValueForKeyPath(B, C.slice(1))
  },
  validateValueForKey: function(B, A) {
    if (!A || !A.length) {
      throw new InvalidArgumentError("missing key")
    }
    var C = this.infoForKey(A);
    if (!C.validate) {
      return true
    }
    return C.validate(B)
  },
  observeChildObjectChangeForKeyPath: function(D, C, A) {
    if (coherent.KVO.kAllPropertiesKey != C) {
      C = A + "." + C
    } else {
      C = A
    }
    var B = Object.clone(D);
    B.object = this;
    this.notifyObserversOfChangeForKeyPath(B, C)
  },
  infoForKeyPath: function(C) {
    if (!C || 0 === C.length) {
      throw new InvalidArgumentError("keyPath is empty")
    }
    if ("string" == typeof(C)) {
      C = C.split(".")
    }
    if (1 == C.length) {
      return this.infoForKey(C[0])
    } else {
      if ("@" == C[0].charAt(0)) {
        var B = new coherent.KeyInfo(null, null);
        B.mutable = false;
        return B
      } else {
        var A = this.valueForKey(C[0]);
        if (!A) {
          return undefined
        }
        if (!A.infoForKeyPath) {
          return undefined
        }
        return A.infoForKeyPath(C.slice(1))
      }
    }
  },
  infoForKey: function(A) {
    var B;
    if (!this.__keys) {
      this.__keys = {}
    }
    if (coherent.KVO.kAllPropertiesKey == A) {
      return null
    }
    B = this.__keys[A];
    if (B) {
      return B
    }
    B = new coherent.KeyInfo(this, A);
    this.__keys[A] = B;
    return B
  },
  setKeysTriggerChangeNotificationsForDependentKey: function(D, C) {
    if (!D || !D.length) {
      throw new InvalidArgumentError("keys array is not valid")
    }
    if (!C) {
      throw new InvalidArgumentError("dependentKey can not be null")
    }
    if ( - 1 !== C.indexOf(".")) {
      throw new InvalidArgumentError("dependentKey may not be a key path")
    }
    var B;
    var F;
    var A;
    var E;
    if (!this.__dependentKeys) {
      this.__dependentKeys = {}
    }
    for (A = 0; A < D.length; ++A) {
      B = D[A];
      if (!B) {
        throw new InvalidArgumentError("key at index " + A + " was null")
      }
      if (! (B in this.__dependentKeys)) {
        this.__dependentKeys[B] = []
      }
      coherent.KVO.getPropertyMethodsForKeyOnObject(B, this);
      E = this.__dependentKeys[B];
      if ( - 1 == E.indexOf(C)) {
        E.push(C)
      }
    }
  },
  mutableKeys: function() {
    var D = [];
    var B;
    var A;
    var C;
    if ("__mutableKeys" in this && this.__mutableKeys.concat) {
      return this.__mutableKeys
    }
    var E = Set.union(coherent.KVO.keysToIgnore, this.__keysToIgnore);
    for (B in this) {
      if (B in E || "__" === B.substr(0, 2)) {
        continue
      }
      A = this[B];
      if ("function" !== typeof(A)) {
        D.push(B);
        continue
      }
      if (1 !== A.length || "set" !== B.substr(0, 3)) {
        continue
      }
      C = B.charAt(3);
      if (C !== C.toUpperCase()) {
        continue
      }
      B = C.toLowerCase() + B.substr(4);
      if ( - 1 === D.indexOf(B)) {
        D.push(B)
      }
    }
    return D
  },
  initialiseKeyValueObserving: function() {
    this.__uid = coherent.generateUid();
    this.__observers = {}
  },
  _addParentLink: function(D, E, C) {
    if (!this.hasOwnProperty("__observers")) {
      this.initialiseKeyValueObserving()
    }
    var B = this.__observers[coherent.KVO.kAllPropertiesKey];
    if (!B) {
      B = this.__observers[coherent.KVO.kAllPropertiesKey] = {}
    }
    C = C || E.__uid;
    var A = new coherent.ObserverEntry(D, D.observeChildObjectChangeForKeyPath, E ? E.key: "");
    if (C in B) {
      return
    }
    B[C] = A;
    if (!E) {
      return
    }
    E.unlinkParentLink();
    E.parentLink = A
  },
  _removeParentLink: function(C, D, B) {
    if (!this.__observers) {
      return
    }
    var A = this.__observers[coherent.KVO.kAllPropertiesKey];
    if (!A) {
      A = this.__observers[coherent.KVO.kAllPropertiesKey] = {}
    }
    B = B || D.__uid;
    if (D && D.parentLink === A[B]) {
      D.unlinkParentLink()
    }
    delete A[B]
  },
  addObserverForKeyPath: function(A, E, D, B) {
    if (!D || 0 === D.length) {
      throw new InvalidArgumentError("keyPath is empty")
    }
    if (!A) {
      throw new InvalidArgumentError("Observer may not be null")
    }
    if (!E) {
      E = A.observeChangeForKeyPath
    }
    if (!E) {
      throw new InvalidArgumentError("No callback method specified")
    }
    if (!this.hasOwnProperty("__observers")) {
      this.initialiseKeyValueObserving()
    }
    if (!this.__observers[D]) {
      this.infoForKeyPath(D);
      this.__observers[D] = []
    }
    var C = new coherent.ObserverEntry(A, E, B);
    this.__observers[D].push(C)
  },
  removeObserverForKeyPath: function(C, F) {
    if (!F || 0 === F.length) {
      throw new InvalidArgumentError("keyPath may not be empty")
    }
    if (!C) {
      throw new InvalidArgumentError("Observer may not be null")
    }
    if (!this.__observers || !this.__observers[F]) {
      return
    }
    var E = this.__observers[F];
    var B = -1;
    var D;
    var A = E.length;
    for (B = 0; B < A; ++B) {
      D = E[B];
      if (D.observer == C) {
        E.splice(B, 1);
        return
      }
    }
  },
  willChangeValueForKey: function(A, B) {
    if (!A) {
      throw new InvalidArgumentError("key may not be null")
    }
    B = B || this.infoForKey(A);
    if (!B) {
      return
    }
    if (1 !== ++B.changeCount) {
      return
    }
    B.previousValue = B.get(this)
  },
  didChangeValueForKey: function(B, E) {
    if (!B) {
      throw new InvalidArgumentError("key may not be null")
    }
    E = E || this.infoForKey(B);
    if (!E) {
      return
    }
    if (0 !== --E.changeCount) {
      return
    }
    var C = E.get(this);
    var A = E.previousValue;
    E.previousValue = null;
    if (C === A) {
      return
    }
    var D = new coherent.ChangeNotification(this, coherent.ChangeType.setting, C, A);
    this.notifyObserversOfChangeForKeyPath(D, B);
    if (A && A._removeParentLink) {
      A._removeParentLink(this, E)
    }
    if (C && C._addParentLink) {
      C._addParentLink(this, E)
    }
  },
  willChangeValuesAtIndexesForKey: function(A, B, D, F) {
    if (!D) {
      throw new InvalidArgumentError("key may not be null")
    }
    F = F || this.infoForKey(D);
    if (!F) {
      return
    }
    if (1 !== ++F.changeCount) {
      return
    }
    var C = coherent.ChangeType;
    var E;
    switch (A) {
    case C.insertion:
      F.previousValue = [];
      break;
    case C.deletion:
      E = F.get();
      F.previousValue = E.objectsAtIndexes(B);
      break;
    case C.replacement:
      break;
    default:
      throw new InvalidArgumentError("invalid change type");
      break
    }
  },
  didChangeValuesAtIndexesForKey: function(A, B, C, D) {
    if (!C) {
      throw new InvalidArgumentError("key may not be null")
    }
    D = D || this.infoForKey(C);
    if (!D) {
      return
    }
    if (0 !== --D.changeCount) {
      return
    }
  },
  notifyObserversOfChangeForKeyPath: function(K, V) {
    if (!V) {
      throw new InvalidArgumentError("keyPath may not be null")
    }
    if (!this.__observers) {
      return
    }
    var G;
    var S;
    var Q;
    S = this.__observers[coherent.KVO.kAllPropertiesKey];
    if (S) {
      var C = Object.clone(K);
      var B = K.objectKeyPath.length;
      K.objectKeyPath.push(this);
      try {
        for (G in S) {
          var P = S[G];
          P.observeChangeForKeyPath(C, V)
        }
      } finally {
        K.objectKeyPath.length = B
      }
    }
    if (coherent.KVO.kAllPropertiesKey == V) {
      return
    }
    S = this.__observers[V];
    if (S && S.length) {
      Q = S.length;
      for (G = 0; G < Q; ++G) {
        S[G].observeChangeForKeyPath(K, V)
      }
    }
    var U = V + ".";
    var J = U.length;
    var A;
    var D;
    var F;
    var R;
    var L;
    for (D in this.__observers) {
      if (D.substr(0, J) != U) {
        continue
      }
      S = this.__observers[D];
      if (!S || !S.length) {
        continue
      }
      A = D.substr(J);
      R = K.oldValue;
      if (R && R.valueForKeyPath) {
        R = R.valueForKeyPath(A)
      } else {
        R = null
      }
      L = K.newValue;
      if (L && L.valueForKeyPath) {
        L = L.valueForKeyPath(A)
      } else {
        L = null
      }
      F = new coherent.ChangeNotification(K.object, K.changeType, L, R, K.indexes);
      Q = S.length;
      for (G = 0; G < Q; ++G) {
        S[G].observeChangeForKeyPath(F, D)
      }
    }
    if (this.__dependentKeys && (V in this.__dependentKeys)) {
      var N = this.__dependentKeys[V];
      var T;
      var E;
      var H;
      var I = 0;
      var O;
      var M = this;
      Q = N.length;
      for (I = 0; I < Q; ++I) {
        H = N[I];
        T = M.valueForKey(H);
        E = new coherent.ChangeNotification(M, coherent.ChangeType.setting, T, null);
        M.notifyObserversOfChangeForKeyPath(E, H)
      }
    }
  }
});
coherent.KVO.kAllPropertiesKey = "*";
coherent.KVO.keysToIgnore = $S("__keys", "__observers", "__keysToIgnore", "__dependentKeys", "__mutableKeys");
coherent.KVO.typesOfKeyValuesToIgnore = $S("string", "number", "boolean", "date", "regex", "function");
coherent.KVO.getPropertyMethodsForKeyOnObject = (function() {
  function B(H, F) {
    F = F || "__kvo_prop_" + H;
    var G = {
      getter: function() {
        var I = null;
        if (F in this) {
          I = this[F]
        }
        var J = this.__keys ? this.__keys[H] : null;
        if (!J) {
          return I
        }
        if (I && I._addParentLink) {
          I._addParentLink(this, J)
        } else {
          J.unlinkParentLink()
        }
        return I
      },
      mutator: function(I) {
        this.willChangeValueForKey(H);
        if ("undefined" === typeof(I)) {
          I = null
        }
        this[F] = I;
        this.didChangeValueForKey(H)
      }
    };
    G.mutator.__key = H;
    G.getter.__key = H;
    return G
  }
  function C(H, G) {
    function F(I) {
      this.willChangeValueForKey(G);
      H.call(this, I);
      this.didChangeValueForKey(G)
    }
    F.__key = G;
    F.valueOf = function() {
      return H
    };
    F.toString = function() {
      return String(H)
    };
    return F
  }
  function D(F, H) {
    function G() {
      var I = F.call(this);
      var J = this.__keys ? this.__keys[H] : null;
      if (!J) {
        return I
      }
      if (I && I._addParentLink) {
        I._addParentLink(this, J)
      } else {
        J.unlinkParentLink()
      }
      return I
    }
    G.__key = H;
    G.valueOf = function() {
      return F
    };
    G.toString = function() {
      return String(F)
    };
    return G
  }
  function E(T, K) {
    var M = K.constructor.prototype;
    var J = (M == K);
    var L = (M != Object.prototype && M != coherent.KVO.prototype) ? M: K;
    var U = T.titleCase();
    var P = "get" + U;
    var Q = "set" + U;
    var I = "validate" + U;
    var O;
    var H;
    var S;
    var F = K[I];
    var N = ("undefined" !== typeof(O = K.__lookupGetter__(T)) && "undefined" !== typeof(H = K.__lookupSetter__(T)));
    if (!N) {
      P = (P in K) ? P: T;
      O = K[P];
      H = K[Q]
    }
    if ("function" !== typeof(O)) {
      var R = "__kvo_prop_" + T;
      var G = B(T, R);
      if (T in K) {
        S = K[R] = ("undefined" == typeof(O) ? null: O);
        delete K[T]
      }
      O = G.getter;
      H = G.mutator;
      N = true
    } else {
      if (0 !== O.length) {
        O = null
      }
      if (H && 1 !== H.length) {
        H = null
      }
      if (O && !J) {
        S = O.valueOf().call(K)
      }
      if (O && T !== O.__key) {
        O = D(O, T)
      }
      if (H && T !== H.__key) {
        H = C(H, T)
      }
    }
    if (N) {
      L.__defineGetter__(T, O);
      L.__defineSetter__(T, H)
    } else {
      if (O) {
        if (K.hasOwnProperty(P)) {
          K[P] = O
        } else {
          L[P] = O
        }
      }
      if (H) {
        if (K.hasOwnProperty(Q)) {
          K[Q] = H
        } else {
          L[Q] = H
        }
      }
    }
    return {
      getter: O,
      mutator: H,
      validator: F,
      value: S
    }
  }
  function A(Q, J) {
    var L = J.constructor.prototype;
    var I = (L == J);
    var K = (L != Object.prototype && L != coherent.KVO.prototype) ? L: J;
    var R = Q.titleCase();
    var O = "set" + R;
    var N = "get" + R;
    var H = "validate" + R;
    N = (N in J) ? N: Q;
    var M = J[N];
    var G = J[O];
    var F = J[H];
    var P;
    if ("function" !== typeof(M)) {
      if (Q in J) {
        P = M
      }
      M = null;
      G = null
    } else {
      if (0 !== M.length) {
        M = null
      }
      if (G && 1 !== G.length) {
        G = null
      }
      if (M && !I) {
        P = M.valueOf().call(J)
      }
      if (M && Q !== M.__key) {
        M = D(M, Q)
      }
      if (G && Q !== G.__key) {
        G = C(G, Q)
      }
    }
    if (M) {
      if (J.hasOwnProperty(N)) {
        J[N] = M
      } else {
        K[N] = M
      }
    }
    if (G) {
      if (J.hasOwnProperty(O)) {
        J[O] = G
      } else {
        K[O] = G
      }
    }
    return {
      getter: M,
      mutator: G,
      validator: F,
      value: P
    }
  }
  if (coherent.Support.Properties) {
    return E
  } else {
    return A
  }
})();
coherent.KVO.adapt = function(B) {
  if (!B) {
    throw new InvalidArgumentError("Can't adapt a null object")
  }
  var A;
  for (A in coherent.KVO.prototype) {
    if (A in B) {
      continue
    }
    B[A] = coherent.KVO.prototype[A]
  }
  if ("keyDependencies" in B && !("__dependentKeys" in B)) {
    var C = B.keyDependencies;
    for (A in C) {
      B.setKeysTriggerChangeNotificationsForDependentKey(C[A], A)
    }
  }
  return B
};
coherent.KVO.adaptTree = function(C) {
  coherent.KVO.adapt(C);
  var B;
  var A;
  for (B in C) {
    if (B in coherent.KVO.keysToIgnore) {
      continue
    }
    A = C[B];
    if (!A) {
      continue
    }
    if (coherent.typeOf(A) in coherent.KVO.typesOfKeyValuesToIgnore) {
      continue
    }
    coherent.KVO.adaptTree(A)
  }
  return C
};
coherent.KVO.__subclassCreated = function(A) {
  var D = A.superclass.prototype;
  var B = A.prototype;
  if (D.keyDependencies === B.keyDependencies) {
    return
  }
  var E = B.keyDependencies || {};
  for (var C in E) {
    B.setKeysTriggerChangeNotificationsForDependentKey(E[C], C)
  }
};
coherent.Bindable = Class.create(coherent.KVO, {
  constructor: function() {
    this.bindings = {}
  },
  exposedBindings: [],
  bindNameToKeyPath: function(B, F, A, D) {
    var C;
    var E;
    if (!this.bindings) {
      this.bindings = {}
    }
    C = this["observe" + B.titleCase() + "Change"];
    if (!C) {
      return
    }
    if (this.bindings[B]) {
      this.bindings[B].unbind()
    }
    if ("*." == F.substr(0, 2)) {
      E = coherent.Binding.bindingFromString(F.substr(2), A)
    } else {
      E = coherent.Binding.bindingFromString(F)
    }
    if (D) {
      E.update()
    }
    E.observerFn = C.bind(this);
    this.bindings[B] = E;
    if (!D) {
      E.update()
    }
  }
});
coherent.Bindable.__subclassCreated = (function() {
  function A(G, H) {
    var E = H.titleCase();
    var F = "get" + E;
    var C = "set" + E;
    var D = "__" + H;
    if (H in G || F in G) {
      return
    }
    G[F] = function() {
      if (H in this.bindings) {
        return this.bindings[H].value()
      }
      return this[D]
    };
    G[C] = function(I) {
      if (H in this.bindings) {
        this.bindings[H].setValue(I)
      } else {
        this[D] = I
      }
    }
  }
  function B(F, G) {
    var E = G.titleCase();
    var D = "set" + E;
    var C = "observe" + E + "Change";
    if (C in F) {
      return
    }
    F[C] = function(J, I, H) {
      if (coherent.ChangeType.setting !== J.changeType) {
        return
      }
      this[D](J.newValue)
    }
  }
  return function(C) {
    var E = C.superclass.prototype;
    var D = C.prototype;
    if (E.exposedBindings === D.exposedBindings) {
      return
    }
    D.exposedBindings = D.exposedBindings.concat(E.exposedBindings)
  }
})();
coherent.Binding = Class.create({
  constructor: function(B, C, A) {
    if (0 === arguments.length) {
      return
    }
    this.object = B;
    this.keyPath = C;
    this.transformer = A;
    this.cachedValue = this.transformedValue(this.object.valueForKeyPath(this.keyPath))
  },
  bind: function() {
    this.object.addObserverForKeyPath(this, this.observeChangeForKeyPath, this.keyPath)
  },
  unbind: function() {
    this.object.removeObserverForKeyPath(this, this.keyPath)
  },
  transformedValue: function(A) {
    if (!this.transformer) {
      return A
    }
    return this.transformer.transformedValue(A)
  },
  setValue: function(A) {
    if (this.cachedValue === A) {
      return
    }
    this.cachedValue = A;
    if (this.transformer && this.transformer.reverseTransformedValue) {
      A = this.transformer.reverseTransformedValue(A)
    }
    this.object.setValueForKeyPath(A, this.keyPath)
  },
  mutable: function() {
    var A = this.object.infoForKeyPath(this.keyPath);
    return A && A.mutable
  },
  value: function() {
    return this.cachedValue
  },
  update: function() {
    var A = new coherent.ChangeNotification(this.object, coherent.ChangeType.setting, this.value());
    this.observerFn(A, this.keyPath)
  },
  observerFn: function(C, B, A) {},
  observeChangeForKeyPath: function(D, C, A) {
    var B = Object.clone(D);
    B.newValue = this.transformedValue(D.newValue);
    if (B.newValue === this.cachedValue) {
      return
    }
    if (coherent.ChangeType.setting === D.changeType) {
      this.cachedValue = B.newValue
    }
    if (D.oldValue) {
      B.oldValue = this.transformedValue(D.oldValue)
    }
    try {
      this.updating = true;
      this.observerFn(B, C, A)
    } finally {
      this.updating = false
    }
  }
});
coherent.Binding.bindingRegex = /^(.*?)(?:\((.*)\))?$/;
coherent.Binding.compoundRegex = /^\s*([^&|].*?)\s*(\&\&|\|\|)\s*(\S.+)\s*$/;
coherent.Binding.bindingFromString = function(D, C) {
  var B;
  var E;
  B = D.match(coherent.Binding.compoundRegex);
  if (B && 4 == B.length) {
    E = new coherent.CompoundBinding(B[2], coherent.Binding.bindingFromString(B[1], C), coherent.Binding.bindingFromString(B[3], C));
    E.bind();
    return E
  }
  B = D.match(coherent.Binding.bindingRegex);
  if (!B || B.length < 3) {
    throw new InvalidArgumentError("bindingString isn't in correct format")
  }
  var F = B[1];
  var A;
  if (B[2]) {
    A = coherent.findTransformerWithName(B[2])
  }
  E = new coherent.Binding(C || coherent.dataModel, F, A);
  E.bind();
  return E
};
coherent.CompoundBinding = Class.create(coherent.Binding, {
  constructor: function(A, C, B) {
    this.base();
    if (!A || !C || !B) {
      throw new InvalidArgumentError("No parameters to CompoundBinding initialiser are optional")
    }
    this.operation = A;
    this.left = C;
    this.right = B;
    this.left.observerFn = this.right.observerFn = this.observeChange.bind(this);
    switch (this.operation) {
    case coherent.CompoundBinding.AND:
      this.cachedValue = this.left.value() && this.right.value();
      break;
    case coherent.CompoundBinding.OR:
      this.cachedValue = this.left.value() || this.right.value();
      break;
    default:
      throw new InvalidArgumentError("Unknown operation value for CompoundBinding");
      break
    }
  },
  bind: function() {
    this.left.bind();
    this.right.bind()
  },
  unbind: function() {
    this.left.unbind();
    this.right.unbind()
  },
  mutable: function() {
    return false
  },
  setValue: function(A) {
    throw new Error("Attempting to set value of CompoundBinding")
  },
  observeChange: function(C, B) {
    var A = this.cachedValue;
    switch (this.operation) {
    case coherent.CompoundBinding.AND:
      this.cachedValue = this.left.value() && this.right.value();
      break;
    case coherent.CompoundBinding.OR:
      this.cachedValue = this.left.value() || this.right.value();
      break;
    default:
      throw new Error("Unknown operation value for CompoundBinding");
      break
    }
    if (A === this.cachedValue) {
      return
    }
    this.update()
  }
});
coherent.CompoundBinding.AND = "&&";
coherent.CompoundBinding.OR = "||";
Class.extend(Array, {
  valueForKey: function(C) {
    if (!C || 0 === C.length) {
      throw new InvalidArgumentError("the key is empty")
    }
    if ("@count" == C) {
      return this.length
    }
    var D = new Array(this.length);
    var B;
    var A = this.length;
    for (B = 0; B < A; ++B) {
      D[B] = this[B].valueForKey(C)
    }
    return D
  },
  setValueForKey: function(D, C) {
    if (!C || 0 === C.length) {
      throw new InvalidArgumentError("key is empty")
    }
    var B;
    var A = this.length;
    for (B = 0; B < A; ++B) {
      this[B].setValueForKey(D, C)
    }
  },
  indexesOfObjects: function(E) {
    var D;
    var B = E.length;
    var A = [];
    var C;
    for (D = 0; D < B; ++D) {
      C = this.indexOf(E[D]);
      if ( - 1 === C) {
        continue
      }
      A.push(C)
    }
    return A
  },
  addObject: function(B) {
    var A = this.length;
    var C = new coherent.ChangeNotification(this, coherent.ChangeType.insertion, [B], null, [A]);
    this.push(B);
    this.observeElementAtIndex(A);
    this.notifyObserversOfChangeForKeyPath(C, coherent.KVO.kAllPropertiesKey)
  },
  addObjects: function(C) {
    var B;
    var A = C.length;
    for (B = 0; B < A; ++B) {
      this.addObject(C[B])
    }
  },
  insertObjectAtIndex: function(B, A) {
    if (A < 0 || A >= this.length) {
      throw new RangeError("index must be within the bounds of the array")
    }
    var C = new coherent.ChangeNotification(this, coherent.ChangeType.insertion, [B], null, [A]);
    this.splice(A, 0, B);
    this.observeElementAtIndex(A);
    this.notifyObserversOfChangeForKeyPath(C, coherent.KVO.kAllPropertiesKey)
  },
  insertObjectsAtIndexes: function(E, C) {
    if (E.length !== C.length) {
      throw new InvalidArgumentError("length of objects and indexes parameters must be equal")
    }
    var A = E.length;
    var D;
    var B;
    for (D = 0; D < A; ++D) {
      B = C[D];
      this.splice(B, 0, E[D]);
      this.observeElementAtIndex(B)
    }
    var F = new coherent.ChangeNotification(this, coherent.ChangeType.insertion, E, null, C);
    this.notifyObserversOfChangeForKeyPath(F, coherent.KVO.kAllPropertiesKey)
  },
  removeObject: function(B) {
    var A = this.indexOf(B);
    if ( - 1 === A) {
      return
    }
    this.removeObjectAtIndex(A)
  },
  removeObjects: function(D) {
    var A = D.length;
    var B;
    for (var C = 0; C < A; ++C) {
      B = this.indexOf(D[C]);
      if ( - 1 === B) {
        continue
      }
      this.removeObjectAtIndex(B)
    }
  },
  removeObjectsAtIndexes: function(B) {
    var A = B.length;
    for (var C = 0; C < A; ++C) {
      this.removeObjectAtIndex(B[C])
    }
  },
  removeObjectAtIndex: function(B) {
    if (B < 0 || B >= this.length) {
      throw new RangeError("index must be within the bounds of the array")
    }
    this.stopObservingElementAtIndex(B);
    var A = this.splice(B, 1);
    var C = new coherent.ChangeNotification(this, coherent.ChangeType.deletion, null, A, [B]);
    this.notifyObserversOfChangeForKeyPath(C, coherent.KVO.kAllPropertiesKey)
  },
  removeAllObjects: function() {
    var D;
    var C = [];
    var A = this.length;
    C.length = A;
    for (D = 0; D < A; ++D) {
      this.stopObservingElementAtIndex(D);
      C[D] = D
    }
    var B = this.splice(0, A);
    var E = new coherent.ChangeNotification(this, coherent.ChangeType.deletion, null, B, C);
    this.notifyObserversOfChangeForKeyPath(E, coherent.KVO.kAllPropertiesKey)
  },
  objectsAtIndexes: function(C) {
    var D;
    var B = [];
    var A = C.length;
    B.length = C.length;
    for (D = 0; D < A; ++D) {
      B[D] = this[C[D]]
    }
    return B
  },
  observeChildObjectChangeForKeyPath: function(F, E, B) {
    var D = F.object;
    var C = this.indexOf(D);
    if ( - 1 === C) {
      D._removeParentLink(this, null, this.__uid);
      return
    }
    var A = new coherent.ChangeNotification(D, coherent.ChangeType.replacement, [F.newValue], [F.previousValue], [C]);
    this.notifyObserversOfChangeForKeyPath(A, E)
  },
  observeElementAtIndex: function(A) {
    var B = this[A];
    if (!B || !B._addParentLink) {
      return
    }
    B._addParentLink(this, null, this.__uid)
  },
  stopObservingElementAtIndex: function(A) {
    var B = this[A];
    if (!B._removeParentLink) {
      return
    }
    B._removeParentLink(this, null, this.__uid)
  },
  initialiseKeyValueObserving: function() {
    var B;
    var A = this.length;
    this.__observers = {};
    this.__uid = coherent.generateUid();
    for (B = 0; B < A; ++B) {
      this.observeElementAtIndex(B)
    }
  }
});
coherent.KVO.adapt(Array.prototype);
coherent.ArrayOperator = {
  avg: function(A) {
    return this.sum(A) / A.length
  },
  count: function(A) {
    throw new InvalidArgumentError("@count operator must end the keyPath")
  },
  distinctUnionOfArrays: function(A) {
    return this.unionOfArrays(A).distinct()
  },
  distinctUnionOfObjects: function(A) {
    return A.distinct()
  },
  max: function(D) {
    var B = null;
    var E;
    var A;
    var C;
    for (E = 0, A = D.length; E < A; ++E) {
      C = D[E];
      if (null === B || C > B) {
        B = C
      }
    }
    return B
  },
  min: function(C) {
    var E = null;
    var D;
    var A;
    var B;
    for (D = 0, A = C.length; D < A; ++D) {
      B = C[D];
      if (null === E || B < E) {
        E = B
      }
    }
    return E
  },
  sum: function(B) {
    var D = 0;
    var A = B.length;
    var C;
    for (C = 0; C < A; ++C) {
      D += B[C]
    }
    return D
  },
  unionOfArrays: function(B) {
    var D = [];
    var A;
    var C;
    for (C = 0, A = B.length; C < A; ++C) {
      D = D.concat(B[C])
    }
    return D
  },
  unionOfObjects: function(A) {
    return A
  }
};
coherent.KVOTable = Class.create(coherent.KVO, {
  valueForKeyPath: function(A) {
    if ("array" === coherent.typeOf(A)) {
      A = A.join(".")
    }
    return this.valueForKey(A)
  },
  setValueForKeyPath: function(A, B) {
    if ("array" === coherent.typeOf(B)) {
      B = B.join(".")
    }
    return this.setValueForKey(A, B)
  },
  infoForKeyPath: function(A) {
    if ("array" === coherent.typeOf(A)) {
      A = A.join(".")
    }
    return this.infoForKey(A)
  }
});
coherent.strings = {
  "marker.input.multipleValues": "Multiple Values",
  "marker.input.placeholder": "",
  "marker.input.noSelection": "No Selection",
  "marker.image.multipleValues": "",
  "marker.image.placeholder": "",
  "marker.image.noSelection": "",
  "marker.text.multipleValues": "Multiple Values",
  "marker.text.placeholder": "",
  "marker.text.noSelection": "No Selection"
};
coherent.localisedString = function(A) {
  if (A in coherent.strings) {
    return coherent.strings[A]
  }
  console.log("Localisation missing string for key: " + A);
  return A
};
var _ = coherent.localisedString;
Object.extend(coherent, {
  registerModelWithName: function(B, A) {
    if (!coherent.dataModel) {
      coherent.dataModel = new coherent.KVO()
    }
    coherent.dataModel.setValueForKey(B, A)
  },
  unregisterModelWithName: function(A) {
    if (!coherent.dataModel) {
      coherent.dataModel = new coherent.KVO();
      return
    }
    delete coherent.dataModel[A]
  },
  DataModel: function(A, B) {
    B = coherent.KVO.adaptTree(B);
    coherent.registerModelWithName(B, A);
    return B
  }
});
coherent.SortDescriptor = Class.create({
  constructor: function(D, A, B) {
    this.keyPath = D;
    this.ascending = A;
    this.comparisonFn = B || this.defaultCompare;
    var C = typeof(this.comparisonFn);
    if ("string" != C && "function" != C) {
      throw new InvalidArgumentError("comparisonFn must be either the name of a method or a function reference")
    }
  },
  resolveComparisonFn: function(B) {
    var A = this.comparisonFn;
    if ("string" === typeof(A)) {
      A = B[A]
    }
    if ("function" !== typeof(A)) {
      throw new TypeError("comparisonFn does not resolve to a function")
    }
    return A
  },
  compareObjects: function(C, B) {
    if (!C.valueForKeyPath || !B.valueForKeyPath) {
      throw new InvalidArgumentError("Objects are not Key Value compliant")
    }
    var E = C.valueForKeyPath(this.keyPath);
    var D = B.valueForKeyPath(this.keyPath);
    var A = this.resolveComparisonFn(E);
    return A.call(E, D)
  },
  defaultCompare: function(A) {
    return coherent.compareValues(this, A)
  },
  reversedSortDescriptor: function() {
    return new coherent.SortDescriptor(this.keyPath, !this.ascending, this.comparisonFn)
  }
});
coherent.Controller = Class.create(coherent.Bindable, {
  constructor: function(A, B) {
    this.base();
    this.__bindingsMap = B;
    this.name = A;
    if (A) {
      coherent.registerModelWithName(this, A)
    }
  },
  __postConstruct: function() {
    var D = this.__bindingsMap || {};
    var B;
    var C;
    var A = this.exposedBindings.length;
    this.__initialising = true;
    for (C = 0; C < A; ++C) {
      B = this.exposedBindings[C];
      if (!D[B]) {
        continue
      }
      this.bindNameToKeyPath(B, D[B], null, true)
    }
    for (B in this.bindings) {
      this.bindings[B].update()
    }
    delete this.__initialising
  }
});
coherent.Markers = {
  MultipleValues: "ThisIsAnUniqueStringThatRepresentsMultipleValues",
  NoSelection: "ThisIsAnUniqueStringThatRepresentsNoSelection"
};
coherent.SelectionProxy = Class.create(coherent.KVO, {
  constructor: function(A) {
    this.controller = A;
    this.mutable = true
  },
  infoForKey: function(B) {
    var A = this.controller.selectedObjects();
    var C = A.infoForKey(B);
    C.mutable &= this.mutable;
    return C
  },
  infoForKeyPath: function(C) {
    var A = this.controller.selectedObjects();
    var B = A.infoForKeyPath(C);
    B.mutable &= this.mutable;
    return B
  },
  translateValue: function(D) {
    if ("array" !== coherent.typeOf(D)) {
      return D
    }
    if (1 === D.length) {
      return D[0]
    }
    var C;
    var A;
    var B = D[0];
    for (C = 1, A = D.length; C < A; ++C) {
      if (0 !== coherent.compareValues(B, D[C])) {
        return coherent.Markers.MultipleValues
      }
    }
    return B
  },
  valueForKey: function(C) {
    var B = this.controller.selectedObjects();
    if (0 === B.length) {
      return coherent.Markers.NoSelection
    }
    var A = B.valueForKey(C);
    return this.translateValue(A)
  },
  valueForKeyPath: function(C) {
    var B = this.controller.selectedObjects();
    if (0 === B.length) {
      return coherent.Markers.NoSelection
    }
    var A = B.valueForKeyPath(C);
    return this.translateValue(A)
  },
  setValueForKey: function(D, C) {
    if (!this.mutable) {
      return
    }
    var B = this.controller.selectedObjects();
    var A = this.valueForKey(C);
    B.setValueForKey(D, C);
    var E = this.valueForKey(C);
    if (A === E) {
      return
    }
    var F = new coherent.ChangeNotification(this, coherent.ChangeType.setting, E, A);
    this.notifyObserversOfChangeForKeyPath(F, C)
  },
  setValueForKeyPath: function(C, F) {
    if (!this.mutable) {
      return
    }
    var B = this.controller.selectedObjects();
    var A = this.valueForKeyPath(F);
    B.setValueForKeyPath(C, F);
    var D = this.valueForKeyPath(F);
    if (A === D) {
      return
    }
    var E = new coherent.ChangeNotification(this, coherent.ChangeType.setting, D, A);
    this.notifyObserversOfChangeForKeyPath(E, F)
  }
});
coherent.ObjectController = Class.create(coherent.Controller, {
  constructor: function(A, B) {
    this.base(A, B);
    this.objectClass = coherent.KVO;
    this.__selectedObjects = [];
    this.__selection = new coherent.SelectionProxy(this)
  },
  observeChildObjectChangeForKeyPath: function(F, E, B) {
    this.base(F, E, B);
    if ("selectedObjects" !== B) {
      return
    }
    var C = "selection." + E;
    var D = this.valueForKeyPath(C);
    var A = new coherent.ChangeNotification(this, coherent.ChangeType.setting, D, null);
    this.notifyObserversOfChangeForKeyPath(A, C)
  },
  keyDependencies: {
    selectedObjects: ["content"],
    selection: ["selectedObjects"]
  },
  exposedBindings: ["editable", "content"],
  editable: function() {
    var A;
    if (this.bindings.editable) {
      A = this.bindings.editable.value()
    } else {
      A = this.__editable || true
    }
    if (this.bindings.content) {
      A &= this.bindings.content.mutable()
    }
    return A
  },
  setEditable: function(A) {
    if (this.bindings.content) {
      A &= this.bindings.content.mutable()
    }
    if (this.bindings.editable) {
      this.bingings.editable.setValue(A)
    } else {
      this.__editable = A
    }
  },
  observeEditableChange: function(A) {
    this.setEditable(A.newValue)
  },
  content: function() {
    if (this.bindings.content) {
      return this.bindings.content.value()
    } else {
      return this.__content
    }
  },
  setContent: function(A) {
    if (this.bindings.content) {
      this.bindings.content.setValue(A)
    } else {
      this.__content = A
    }
    if (!A) {
      this.__selectedObjects = []
    } else {
      this.__selectedObjects = [A]
    }
  },
  observeContentChange: function(A) {
    this.setContent(A.newValue)
  },
  selectedObjects: function() {
    return this.__selectedObjects
  },
  selection: function() {
    return this.__selection
  }
});
coherent.AjaxController = Class.create(coherent.ObjectController, {
  constructor: function(A, B) {
    this.base(A, B);
    this.addObserverForKeyPath(this, this.queryUpdated, "url");
    this.addObserverForKeyPath(this, this.queryUpdated, "method");
    this.queryDelay = 500;
    this.url = "";
    this.method = "GET";
    this.setValueForKey(new coherent.KVO(), "parameters")
  },
  validateParameters: function() {
    return true
  },
  observeChildObjectChangeForKeyPath: function(C, B, A) {
    this.base(C, B, A);
    if ("parameters" === A) {
      this.queryUpdated(C, B, A)
    }
  },
  queryUpdated: function(C, B, A) {
    if (!this.parameters || !this.validateParameters()) {
      return
    }
    this.setValueForKey(true, "queryInProgress");
    if (this.__queryTimer) {
      window.clearTimeout(this.__queryTimer)
    }
    this.__queryTimer = this.performQuery.bindAndDelay(this, this.queryDelay)
  },
  performQuery: function() {
    var A = {
      method: this.method,
      parameters: {},
      onSuccess: this.querySucceeded.bind(this),
      onFailure: this.queryFailed.bind(this),
      onException: this.queryThrew.bind(this),
      onComplete: this.queryComplete.bind(this)
    };
    for (var B in this.parameters) {
      if (this.parameters.hasOwnProperty(B)) {
        A.parameters[B] = this.parameters[B]
      }
    }
    this.__request = new Ajax.Request(this.url, A)
  },
  extractContent: function(A) {
    return A
  },
  queryComplete: function(A) {
    this.setValueForKey(false, "queryInProgress")
  },
  querySucceeded: function(xhr) {
    var obj = eval("(" + xhr.responseText + ")");
    if (!obj) {
      this.queryFailed(xhr);
      return
    }
    coherent.KVO.adaptTree(obj);
    this.setContent(this.extractContent(obj));
    this.setValueForKey(xhr.status, "statusCode");
    this.setValueForKey(undefined, "errorMessage")
  },
  queryFailed: function(A) {
    this.setValueForKey(A.status, "statusCode");
    this.setValueForKey(A.statusText, "errorMessage");
    this.setContent(null)
  },
  queryThrew: function(B, A) {
    this.setValueForKey(B.status, "statusCode");
    this.setValueForKey(A.message, "errorMessage");
    this.setContent(null)
  }
});
function IndexRange(C, A) {
  var B;
  var D = [];
  for (B = C; B <= A; ++B) {
    D.push(B)
  }
  return D
}
coherent.ArrayController = Class.create(coherent.ObjectController, {
  constructor: function(A, B) {
    this.base(A, B)
  },
  keyDependencies: {
    selectedObjects: ["selectionIndexes"],
    selectionIndex: ["selectionIndexes"],
    canRemove: ["editable", "selectionIndexes"],
    canAdd: ["editable"]
  },
  exposedBindings: ["content", "selectionIndexes", "sortDescriptors", "filterPredicate", "contentForMultipleSelection"],
  clearsFilterPredicateOnInsertion: true,
  observeContentChange: function(C) {
    var A;
    var B;
    switch (C.changeType) {
    case coherent.ChangeType.setting:
      this.setContent(C.newValue);
      this.rearrangeObjects();
      break;
    case coherent.ChangeType.insertion:
      this._insertObjectsIntoArrangedObjects(C.newValue);
      break;
    case coherent.ChangeType.deletion:
      this.rearrangeObjects();
      break;
    case coherent.ChangeType.replacement:
      this.rearrangeObjects();
      break;
    default:
      break
    }
  },
  canAdd: function() {
    return this.editable()
  },
  add: function() {
    var A = new(this.objectClass)();
    var B = this.content();
    B.addObject(A)
  },
  canRemove: function() {
    return this.editable() && this.selectionIndexes().length
  },
  remove: function() {
    var A = this.selectedObjects();
    var B = this.content();
    B.removeObjects(A)
  },
  setContent: function(B) {
    var A = this.selectedObjects();
    if (this.bindings.content) {
      this.bindings.content.setValue(B)
    } else {
      this.__content = B
    }
    this.rearrangeObjects(B)
  },
  sortDescriptors: function() {
    if (this.bindings.sortDescriptors) {
      return this.bindings.sortDescriptors.value() || []
    } else {
      return this.__sortDescriptors || []
    }
  },
  setSortDescriptors: function(A) {
    if (this.bindings.sortDescriptors) {
      this.bindings.sortDescriptors.setValue(A)
    } else {
      this.__sortDescriptors = A
    }
    this.rearrangeObjects()
  },
  observeSortDescriptorsChange: function(A) {
    this.setSortDescriptors(A.newValue)
  },
  filterPredicate: function() {
    if (this.bindings.filterPredicate) {
      return this.bindings.filterPredicate.value()
    } else {
      return this.__filterPredicate
    }
  },
  setFilterPredicate: function(A) {
    if (this.bindings.filterPredicate) {
      this.bindings.filterPredicate.setValue(A)
    } else {
      this.__filterPredicate = A
    }
    this.rearrangeObjects()
  },
  observeFilterPredicateChange: function(A) {
    this.setFilterPredicate(A.newValue)
  },
  filterObjects: function(E) {
    var F = this.filterPredicate();
    if (!F) {
      return IndexRange(0, E.length - 1)
    }
    var C = [];
    var D;
    var A;
    var B;
    for (D = 0, A = E.length; D < A; ++D) {
      B = E[D];
      if (F(B)) {
        C.push(D)
      }
    }
    return C
  },
  _compareObjects: function(F, E) {
    var D;
    var B;
    var C = this.sortDescriptors();
    var A = C.length;
    for (D = 0; D < A; ++D) {
      B = C[D].compareObjects(F, E);
      if (!C[D].ascending) {
        B *= -1
      }
      if (0 !== B) {
        return B > 0 ? 1 : -1
      }
    }
    return 0
  },
  sortObjects: function(D, B) {
    B = B || IndexRange(0, D.length - 1);
    var C = this.sortDescriptors();
    var E = C.length;
    function A(M, L) {
      var I;
      var G;
      var K = D[M];
      var J = D[L];
      var F = E;
      var H = C;
      for (I = 0; I < F; ++I) {
        G = H[I].compareObjects(K, J);
        if (!H[I].ascending) {
          G *= -1
        }
        if (0 !== G) {
          return G
        }
      }
      return 0
    }
    if (0 !== C.length) {
      B.sort(A)
    }
    return B
  },
  arrangeObjects: function(E) {
    var C = this.filterObjects(E);
    C = this.sortObjects(E, C);
    if (E === this.content()) {
      var D = [];
      var A = C.length;
      for (var B = 0; B < A; ++B) {
        D[C[B]] = B
      }
      this.__contentToArrangedMap = D;
      this.__arrangedToContentMap = C
    }
    return E.objectsAtIndexes(C)
  },
  rearrangeObjects: function(D) {
    var G = D || this.content() || [];
    var C = this.arrangeObjects(G);
    var B = this.selectedObjects();
    var E = [];
    var A = B.length;
    var H;
    var F;
    for (F = 0; F < A; ++F) {
      H = C.indexOf(B[F]);
      if ( - 1 !== H) {
        E.push(H)
      }
    }
    this.setValueForKey(C, "arrangedObjects");
    this.setValueForKey(E, "selectionIndexes")
  },
  _insertObjectsIntoArrangedObjects: function(A) {
    var H = this.arrangeObjects(A);
    var J = H.length;
    var B = this.arrangedObjects;
    var F = B.length;
    var G = [];
    var I = 0;
    var D;
    var C;
    var E;
    G.length = J;
    for (E = 0; E < J; ++E) {
      D = H[E];
      while (I < F) {
        C = B[I];
        if ( - 1 === this._compareObjects(D, C)) {
          break
        }++I
      }
      G[E] = I + E
    }
    B.insertObjectsAtIndexes(H, G)
  },
  selectedObjects: function() {
    return this.__selectedObjects
  },
  setSelectedObjects: function(B) {
    var C = [];
    var E;
    var D;
    var A = this.arrangedObjects;
    for (E = 0; E < B.length; ++E) {
      D = A.indexOf(B[E]);
      if ( - 1 === D) {
        continue
      }
      C.push(D)
    }
    return this.setSelectionIndexes(C)
  },
  selectionIndexes: function() {
    if (this.bindings.selectionIndexes) {
      return this.bindings.selectionIndexes.value() || []
    } else {
      return this.__selectionIndexes || []
    }
  },
  setSelectionIndexes: function(B) {
    B = B || [];
    B.sort();
    if (0 === this.selectionIndexes().compare(B)) {
      return false
    }
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(B)
    } else {
      this.__selectionIndexes = B
    }
    var A = this.arrangedObjects;
    this.__selectedObjects = A.objectsAtIndexes(B);
    return true
  },
  observeSelectionIndexesChange: function(A) {
    this.setSelectionIndexes(A.newValue)
  },
  setSelectionIndex: function(B) {
    var A = this.setSelectionIndexes([B]);
    return A
  },
  selectionIndex: function() {
    var A = this.selectionIndexes();
    if (0 === A.length) {
      return - 1
    }
    return A[0]
  }
});
coherent.ModelController = Class.create(coherent.Controller, {
  constructor: function(A, C, B) {
    if (! ("addObserverForKeyPath" in C)) {
      coherent.KVO.adaptTree(C)
    }
    function D(E) {
      this.setValueForKey(C[E], E)
    }
    C.mutableKeys().forEach(D, this);
    this.base(A, B)
  }
});
window.NW = window.NW || {};
NW.Dom = function() {
  var D = "0.99.3",
  N = {},
  G = {},
  B = {},
  S = null,
  I = 0,
  W = 1,
  P = 2,
  K = ["htmlFor", "className", "tabIndex", "accessKey", "maxLength", "readOnly", "longDesc", "frameBorder", "isMap", "useMap", "noHref", "noWrap", "colSpan", "rowSpan", "cellPadding", "cellSpacing", "marginWidth", "marginHeight"],
  U = /\:(nth)\-/,
  Z = /\:(nth|first|last|only)\-/,
  J = /\-(of-type)/,
  Y = /^\s+|\s+$/g,
  R = {
    npseudos: /^\:(nth-)?(child|first|last|only)?-?(child)?-?(of-type)?(\((?:even|odd|[^\)]*)\))?(.*)/,
    spseudos: /^\:([\w]+)?(\(.*\))?(?:\s+|$)(.*)/,
    children: /^\s*\>\s*(.*)/,
    adjacent: /^\s*\+\s*(.*)/,
    relative: /^\s*\~\s*(.*)/,
    ancestor: /^(\s+)(.*)/,
    A: /^\[([\w-]+)(\~|\^|\*|\$|\!|\|)?(\=)?"?([^\"\]]+)?"?\](.*)/,
    C: /^\.([\w-]+)(.*)/,
    I: /^\#([\w-]+)(.*)/,
    T: /^([\w-]+)(.*)/,
    X: /^\*(.*)/
  },
  L = {
    X: /(^\s*\*\s*)$/,
    C: /^\.([\w-]+)$/,
    I: /^\#([\w-]+)$/,
    T: /^([\w]+)$/,
    N: /^([\w]+)(\#|\.|\[)?/
  },
  T = function(E) {
    var O = -1,
    c, b = [];
    while ((c = E[++O])) {
      b[b.length] = c
    }
    return b
  },
  F = function(g, d, h) {
    var c, O, f, E, e;
    while (g) {
      if ((E = g.match(R.X))) {
        d = "if(e){" + d + "}"
      } else {
        if ((E = g.match(R.I))) {
          d = 'if(e&&e.id=="' + E[1] + '"){' + d + "}"
        } else {
          if ((E = g.match(R.T))) {
            d = 'if(e&&e.nodeName.toLowerCase()=="' + E[1].toLowerCase() + '"){' + d + "}"
          } else {
            if ((E = g.match(R.C))) {
              d = 'if(e&&(" "+e.className+" ").indexOf(" ' + E[1] + ' ")>-1){' + d + "}"
            } else {
              if ((E = g.match(R.A))) {
                for (f = 0; f < K.length; ++f) {
                  if (K[f].toLowerCase().indexOf(E[1]) === 0) {
                    E[1] = K[f];
                    break
                  }
                }
                d = "if(e&&" + (E[2] && E[3] && E[4] && E[2] != "!" ? (E[2] == "~" ? '(" "+': (E[2] == "|" ? '("-"+': "")) + "e." + E[1] + (E[2] == "|" || E[2] == "~" ? '.replace(/s+/g," ")': "") + (E[2] == "~" ? '+" ")': (E[2] == "|" ? '+"-")': "")) + (E[2] == "!" || E[2] == "|" || E[2] == "~" ? '.indexOf("': ".match(/") + (E[2] == "^" ? "^": E[2] == "~" ? " ": E[2] == "|" ? "-": "") + E[4] + (E[2] == "$" ? "$": E[2] == "~" ? " ": E[2] == "|" ? "-": "") + (E[2] == "|" || E[2] == "~" ? '")>-1': "/)") : (E[3] && E[4] ? "e." + E[1] + (E[2] == "!" ? "!": "=") + '="' + E[4] + '"': "e." + E[1])) + "){" + d + "}"
              } else {
                if ((E = g.match(R.adjacent))) {
                  d = "if(e){while((e=e.previousSibling)&&e.nodeType!=1);if(e){" + d + "}}"
                } else {
                  if ((E = g.match(R.relative))) {
                    d = "if(e){while((e=e.previousSibling))if(e.nodeType==1){" + d + ";break;}}"
                  } else {
                    if ((E = g.match(R.children))) {
                      d = "if(e&&(e=e.parentNode)){" + d + "}"
                    } else {
                      if ((E = g.match(R.ancestor))) {
                        d = "if(e){while((e=e.parentNode)){" + d + ";break;}}"
                      } else {
                        if ((E = g.match(R.spseudos))) {
                          switch (E[1]) {
                          case "not":
                            d = C(E[2].replace(/\((.*)\)/, "$1"), "", h) + "else{" + d + "}";
                            break;
                          case "root":
                            d = "if(e&&e==(e.ownerDocument||e.document||e).documentElement){" + d + "}";
                            break;
                          case "empty":
                            d = 'if(e&&e.getElementsByTagName("*").length===0&&(e.childNodes.length===0||e.childNodes[0].nodeValue.replace(/\\s+/g,"").length===0)){' + d + "}";
                            break;
                          case "contains":
                            d = 'if(e&&(e.textContent||e.innerText||"").indexOf("' + E[2].replace(/\(|\)/g, "") + '")!=-1){' + d + "}";
                            break;
                          case "enabled":
                            d = "if(e&&!e.disable){" + d + "}";
                            break;
                          case "disabled":
                            d = "if(e&&e.disable){" + d + "}";
                            break;
                          case "checked":
                            d = "if(e&&e.checked){" + d + "}";
                            break;
                          case "target":
                            d = "if(e&&e.id==location.href.match(/#([_-w]+)$/)[1]){" + d + "}";
                            break;
                          case "link":
                            d = 'if(e&&e.nodeName.toUpperCase()=="A"&&e.href){' + d + "}";
                            break;
                          case "visited":
                            d = "if(e&&e.visited){" + d + "}";
                            break;
                          case "active":
                            d = "if(e&&(e.ownerDocument||e.document||e).activeElement&&e==(e.ownerDocument||e.document||e).activeElement){" + d + "}";
                            break;
                          case "focus":
                            d = "if(e&&e.hasFocus&&e.hasFocus()){" + d + "}";
                            break;
                          case "hover":
                            break;
                          default:
                            break
                          }
                        } else {
                          if ((E = g.match(R.npseudos))) {
                            if (E[5]) {
                              E[5] = E[5].replace(/\(|\)/g, "");
                              if (E[5] == "even") {
                                c = 2;
                                O = 0
                              } else {
                                if (E[5] == "odd") {
                                  c = 2;
                                  O = 1
                                } else {
                                  c = E[5].match(/^-/) ? -1 : E[5].match(/^n/) ? 1 : 0;
                                  c = c || ((e = E[5].match(/(-?\d{1,})n/)) ? parseInt(e[1], 10) : 0);
                                  O = O || ((e = E[5].match(/(-?\d{1,})$/)) ? parseInt(e[1], 10) : 0)
                                }
                              }
                              e = (E[5] == "even" || E[5] == "odd" || c > O ? O >= 0 ? "%" + c + "===" + O: "===" + (c + O) : c < 0 ? "<=" + O: "===" + O);
                              if (h) {
                                d = "if(e&&s." + (E[4] ? "Twin": "Child") + "Indexes[k+1]" + e + "){" + d + "}"
                              } else {
                                d = "if((n=e)){u=1" + (E[4] ? ",t=e.nodeName;": ";") + "while((n=n." + (E[2] == "last" ? "next": "previous") + "Sibling)){if(n.node" + (E[4] ? "Name==t": "Type==1") + "){++u;}}if(u" + e + "){" + d + "}}"
                              }
                            } else {
                              if (h) {
                                e = (E[4] ? "Twin": "Child");
                                d = "if(e&&" + (E[2] == "first" ? "s." + e + "Indexes[k+1]===1": E[2] == "only" ? "s." + e + "Lengths[s." + e + "Parents[k+1]]" + (E[4] ? "[e.nodeName]": "") + "===1": E[2] == "last" ? "s." + e + "Indexes[k+1]===s." + e + "Lengths[s." + e + "Parents[k+1]]" + (E[4] ? "[e.nodeName]": "") : "") + "){" + d + "}"
                              } else {
                                d = "if(n=e){" + (E[4] ? "t=e.nodeName;": "") + "while((n=n." + (E[2] == "first" ? "previous": "next") + "Sibling)&&n.node" + (E[4] ? "Name!=t": "Type!=1") + ");if(!n&&(n=e)){" + (E[2] == "first" || E[2] == "last" ? "{" + d + "}": "while((n=n." + (E[2] == "first" ? "next": "previous") + "Sibling)&&n.node" + (E[4] ? "Name!=t": "Type!=1") + ");if(!n){" + d + "}") + "}}"
                              }
                            }
                          } else {
                            throw new Error('NW.Dom.compileSelector: syntax error, unknown selector rule "' + g + '"')
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      g = E[E.length - 1]
    }
    return d
  },
  C = function(l, E) {
    var g = 0,
    f = "",
    e, h = {},
    c, b = "",
    O = l.split(",");
    for (; g < O.length; ++g) {
      e = O[g].replace(Y, "");
      if ((c = e.match(R.T))) {
        if (c[1] && S) {
          if (S.getElementsByTagName(c[1]).length === 0) {
            continue
          }
        }
      }
      if (!h[e]) {
        h[e] = e;
        if (E) {
          f = F(e, "{r[r.length]=c[k];", E) + "}" + f
        } else {
          f = F(e, "{return true;", E) + "}" + f.replace("break;", "")
        }
      }
    }
    if (l.match(U)) {
      b = ",j,u,t,a"
    } else {
      if (l.match(Z)) {
        b = ",t"
      }
    }
    if (E) {
      return new Function("c,s", "var k=-1,e,r=[],n" + b + ";while((e=c[++k])){" + f + "}return r;")
    } else {
      return new Function("e", "var n,u;" + f.replace("break;", "") + "return false;")
    }
  },
  M = typeof document.fileSize != "undefined",
  H = {
    Elements: [],
    ChildIndexes: [],
    ChildLengths: [],
    ChildParents: [],
    TwinIndexes: [],
    TwinLengths: [],
    TwinParents: [],
    isValid: false,
    HtmlSrc: ""
  },
  Q = W,
  V = function(E, b, O) {
    if (M) {
      V = function(c, d) {
        return d.sourceIndex || -1
      }
    } else {
      if (E.indexOf) {
        V = function(c, d) {
          return c.indexOf(d)
        }
      } else {
        V = function(c, f, d) {
          d = c.length;
          while (--d >= 0) {
            if (f == c[d]) {
              break
            }
          }
          return d
        }
      }
    }
    return V(E, b)
  },
  X = function(n, q) {
    var g = 0,
    o, E, O, v, u, m = [n],
    t = [0],
    j = [0],
    d = [0];
    while ((o = q[g++])) {
      m[g] = o;
      d[g] = 0;
      O = o.parentNode;
      E = o.nodeName;
      if (v != O) {
        u = V(m, v = O)
      }
      t[g] = u;
      d[u] = d[u] || {};
      d[u][E] = d[u][E] || 0;
      j[g] = ++d[u][E]
    }
    H.TwinParents = t;
    H.TwinIndexes = j;
    H.TwinLengths = d
  },
  A = function(m, o) {
    var d = 0,
    n, E, t, r, j = [m],
    q = [0],
    g = [0],
    O = [0];
    while ((n = o[d++])) {
      j[d] = n;
      O[d] = 0;
      E = n.parentNode;
      if (t != E) {
        r = V(j, t = E)
      }
      q[d] = r;
      g[d] = ++O[r]
    }
    H.ChildParents = q;
    H.ChildIndexes = g;
    H.ChildLengths = O
  },
  a = function(O) {
    var b, E = H,
    e = E.Elements;
    if (e.length > 0) {
      b = e[0].ownerDocument || e[0].document;
      if (Q == P && (e.length == E.ChildIndexes.length || e.length == E.TwinIndexes.length)) {
        E.isValid = true
      } else {
        if (Q == W && E.HtmlSrc == b.body.innerHTML) {
          E.isValid = true
        } else {
          if (Q == W) {
            E.HtmlSrc = b.body.innerHTML
          }
          B = {};
          E.isValid = false
        }
      }
    } else {
      B = {};
      E.isValid = false
    }
    H = E
  };
  return {
    setCache: function(E) {
      Q = (E & 3) || W;
      this.expireCache()
    },
    expireCache: function() {
      H.isValid = false
    },
    match: function(O, E) {
      if (! (O && O.nodeType && O.nodeType == 1)) {
        return false
      }
      S = O;
      if (typeof E == "string" && E.length > 0) {
        if (!G[E]) {
          G[E] = C(E, false)
        }
        return G[E](O)
      } else {
        throw new Error('NW.Dom.match: "' + E + '" is not a valid CSS selector.')
      }
      return false
    },
    select: function(b, d) {
      var O, e = [],
      E;
      if (! (d && d.nodeType && (d.nodeType == 1 || d.nodeType == 9))) {
        d = document
      }
      S = d;
      if (typeof b == "string" && b.length > 0) {
        if ((E = b.match(L.X))) {
          e = d.getElementsByTagName("*");
          O = 0;
          while (e[O].nodeType != 1) {++O
          }
          return T(e).slice(O)
        } else {
          if ((E = b.match(L.I))) {
            return [d.getElementById(E[1])]
          } else {
            if ((E = b.match(L.T))) {
              return T(d.getElementsByTagName(E[1]))
            } else {
              if ((E = b.match(L.N)) && Q == I) {
                if (E[1]) {
                  if (d.getElementsByTagName(E[1]).length == 1) {
                    d = d.getElementsByTagName(E[1])[0];
                    b = b.replace(E[1], "")
                  } else {
                    if (E[2]) {
                      e = T(d.getElementsByTagName(E[1]));
                      b = b.replace(E[1], "")
                    }
                  }
                  b = b.replace(Y, "")
                }
              }
            }
          }
        }
        if (e.length < 1) {
          e = T(d.getElementsByTagName("*"))
        }
        H.Elements = e;
        if (b.match(Z)) {
          if (Q == I) {
            H.isValid = false
          } else {
            a(e)
          }
          if (H.isValid === false) {
            if (b.match(J)) {
              X(d, e)
            } else {
              A(d, e)
            }
          }
        }
        if (!N[b]) {
          N[b] = C(b, true)
        }
        if (Q == I) {
          return N[b](e, H)
        } else {
          if (!B[b]) {
            B[b] = N[b](e, H)
          }
          return B[b]
        }
      } else {
        throw new Error('NW.Dom.select: "' + b + '" is not a valid CSS selector.')
      }
      return []
    }
  }
} ();
coherent.Animator = Class.create({
  constructor: function() {}
});
coherent.Animator.forNode = function(A) {};
coherent.Animator.styles = ["azimuth", "background", "background-attachment", "background-color", "background-image", "background-position", "background-repeat", "border-collapse", "border-color", "border-spacing", "border-style", "border-top", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "border-top-style", "border-right-style", "border-bottom-style", "border-left-style", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-width", "bottom", "clear", "clip", "color", "content", "cursor", "direction", "display", "elevation", "empty-cells", "css-float", "font", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "height", "left", "letter-spacing", "line-height", "list-style", "list-style-image", "list-style-position", "list-style-type", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "max-height", "max-width", "min-height", "min-width", "orphans", "outline", "outline-color", "outline-style", "outline-width", "overflow", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "pause", "position", "right", "size", "table-layout", "text-align", "text-decoration", "text-indent", "text-shadow", "text-transform", "top", "vertical-align", "visibility", "white-space", "width", "word-spacing", "z-index", "opacity", "outline-offset", "overflow-x", "overflow-y"];
coherent.PartFinder = (function() {
  function C(G, E) {
    var H = G.length;
    var D = Array.from(E);
    function I() {
      G = [];
      D = null;
      H = 0
    }
    function L(O) {
      G.splice(O, 1);
      if (D) {
        D.splice(O, 1)
      }
      H = G.length
    }
    function F(O) {
      var Q = Element.assignId(O);
      var P = G.indexOf(Q);
      if ( - 1 == P) {
        return
      }
      G.splice(P, 1);
      if (D) {
        D.splice(P, 1)
      }
      H = G.length
    }
    function N(Q, P) {
      var O = Element.assignId(Q);
      G.splice(P, 0, O);
      if (D) {
        D.splice(P, 0, Q)
      }
      H = G.length
    }
    function M(O) {
      G.push(Element.assignId(O));
      H = G.length;
      if (D) {
        D.push(O)
      }
    }
    function J() {
      D = null
    }
    function K(Q) {
      if (D) {
        if (1 == arguments.length) {
          return D[Q]
        }
        return D
      }
      if (1 == arguments.length) {
        return document.getElementById(G[Q])
      }
      var O = [];
      for (var P = 0; P < H; ++P) {
        O[P] = document.getElementById(G[P])
      }
      D = O;
      window.setTimeout(J, 250);
      return O
    }
    if (E) {
      window.setTimeout(J, 250)
    }
    K.removePartAtIndex = L;
    K.removePart = F;
    K.insertPartAtIndex = N;
    K.add = M;
    K.removeAll = I;
    return K
  }
  function A(G, E) {
    var D = E;
    function F() {
      D = null
    }
    function H() {
      if (D) {
        return D
      }
      D = document.getElementById(G);
      window.setTimeout(F, 250);
      return D
    }
    return H
  }
  function B(G, D) {
    var F = [];
    var E = [];
    if (coherent.Support.QuerySelector) {
      E = G.querySelectorAll(D);
      F = Array.map(E, Element.assignId)
    } else {
      E = NW.Dom.select(D, G);
      F = Array.map(E, Element.assignId)
    }
    return {
      nodes: E,
      ids: F
    }
  }
  return {
    singlePart: function(D, F) {
      function E() {
        var J = typeof(F);
        if ("function" === J) {
          F = F()
        } else {
          if ("string" === J) {
            F = document.getElementById(F)
          } else {
            if (!F) {
              F = this.widget(this)
            }
          }
        }
        var G = B(F, D);
        var I = A(G.ids[0], G.nodes[0]);
        var H = Class.findPropertyName(this, arguments.callee);
        if (H) {
          this[H] = I
        }
        return G.nodes[0]
      }
      return E
    },
    multipleParts: function(D, E) {
      function F(H) {
        var K = typeof(E);
        if ("function" === K) {
          E = E()
        } else {
          if ("string" === K) {
            E = document.getElementById(E)
          } else {
            if (!E) {
              E = this.widget(this)
            }
          }
        }
        var G = B(E, D);
        var J = C(G.ids, G.nodes);
        var I = Class.findPropertyName(this, arguments.callee);
        if (I) {
          this[I] = J
        }
        if (arguments.length) {
          return G.nodes[H]
        } else {
          return Array.from(G.nodes)
        }
      }
      return F
    }
  }
})();
var Part = coherent.PartFinder.singlePart;
var PartList = coherent.PartFinder.multipleParts;
coherent.Style = {
  kSelectedClass: "selected",
  kDisabledClass: "disabled",
  kMarkerClass: "nullValue",
  kFocusClass: "focussed",
  kHoverClass: "hover",
  kAscendingClass: "asc",
  kDescendingClass: "desc"
};
if ("undefined" === typeof(Element)) {
  Element = {}
}
Object.extend(Element, {
  assignId: function(A) {
    var B = arguments.callee;
    if (!B.uniqueId) {
      B.uniqueId = 1
    }
    var C = A.id || ("coherent_id_" + B.uniqueId++);
    return A.id = C
  },
  updateClass: function(F, G, C) {
    var E = $S(F.className.split(" "));
    var H = Set.add;
    var B = Set.remove;
    var D;
    var A;
    if ("string" === typeof(G)) {
      H(E, G)
    } else {
      for (D = 0, A = G.length; D < A; ++D) {
        H(E, G[D])
      }
    }
    if ("string" === typeof(C)) {
      B(E, C)
    } else {
      for (D = 0, A = C.length; D < A; ++D) {
        B(E, C[D])
      }
    }
    F.className = Set.toArray(E).join(" ")
  }
});
coherent.sendEvent = (function() {
  function A(G, H, E, C, D) {
    var F = document.createEventObject(H);
    G.fireEvent("on" + E, F)
  }
  function B(G, H, E, C, D) {
    var F = document.createEvent(H);
    F.initEvent(E, C, D);
    G.dispatchEvent(F)
  }
  if (coherent.Browser.IE) {
    return A
  } else {
    return B
  }
})();
coherent.cloneNode = (function() {
  if (!coherent.Browser.IE) {
    return function(A) {
      return A.cloneNode(true)
    }
  } else {
    return function(C) {
      var D = C.cloneNode(false);
      if ("TR" != C.tagName) {
        D.innerHTML = C.innerHTML;
        return D
      }
      var B;
      var A;
      var E;
      for (B = 0; B < C.children.length; ++B) {
        A = C.children[B];
        E = A.cloneNode(false);
        E.innerHTML = A.innerHTML;
        D.appendChild(E)
      }
      return D
    }
  }
})();
coherent.tagToWidgetLookup = {};
coherent.specRegex = /^(\w+)\s*(?:\[(\w*)\s*=\s*(\w*)\s*\])?$/;
coherent.nodeMatchesSpec = function(C, A) {
  var B = A.match(coherent.specRegex);
  if (!B) {
    return false
  }
  if (C.tagName.toLowerCase() != B[1]) {
    return false
  }
  return (1 == B.length) || !B[2] || (C[B[2]] == B[3])
};
coherent.nodeHasBindings = function(C, E) {
  var B;
  var A = (E || []).length;
  var D;
  for (B = 0; B < A; ++B) {
    D = E[B] + "KeyPath";
    if (C.getAttribute(D)) {
      return true
    }
  }
  return false
};
coherent.bindNode = function(F, A) {
  var J;
  var D;
  var H;
  var G;
  if (!coherent.dataModel) {
    coherent.dataModel = new coherent.KVO()
  }
  H = F.getAttribute("widget");
  if (H) {
    D = coherent.widgetRegistry[H];
    if (!D) {
      throw new InvalidArgumentError("Invalid Widget type: " + H)
    }
  } else {
    var E = coherent.tagToWidgetLookup[F.tagName];
    if (!E) {
      return
    }
    var I;
    var K;
    var L = E.attr || {};
    var M;
    for (var C in L) {
      M = L[C];
      K = F.getAttribute(C);
      if (K in M) {
        D = M[K];
        break
      }
      K = F[C];
      if (K in M) {
        I = M[K]
      }
    }
    D = D || I || E.widgetClass
  }
  if (!D) {
    return
  }
  var B = D.prototype.exposedBindings;
  if (!H && !coherent.nodeHasBindings(F, B)) {
    return
  }
  G = new D(F, A);
  F.__widget__ = D
};
coherent.setupNode = function(C, E) {
  if (!C) {
    C = document.body
  } else {
    coherent.bindNode(C, E)
  }
  var D = C.childNodes;
  var A = D ? D.length: 0;
  var G;
  var B = coherent.setupNode;
  var F;
  for (G = 0; G < A; ++G) {
    F = D[G];
    if (1 != F.nodeType || F.__widget__) {
      continue
    }
    B(F, E)
  }
};
coherent.setupSelectors = function(B, H, E) {
  B = B || document.body;
  var A;
  var D;
  var G;
  var C;
  if (coherent.Support.QuerySelector) {
    C = function(I) {
      return B.querySelectorAll(I)
    }
  } else {
    C = function(I) {
      return NW.Dom.select(I, B)
    }
  }
  function F(J) {
    for (var I in G) {
      J.setAttribute(I, G[I])
    }
  }
  for (A in H) {
    D = C(A);
    G = H[A];
    Array.forEach(D, F)
  }
  coherent.setupNode(B, E)
};
coherent.widgetFromNode = function(A) {
  var B = coherent.WidgetLookup;
  if (!B || !B[A.id]) {
    return null
  }
  return B[A.id]
};
var $W = coherent.widgetFromNode;
coherent.unbindNode = function(A) {
  if (!A.__widget__) {
    return
  }
  var B = $W(A);
  if (B) {
    B.teardown()
  }
};
coherent.teardownNode = function(B) {
  if (!B) {
    B = document.body
  } else {
    coherent.unbindNode(B)
  }
  var C = B.childNodes;
  var A = C ? C.length: 0;
  var D;
  for (D = 0; D < A; ++D) {
    if (1 !== C[D].nodeType) {
      continue
    }
    coherent.teardownNode(C[D])
  }
};
coherent.teardownAll = function() {
  coherent.disableFocusTracking();
  var C = coherent.__unloadCallbacks;
  var A = C.length;
  coherent.__unloadCallbacks = [];
  for (var B = 0; B < A; ++B) {
    if (C[B]) {
      C[B]()
    }
  }
  coherent.teardownNode()
};
coherent.registerUnloadCallback = function(A) {
  if (! ("__unloadCallbacks" in this)) {
    Event.observe(window, "unload", coherent.teardownAll);
    this.__unloadCallbacks = []
  }
  this.__unloadCallbacks.push(A)
};
coherent.unregisterUnloadCallback = function(B) {
  var A = (this.__unloadCallbacks || []).indexOf(B);
  if ( - 1 == A) {
    return
  }
  delete this.__unloadCallbacks[A]
};
coherent.Widget = Class.create(coherent.Bindable, {
  __widgetTagSpec__: ["input[type=button]", "input[type=submit]", "input[type=reset]", "button"],
  exposedBindings: ["visible", "class", "enabled"],
  defaultBindings: {},
  constructor: function(C, A, B) {
    this.base();
    if ("string" === typeof(C)) {
      this.id = C;
      this.__widget = document.getElementById(C)
    } else {
      this.id = Element.assignId(C);
      this.__widget = C
    }
    if (!coherent.WidgetLookup) {
      coherent.WidgetLookup = {}
    }
    if (A && !("addObserverForKeyPath" in A)) {
      coherent.KVO.adaptTree(A)
    }
    this.__relativeSource = A;
    if (B) {
      this.__bindingMap = B
    }
    if (this.id in coherent.WidgetLookup) {
      throw new Error("Two widgets share the same ID: " + this.id)
    }
    coherent.WidgetLookup[this.id] = this
  },
  __postConstruct: function() {
    var A = this;
    function C() {
      delete A.__widget;
      delete A.__container
    }
    window.setTimeout(C, 250);
    var B = this.widget();
    if (B) {
      this._initWidget()
    }
  },
  _initWidget: function() {
    this.__initialising = true;
    this.init();
    this.setupBindings(this.__relativeSource);
    delete this.__initialising
  },
  init: function() {},
  widget: function() {
    return this.__widget || document.getElementById(this.id)
  },
  container: function() {
    return this.__container || this.__widget || document.getElementById(this.__containerId || this.id)
  },
  setContainer: function(A) {
    if (this.__widget) {
      this.__container = A
    }
    this.__containerId = Element.assignId(A);
    return A
  },
  observeVisibleChange: function(D, C, A) {
    var B = this.widget();
    if (D.newValue) {
      B.style.display = ""
    } else {
      B.style.display = "none"
    }
  },
  observeEnabledChange: function(B) {
    var A = this.widget();
    if (this.__initialising && (null === B.newValue || "undefined" === B.newValue)) {
      this.bindings.enabled.setValue(!A.disabled);
      return
    }
    A.disabled = !B.newValue;
    if (A.disabled) {
      Element.addClassName(A, coherent.Style.kDisabledClass)
    } else {
      Element.removeClassName(A, coherent.Style.kDisabledClass)
    }
  },
  observeClassChange: function(F, E, B) {
    var C = this.widget();
    var A = $S(C.className.split(" "));
    var D = $S((F.newValue || "").split(" "));
    if (coherent.Style.kDisabledClass in A) {
      Set.add(D, coherent.Style.kDisabledClass)
    }
    if (coherent.Style.kMarkerClass in A) {
      Set.add(D, coherent.Style.kMarkerClass)
    }
    if (coherent.Style.kSelectedClass in A) {
      Set.add(D, coherent.Style.kSelectedClass)
    }
    if (coherent.Style.kFocusClass in A) {
      Set.add(D, coherent.Style.kFocusClass)
    }
    if (coherent.Style.kHoverClass in A) {
      Set.add(D, coherent.Style.kHoverClass)
    }
    C.className = Set.toArray(D).join(" ")
  },
  removeChild: function(A) {
    if (!A) {
      return null
    }
    coherent.teardownNode(A);
    if (this.beforeRemoveElement) {
      this.beforeRemoveElement(A)
    }
    return A.parentNode.removeChild(A)
  },
  attributeOrProperty: (function() {
    if (coherent.Browser.IE) {
      return function(A) {
        var C = this.widget();
        var B = C[A];
        if (B || "" === B) {
          return B
        }
        return this[A]
      }
    } else {
      return function(A) {
        var C = this.widget();
        var B = C.getAttribute(A);
        if (B || "" === B) {
          return B
        }
        B = C[A];
        if (B || "" === B) {
          return B
        }
        return this[A]
      }
    }
  })(),
  setupBindings: function(B) {
    var H;
    var F;
    var I;
    var G;
    var C;
    var E;
    var D = this.widget();
    var A = this.__bindingMap || this.defaultBindings;
    this.__unloadCallback = this.teardown.bind(this);
    coherent.registerUnloadCallback(this.__unloadCallback);
    for (C = 0, E = this.exposedBindings.length; C < E; ++C) {
      H = this.exposedBindings[C];
      I = D.getAttribute(H + "KeyPath") || A[H];
      if (!I) {
        continue
      }
      this.bindNameToKeyPath(H, I, B, true)
    }
    for (H in this.bindings) {
      this.bindings[H].update()
    }
  },
  teardown: function() {
    for (var A in this.bindings) {
      this.bindings[A].unbind()
    }
    delete coherent.WidgetLookup[this.id];
    coherent.unregisterUnloadCallback(this.__unloadCallback)
  }
});
coherent.Widget.__updateTagSpecTable = function(D) {
  var A = D.prototype;
  function B(E) {
    var G = E.match(coherent.specRegex);
    if (!G) {
      throw new Error("Invalid widget spec: " + E)
    }
    var H = G[1].toUpperCase();
    var F = G[2];
    var I = G[3];
    var J = coherent.tagToWidgetLookup[H] || {};
    if (! (H in coherent.tagToWidgetLookup)) {
      coherent.tagToWidgetLookup[H] = J
    }
    if (!F) {
      if (J.widgetClass) {
        console.log((A.__widget__ + ": " || "") + "Redefining widget spec: " + E + ": previously registered to " + (J.widgetClass.prototype.__widget__ || "unknown"));
        throw new Error("Redefining widget spec: " + E)
      }
      J.widgetClass = D;
      return
    }
    if (!J.attr) {
      J.attr = {}
    }
    if (! (F in J.attr)) {
      J.attr[F] = {}
    }
    if (I in J.attr[F]) {
      console.log((A.__widget__ + ": " || "") + "Redefining widget spec: " + E + ": previously registered to " + (J.widgetClass.prototype.__widget__ || "unknown"));
      throw new Error("Redefining widget spec: " + E)
    }
    J.attr[F][I] = D
  }
  if (A.hasOwnProperty("__widgetTagSpec__")) {
    var C = A.__widgetTagSpec__;
    if ("string" == typeof(C)) {
      B(C)
    } else {
      if ("forEach" in C) {
        C.forEach(B)
      } else {
        console.log("Invalid type for __widgetTagSpec__")
      }
    }
  }
};
coherent.Widget.__subclassCreated = function(A) {
  if (!coherent.widgetRegistry) {
    coherent.widgetRegistry = {}
  }
  var B = A.prototype;
  if (B.hasOwnProperty("__widget__")) {
    coherent.widgetRegistry[B.__widget__] = A
  }
  coherent.Widget.__updateTagSpecTable(A);
  var C = A.superclass.prototype;
  if (C.defaultBindings !== B.defaultBindings) {
    B.defaultBindings = Object.applyDefaults(B.defaultBindings, C.defaultBindings)
  }
};
coherent.Widget.__updateTagSpecTable(coherent.Widget);
coherent.TextWidget = Class.create(coherent.Widget, {
  __widget__: "Text",
  __widgetTagSpec__: ["div", "b", "strong", "em", "i", "q", "p", "span", "li", "h1", "h2", "h3", "h4", "td", "label"],
  exposedBindings: ["html", "text"],
  multipleValuesPlaceholder: _("marker.text.multipleValues"),
  nullPlaceholder: _("marker.text.placeholder"),
  noSelectionPlaceholder: _("marker.text.noSelection"),
  translateValue: function(C) {
    var B = this.widget();
    var A = true;
    switch (C) {
    case "":
    case null:
    case undefined:
      C = this.attributeOrProperty("nullPlaceholder");
      break;
    case coherent.Markers.NoSelection:
      C = this.attributeOrProperty("noSelectionPlaceholder");
      break;
    case coherent.Markers.MultipleValues:
      C = this.attributeOrProperty("multipleValuesPlaceholder");
      break;
    default:
      A = false;
      break
    }
    if (A) {
      Element.addClassName(B, coherent.Style.kMarkerClass)
    } else {
      Element.removeClassName(B, coherent.Style.kMarkerClass)
    }
    return C
  },
  observeTextChange: function(G, F, A) {
    var C = this.widget();
    var B = this.translateValue(G.newValue);
    if (this.__initialising && (null === G.newValue || "undefined" === typeof(G.newValue))) {
      var E = C.textContent || C.innerText;
      if (B !== E) {
        this.bindings.text.setValue(E)
      }
      return
    }
    var D = document.createTextNode(B);
    C.innerHTML = "";
    C.appendChild(D)
  },
  observeHtmlChange: function(G, F, A) {
    var C = this.widget();
    var B = this.translateValue(G.newValue);
    if (this.__initialising && (null === G.newValue || "undefined" === typeof(G.newValue))) {
      var E = C.innerHTML;
      if (B !== E) {
        this.bindings.html.setValue(E)
      }
      return
    }
    if (B !== G.newValue) {
      var D = document.createTextNode(B);
      C.innerHTML = "";
      C.appendChild(D);
      return
    }
    C.innerHTML = B
  }
});
coherent.AnchorWidget = Class.create(coherent.TextWidget, {
  __widget__: "Anchor",
  __widgetTagSpec__: "a",
  exposedBindings: ["href", "title"],
  observeHrefChange: function(B) {
    var A = this.widget();
    if (this.__initialising && (null === B.newValue || "undefined" === typeof(B.newValue))) {
      this.bindings.href.setValue(A.href || "");
      return
    }
    A.href = B.newValue
  },
  observeTitleChange: function(B) {
    var A = this.widget();
    if (this.__initialising && (null === B.newValue || "undefined" === typeof(B.newValue))) {
      this.bindings.title.setValue(A.title || "");
      return
    }
    A.title = B.newValue
  }
});
coherent.TabWidget = Class.create(coherent.Widget, {
  __widget__: "Tab",
  tabs: PartList("label.tab"),
  exposedBindings: [],
  useTransitions: false,
  init: function() {
    this.base();
    var E = this.tabClicked.bindAsEventListener(this);
    var D = this.tabs();
    var C = coherent.Style.kSelectedClass;
    var A = null;
    function B(H, G) {
      Event.observe(H, "click", E);
      var F = this.contentElementForTab(H);
      if (!A && Element.hasClassName(H, C)) {
        A = H
      } else {
        if (F) {
          F.style.display = "none"
        }
      }
    }
    D.forEach(B, this);
    A = A || D[0];
    if (A) {
      this.displayContentForTab(A);
      Element.addClassName(A, C)
    }
  },
  currentTab: function() {
    return document.getElementById(this.__currentTabId)
  },
  contentElementForTab: function(A) {
    if (!A) {
      return null
    }
    return document.getElementById(A.htmlFor)
  },
  displayContentForTab: function(C) {
    var B = this.contentElementForTab(this.currentTab());
    var A = this.contentElementForTab(C);
    this.__currentTabId = C.id;
    if (!this.useTransitions) {
      B.style.display = "none";
      A.style.display = "";
      return
    }
    throw new Error("Transitions not implemented")
  },
  tabClicked: function(C) {
    var B = C.target || C.srcElement;
    var A = document.body;
    while (B != A && "LABEL" !== B.tagName) {
      B = B.parentNode
    }
    if ("LABEL" !== B.tagName) {
      return
    }
    if (B.id == this.__currentTabId) {
      return
    }
    Element.removeClassName(this.currentTab(), coherent.Style.kSelectedClass);
    Element.addClassName(B, coherent.Style.kSelectedClass);
    this.displayContentForTab(B)
  }
});
coherent.ExternalTabWidget = Class.create(coherent.TabWidget, {
  __widget__: "ExternalTab",
  exposedBindings: ["srcTable"],
  wait: Part(".wait"),
  waitTimeout: 125,
  frame: function() {
    return document.getElementById(this.frameId)
  },
  loadUrl: function(A) {
    if (this.loading === A) {
      return
    }
    var B = this.widget();
    this.loading = A;
    var C = this.frame() || this.createFrame(A);
    if (coherent.Browser.IE) {
      C.onreadystatechange = this.readyStateChanged.bindAsEventListener(this)
    } else {
      C.onload = this.frameLoaded.bindAsEventListener(this)
    }
    this.loading = A;
    C.src = A;
    this.waitTimeout = window.setTimeout(this.showWait.bind(this), this.waitTimeout)
  },
  showWait: function() {
    var A = this.wait();
    if (A) {
      A.style.display = ""
    }
    window.clearTimeout(this.waitTimeout);
    this.waitTimeout = false
  },
  createFrame: function(B) {
    var C = this.widget();
    var D;
    if (coherent.Browser.Safari2) {
      var A = document.createElement("div");
      C.appendChild(A);
      A.innerHTML += '<iframe src="' + B + '"></iframe>';
      D = C.getElementsByTagName("iframe")[0];
      D.style.width = "0";
      D.style.height = "0"
    } else {
      D = document.createElement("iframe");
      D.src = B;
      C.appendChild(D)
    }
    this.frameId = Element.assignId(D);
    return D
  },
  observeSrcTableChange: function(D, C, A) {
    var B = this.currentTab();
    if (!B) {
      return
    }
    this.displayContentForTab(B)
  },
  contentElementForTab: function(A) {
    return null
  },
  displayContentForTab: function(B) {
    this.__currentTabId = B.id;
    if (!this.bindings.srcTable) {
      return
    }
    var C = this.bindings.srcTable.value();
    if (!C) {
      return
    }
    var A = C.valueForKey(B.htmlFor);
    this.loadUrl(A)
  },
  readyStateChanged: function(A) {
    if ("complete" === this.frame().readyState) {
      this.frameLoaded(A)
    }
  },
  frameLoaded: function(A) {
    if (!this.loading) {
      return
    }
    if (this.waitTimeout) {
      window.clearTimeout(this.waitTimeout)
    }
    this.waitTimeout = false;
    this.loading = false;
    var B = this.wait();
    if (B) {
      B.style.display = "none"
    }
  }
});
coherent.elementWithFocus = null;
coherent.trackElementReceivingFocus = function(C) {
  if (!document.body) {
    return
  }
  C = C || window.event;
  var B = C.toElement || C.target;
  var A = coherent.elementWithFocus;
  if (B && B.needsFocusHelp && A) {
    A.blur()
  }
  if (A && A.needsFocusHelp) {
    coherent.sendEvent(A, "HTMLEvents", "blur", false, false)
  }
  if (document === B) {
    B = null
  }
  coherent.elementWithFocus = B
};
coherent.enableFocusTracking = function() {
  if (coherent.__focusTrackingEnabled) {
    return
  }
  coherent.__focusTrackingEnabled = true;
  Event.observe(document, coherent.Browser.IE ? "focusin": "focus", coherent.trackElementReceivingFocus, true)
};
coherent.disableFocusTracking = function() {
  if (!coherent.__focusTrackingEnabled) {
    return
  }
  Event.stopObserving(document, coherent.Browser.IE ? "focusin": "focus", coherent.trackElementReceivingFocus)
};
coherent.FocusTrackingWidget = Class.create(coherent.Widget, {
  init: function() {
    this.base();
    var B = this.widget();
    coherent.enableFocusTracking();
    if ("SELECT" !== B.tagName) {
      var A = this.mouseDownSetFocus.bindAsEventListener(this);
      Event.observe(B, "mousedown", A, false);
      B.needsFocusHelp = true
    }
    Event.observe(B, coherent.Browser.IE ? "focusin": "focus", this.receivingFocus.bindAsEventListener(this));
    Event.observe(B, "blur", this.losingFocus.bindAsEventListener(this))
  },
  mouseDownSetFocus: function(A) {
    var B = this.widget();
    if (coherent.elementWithFocus === B) {
      return false
    }
    Event.stop(A);
    B.focus();
    coherent.sendEvent(B, "HTMLEvents", coherent.Browser.IE ? "focusin": "focus", false, false);
    return false
  },
  receivingFocus: function() {
    var A = this.widget();
    Element.addClassName(A, coherent.Style.kFocusClass)
  },
  losingFocus: function() {
    var A = this.widget();
    Element.removeClassName(A, coherent.Style.kFocusClass)
  }
});
coherent.ImageWidget = Class.create(coherent.Widget, {
  __widget__: "Image",
  __widgetTagSpec__: ["img", "input[type=image]"],
  exposedBindings: ["src", "width", "height"],
  multipleValuesPlaceholder: _("marker.image.multipleValues"),
  nullPlaceholder: _("marker.image.placeholder"),
  noSelectionPlaceholder: _("marker.image.noSelection"),
  observeSrcChange: function(D) {
    var B = this.widget();
    var C = D.newValue;
    var A = true;
    if (this.__initialising && (null === C || "undefined" === typeof(C))) {
      this.bindings.src.setValue(B.src);
      return
    }
    switch (C) {
    case "":
    case null:
    case undefined:
      C = this.attributeOrProperty("nullPlaceholder");
      break;
    case coherent.Markers.NoSelection:
      C = this.attributeOrProperty("noSelectionPlaceholder");
      break;
    case coherent.Markers.MultipleValues:
      C = this.attributeOrProperty("multipleValuesPlaceholder");
      break;
    default:
      A = false;
      break
    }
    if (A) {
      Element.addClassName(B, coherent.Style.kMarkerClass)
    } else {
      Element.removeClassName(B, coherent.Style.kMarkerClass)
    }
    B.src = C
  },
  observeWidthChange: function(C) {
    var B = this.widget();
    var A = parseInt(C.newValue, 10);
    if (this.__initialising && (null === C.newValue || "undefined" === typeof(C.newValue))) {
      this.bindings.width.setValue(B.width);
      return
    }
    if (isNaN(A)) {
      B.width = ""
    } else {
      B.width = A
    }
  },
  observeHeightChange: function(C) {
    var B = this.widget();
    var A = parseInt(C.newValue, 10);
    if (this.__initialising && (null === C.newValue || "undefined" === typeof(C.newValue))) {
      this.bindings.height.setValue(B.height);
      return
    }
    if (isNaN(A)) {
      B.height = ""
    } else {
      B.height = A
    }
  }
});
coherent.InputWidget = Class.create(coherent.Widget, {
  exposedBindings: ["value"],
  __widget__: "Input",
  __widgetTagSpec__: ["input[type=text]", "input[type=password]", "input[type=hidden]", "textarea"],
  init: function() {
    this.base();
    var A = this.widget();
    switch (A.type) {
    case "text":
    case "password":
    case "textarea":
    case "search":
      Event.observe(A, "change", this.valueChanged.bindAsEventListener(this));
      Event.observe(A, "focus", this.fieldReceivedFocus.bindAsEventListener(this));
      Event.observe(A, "blur", this.fieldLostFocus.bindAsEventListener(this));
      Event.observe(A, "keypress", this.keyPressed.bindAsEventListener(this));
      Event.observe(A, "drop", this.fieldReceivedDropEvent.bindAsEventListener(this));
      break;
    case "checkbox":
    case "radio":
      break;
    case "hidden":
      break;
    default:
      console.log("unknown InputWidget type: " + A.type);
      break
    }
    this.editing = false
  },
  multipleValuesPlaceholder: _("marker.input.multipleValues"),
  nullPlaceholder: _("marker.input.placeholder"),
  noSelectionPlaceholder: _("marker.input.noSelection"),
  keypressUpdateTimeout: 100,
  continuallyUpdatesValue: true,
  beginEditing: function() {
    this.editing = true
  },
  endEditing: function() {
    this.editing = false
  },
  setMarkerValue: function(A) {
    var C = this.widget();
    var B = this.attributeOrProperty(A);
    this.markerValue = A;
    C.value = B;
    Element.addClassName(C, coherent.Style.kMarkerClass)
  },
  clearMarkerValue: function() {
    var A = this.widget();
    this.markerValue = false;
    A.value = "";
    Element.removeClassName(A, coherent.Style.kMarkerClass)
  },
  valueChanged: function(A) {
    var C = this.widget();
    var B = C.value;
    if (this.markerValue) {
      return
    }
    if (this.updateTimer) {
      window.clearTimeout(this.updateTmer);
      this.updateTimer = null
    }
    if (this.bindings.value) {
      this.bindings.value.setValue(B)
    }
  },
  fieldReceivedFocus: function(A) {
    var C = this.widget();
    if (C.disabled || C.readOnly) {
      return
    }
    var B = null;
    if (this.bindings.value) {
      B = this.bindings.value.value()
    }
    if (null === B || "undefined" === typeof(B) || "" === B || coherent.Markers.NoSelection === B || coherent.Markers.MultipleValues === B) {
      this.clearMarkerValue()
    }
    this.hasFocus = true;
    this.beginEditing()
  },
  fieldLostFocus: function(A) {
    var B = this.widget();
    this.hasFocus = false;
    if ("" === B.value) {
      this.setMarkerValue("nullPlaceholder")
    }
    this.endEditing()
  },
  fieldReceivedDropEvent: function(A) {
    var B = this.widget();
    B.value = ""
  },
  keyPressed: function(A) {
    var B = this.widget();
    if (this.updateTimer && !this.continuallyUpdatesValue) {
      window.clearTimeout(this.updateTimer);
      this.updateTimer = null
    }
    if (this.updateTimer || B.readOnly || B.disabled) {
      return
    }
    this.updateTimer = window.setTimeout(this.valueChanged.bind(this), this.keypressUpdateTimeout)
  },
  observeValueChange: function(C) {
    var A = this.widget();
    var B = C.newValue;
    if (this.__initialising && (null === B || "undefined" === typeof(B))) {
      this.bindings.value.setValue(A.value);
      return
    }
    if ("undefined" === typeof(B)) {
      A.disabled = true
    } else {
      if (!this.bindings.enabled) {
        A.disabled = false
      }
    }
    A.readOnly = !this.bindings.value.mutable() || coherent.Markers.MultipleValues === B || coherent.Markers.NoSelection === B;
    if (A.disabled) {
      Element.addClassName(A, coherent.Style.kDisabledClass)
    } else {
      Element.removeClassName(A, coherent.Style.kDisabledClass)
    }
    if (this.hasFocus) {
      return
    }
    switch (A.type) {
    case "text":
    case "password":
    case "textarea":
      if (null === B || "undefined" === typeof(B) || "" === B) {
        this.setMarkerValue("nullPlaceholder")
      } else {
        if (coherent.Markers.NoSelection === B) {
          this.setMarkerValue("noSelectionPlaceholder")
        } else {
          if (coherent.Markers.MultipleValues === B) {
            this.setMarkerValue("multipleValuesPlaceholder")
          } else {
            this.clearMarkerValue();
            A.value = B
          }
        }
      }
      break;
    default:
      A.value = B;
      break
    }
  }
});
coherent.InlineInputWidget = Class.create(coherent.InputWidget, {
  __widget__: "InlineInput",
  init: function() {
    this.base();
    var C = this.widget();
    var B = C.type;
    if ("text" !== B && "password" !== B && "textarea" !== B) {
      console.log("Invalid type (" + B + ") for InlineInputWidget.");
      return
    }
    var A = this.setContainer(document.createElement("span"));
    A.className = "inlineEditor";
    C.parentNode.replaceChild(A, C);
    this.span = document.createElement("span");
    this.span.className = this.className;
    this.span.style.display = "";
    this.span.onclick = this.beginEditing.bindAsEventListener(this);
    this.span.title = "Click to edit";
    A.appendChild(C);
    A.appendChild(this.span);
    C.style.display = "none";
    this.updateValue()
  },
  updateValue: function() {
    var A = this.widget();
    if (!this.span) {
      return
    }
    var B = document.createTextNode(A.value);
    this.span.innerHTML = "";
    this.span.appendChild(B)
  },
  beginEditing: function() {
    this.base();
    var A = this.widget();
    A.style.display = "";
    this.span.style.display = "none";
    A.focus();
    A.select();
    return false
  },
  endEditing: function() {
    this.base();
    var A = this.widget();
    this.updateValue();
    this.span.style.display = "";
    A.style.display = "none";
    return false
  },
  mouseEntered: function() {
    Element.addClassName(this.span, "hover")
  },
  mouseExited: function() {
    Element.removeClassName(this.span, "hover")
  },
  observeValueChange: function(C, B, A) {
    this.base(C, B, A);
    this.updateValue()
  },
  observeVisibleChange: function(C, B, A) {
    if (C.newValue) {
      this.container.style.display = ""
    } else {
      this.container.style.display = "none"
    }
  },
  observeClassChange: function(D, C, A) {
    var B = this.widget();
    coherent.Widget.observeClassChange.apply(this, arguments);
    this.span.className = B.className
  }
});
coherent.ListWidget = Class.create(coherent.FocusTrackingWidget, {
  __widget__: "List",
  __widgetTagSpec__: ["table", "ul"],
  exposedBindings: ["content", "selectionIndexes", "selectedIndex", "selectedObject"],
  KEY_UP: 38,
  KEY_DOWN: 40,
  _items: null,
  init: function() {
    this.base();
    var D = this.widget();
    var A;
    if ("SELECT" === D.tagName) {
      this._items = PartList("option");
      this.templateElement = document.createElement("option");
      Event.observe(D, "change", this.selectedIndexChanged.bindAsEventListener(this))
    } else {
      if ("TABLE" === D.tagName) {
        A = this.setContainer(D.tBodies[0]);
        this._items = PartList("tr");
        this.templateElement = coherent.cloneNode(this._items(0))
      } else {
        A = this.container();
        var C = D.firstChild;
        while (C) {
          if (1 === C.nodeType) {
            break
          }
          C = C.nextSibling
        }
        if (!C) {
          return
        }
        this._items = PartList(C.tagName);
        this.templateElement = coherent.cloneNode(C)
      }
      this.templateElement.id = "";
      this.eventElementWasClicked = this.elementWasClicked.bindAsEventListener(this);
      this.eventKeyPressed = this.keyPressed.bindAsEventListener(this);
      Event.observe(A, "click", this.eventElementWasClicked);
      Event.observe(document, "keydown", this.eventKeyPressed)
    }
    var B = this.computeSelectionIndexes();
    this.selectionIndexes = B;
    this.selectedIndex = B.length ? B[0] : -1;
    this.anchorTop = this.anchorBottom = this.selectedIndex;
    this.sortable = (D.getAttribute("sortable") && window.Sortable ? true: false)
  },
  keyPressed: function(E) {
    var F = this.widget();
    if (coherent.elementWithFocus !== F) {
      return true
    }
    if (this.KEY_UP != E.keyCode && this.KEY_DOWN != E.keyCode) {
      return true
    }
    var B = this.selectionIndexes;
    var D = this.bindings.content.value().length - 1;
    if (E.shiftKey && this.selectionIndexes.length) {
      this.anchorTop = B[0];
      this.anchorBottom = B[B.length - 1];
      if (this.KEY_UP == E.keyCode && 0 < this.anchorTop) {
        this.anchorTop--
      } else {
        if (this.KEY_DOWN == E.keyCode && this.anchorBottom < D) {
          this.anchorBottom++
        }
      }
      B = IndexRange(this.anchorTop, this.anchorBottom)
    } else {
      if (!this.selectionIndexes.length) {
        if (this.KEY_UP == E.keyCode) {
          this.anchorTop = this.anchorBottom = D
        } else {
          if (this.KEY_DOWN == E.keyCode) {
            this.anchorTop = this.anchorBottom = 0
          }
        }
        B = [this.anchorTop]
      } else {
        if (this.KEY_UP == E.keyCode && this.anchorTop > 0) {
          this.anchorBottom = --this.anchorTop
        } else {
          if (this.KEY_DOWN == E.keyCode && this.anchorBottom < D) {
            this.anchorTop = ++this.anchorBottom
          }
        }
        B = [this.anchorTop]
      }
    }
    this.setSelection(B);
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(B)
    }
    if (this.bindings.selectedIndex) {
      this.bindings.selectedIndex.setValue(B[0])
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      var A = B[0];
      var C = (this.bindings.content.value() || [])[A];
      this.bindings.selectedObject.setValue(C)
    }
    Event.stop(E);
    return false
  },
  selectedIndexChanged: function(E) {
    if (!this.bindings.selectionIndexes && !this.bindings.selectedIndex && !this.bindings.selectedObject && !this.bindings.selectedValue) {
      return
    }
    var F = this.widget();
    var B;
    if (this.attributeOrProperty("multiple")) {
      B = this.computeSelectionIndexes()
    } else {
      B = [this.selectedIndex = F.selectedIndex]
    }
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(B)
    }
    if (this.bindings.selectedIndex) {
      this.bindings.selectedIndex.setValue(B[0])
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      var A = B[0];
      var C = (this.bindings.content.value() || [])[A];
      this.bindings.selectedObject.setValue(C)
    }
    if (this.bindings.selectedValue) {
      var D = this._items(F.selectedIndex);
      if (D) {
        this.bindings.selectedValue.setValue(D.value)
      } else {
        this.bindings.selectedValue.setValue(null)
      }
    }
  },
  computeSelectionIndexes: function() {
    var B = [];
    var A = this._items();
    function C(E, D) {
      if (E.selected) {
        B.push(D)
      }
    }
    A.forEach(C);
    return B
  },
  setSelection: function(E) {
    if (!E || !E.length) {
      this.clearSelection();
      return
    }
    var C = this.widget();
    var A = ("SELECT" !== C.tagName);
    this.selectionIndexes = E.concat();
    this.selectionIndexes.sort();
    C.selectedIndex = this.selectedIndex = this.selectionIndexes[0];
    var B = 0;
    var F = this.selectionIndexes.length;
    E = this.selectionIndexes;
    var G = Element.addClassName;
    var I = Element.removeClassName;
    function D(K, J) {
      if (B < F && J === E[B]) {
        K.selected = true;
        B++
      } else {
        K.selected = false
      }
      if (!A) {
        return
      }
      if (K.selected) {
        G(K, coherent.Style.kSelectedClass)
      } else {
        I(K, coherent.Style.kSelectedClass)
      }
    }
    var H = this._items();
    H.forEach(D)
  },
  clearSelection: function() {
    var C = this.widget();
    var D = ("SELECT" !== C.tagName);
    function B(E) {
      if (E.selected) {
        E.selected = false
      }
      if (D) {
        Element.removeClassName(E, coherent.Style.kSelectedClass)
      }
    }
    var A = this._items();
    A.forEach(B);
    C.selectedIndex = this.selectedIndex = -1;
    this.selectionIndexes = []
  },
  selectElementAtIndex: function(B) {
    var C = this.widget();
    var A = ("SELECT" !== C.tagName);
    var D = this._items(B);
    if (!D) {
      return
    }
    D.selected = true;
    if (A) {
      Element.addClassName(D, coherent.Style.kSelectedClass)
    }
  },
  deselectElementAtIndex: function(B) {
    var C = this.widget();
    var A = ("SELECT" !== C.tagName);
    var D = this._items(B);
    if (!D) {
      return
    }
    D.selected = false;
    if (A) {
      Element.removeClassName(D, coherent.Style.kSelectedClass)
    }
  },
  observeSelectedIndexChange: function(B) {
    var A = B.newValue ? [B.newValue] : [];
    this.setSelection(A)
  },
  observeSelectedObjectChange: function(E) {
    var D = E.newValue;
    if (null === D || "undefined" === typeof(D)) {
      this.setSelection([]);
      return
    }
    var C = this.bindings.content.value();
    var A = C.indexOf(D);
    var B = ( - 1 === A ? [] : [A]);
    this.setSelection(B)
  },
  observeSelectionIndexesChange: function(B) {
    var A = B.newValue || [];
    this.setSelection(A)
  },
  sortOrderUpdated: function(F) {
    var E;
    var C;
    var B = E.objectsAtIndexes(this.selectionIndexes);
    var G = C.indexesOfObjects(B);
    this.bindings.content.setValue(C);
    this.setSelection(G);
    if (this.bindings.selectedIndex) {
      this.bindings.selectedIndex.setValue(this.selectedIndex)
    }
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(this.selectionIndexes)
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      var A = this.selectionIndexes[0];
      var D = (this.bindings.content.value() || [])[A];
      this.bindings.selectedObject.setValue(D)
    }
  },
  observeContentChange: function(K) {
    var A = this.container();
    var F = this.widget();
    var H;
    var E;
    var L;
    var I;
    var J;
    switch (K.changeType) {
    case coherent.ChangeType.setting:
      J = this.bindings.content.value();
      var N = [];
      if (this.bindings.selectionIndexes) {
        var G = this.bindings.selectionIndexes.value();
        N = J.objectsAtIndexes(G)
      } else {
        if (this.bindings.selectedIndex) {
          var D = this.bindings.selectedIndex.value();
          if ( - 1 !== D && J[D]) {
            N = [J[D]]
          }
        } else {
          if (this.bindings.selectedObject) {
            var B = this.bindings.selectedObject.value();
            if (B) {
              N = [B]
            }
          }
        }
      }
      this._items().forEach(this.removeChild, this);
      this._items.removeAll();
      this.clearSelection();
      if (!K.newValue) {
        break
      }
      var M = document.createDocumentFragment();
      for (H = 0; H < K.newValue.length; ++H) {
        if ( - 1 !== N.indexOf(K.newValue[H])) {
          this.selectionIndexes.push(H)
        }
        I = this.createElement(K.newValue[H], null, M);
        this._items.add(I)
      }
      A.appendChild(M);
      this.setSelection(this.selectionIndexes);
      break;
    case coherent.ChangeType.insertion:
      for (H = 0; H < K.indexes.length; ++H) {
        L = this._items(K.indexes[H]);
        I = this.createElement(K.newValue[H], L);
        this._items.insertPartAtIndex(I, K.indexes[H])
      }
      this.setSelection(K.indexes);
      break;
    case coherent.ChangeType.replacement:
      for (H = 0; H < K.indexes.length; ++H) {
        I = this._items(K.indexes[H]);
        I.objectValue = K.newValue[H];
        coherent.setup(I, this.keyPath, I.objectValue)
      }
      break;
    case coherent.ChangeType.deletion:
      G = this.selectionIndexes;
      for (H = K.indexes.length - 1; H >= 0; --H) {
        var C = K.indexes[H];
        G.removeObject(C);
        I = this._items(C);
        this._items.removePartAtIndex(C);
        this.removeChild(I)
      }
      this.setSelection(G);
      break;
    default:
      console.log("Unknown change type: " + K.changeType);
      break
    }
    if (this.bindings.selectionIndex) {
      this.bindings.selectedIndex.setValue(this.selectedIndex)
    }
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(this.selectionIndexes)
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      D = this.selectionIndexes[0];
      B = (this.bindings.content.value() || [])[D];
      this.bindings.selectedObject.setValue(B)
    }
    if (this.bindings && this.bindings.displayValues) {
      this.bindings.displayValues.update()
    }
  },
  beforeRemoveElement: function(B) {
    var A = this.widget();
    if ("SELECT" != A.tagName && this.eventElementWasClicked) {
      Event.stopObserving(B, "mousedown", this.eventElementWasClicked)
    }
  },
  createElement: function(B, C, A) {
    var E = this.widget();
    A = A || this.container();
    var D = coherent.cloneNode(this.templateElement);
    var F = A.insertBefore(D, C || null);
    F.objectValue = B;
    coherent.setupNode(F, B);
    return F
  },
  elementWasClicked: function(A) {
    var F = this.widget();
    var I = A.target || A.srcElement;
    var D = -1;
    var C = null;
    var B = this.container();
    var J = this._items();
    while (I && I.parentNode != B) {
      I = I.parentNode
    }
    if (I) {
      D = J.indexOf(I);
      C = I.objectValue
    }
    if ("mousedown" == A.type) {
      this.selectElementAtIndex(D);
      this.mouseDownIndex = D;
      return true
    }
    var H;
    if (!this.attributeOrProperty("multiple")) {
      this.setSelection(H = [D])
    } else {
      H = this.selectionIndexes.concat();
      if (A.shiftKey) {
        var E;
        if (D < this.anchorTop) {
          this.anchorTop = D;
          E = IndexRange(this.anchorTop, this.anchorBottom)
        } else {
          if (D > this.anchorBottom) {
            this.anchorBottom = D;
            E = IndexRange(this.anchorTop, this.anchorBottom)
          }
        }
        function K(L) {
          if ( - 1 === H.indexOf(L)) {
            H.push(L)
          }
        }
        if (E) {
          E.each(K);
          this.setSelection(H)
        }
      } else {
        if (A.ctrlKey || A.metaKey) {
          var G = H.indexOf(D);
          if ( - 1 === G) {
            this.anchorTop = this.anchorBottom = D;
            H.addObject(D)
          } else {
            H.removeObjectAtIndex(G)
          }
          this.setSelection(H)
        } else {
          this.anchorTop = this.anchorBottom = D;
          this.setSelection(H = [D])
        }
      }
    }
    if (this.bindings.selectedIndex) {
      this.bindings.selectedIndex.setValue(H[0])
    }
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(H)
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      D = H[0];
      C = (this.bindings.content.value() || [])[D];
      this.bindings.selectedObject.setValue(C)
    }
    if (I && "A" == I.tagName) {
      I.blur()
    }
    return true
  }
});
coherent.SearchWidget = Class.create(coherent.InputWidget, {
  __widget__: "Search",
  __widgetTagSpec__: "input[type=search]",
  exposedBindings: ["predicate"],
  init: function() {
    this.base();
    var A = this.widget();
    if ("search" === A.type) {
      Event.observe(A, "search", this.valueChanged.bindAsEventListener(this))
    }
  },
  keypressUpdateTimeout: 25,
  valueChanged: function(A) {
    this.base(A);
    if (this.bindings.predicate) {
      this.bindings.predicate.setValue(this.createFilterPredicate())
    }
  },
  createFilterPredicate: function() {
    var C = this.widget();
    var D = this.attributeOrProperty("predicate");
    var B = C.value.toLowerCase();
    function A(F) {
      var E = F.valueForKeyPath(D);
      if (!E) {
        return !! B
      }
      if (E.toLocaleString) {
        E = E.toLocaleString()
      } else {
        E = E.toString()
      }
      E = E.toLowerCase();
      return ( - 1 !== E.indexOf(B))
    }
    return A
  },
  observePredicateChange: function(A) {}
});
coherent.SelectWidget = Class.create(coherent.ListWidget, {
  __widget__: "Select",
  __widgetTagSpec__: "select",
  exposedBindings: ["displayValues", "selectedValue"],
  observeDisplayValuesChange: function(G, H, B) {
    var C = this.widget();
    var E;
    var D;
    var I = C.options;
    var A = I.length;
    switch (G.changeType) {
    case coherent.ChangeType.setting:
      if (!G.newValue) {
        break
      }
      for (E = 0; E < A; ++E) {
        if (coherent.Browser.IE) {
          I[E].innerText = G.newValue[E]
        } else {
          I[E].text = G.newValue[E]
        }
      }
      break;
    case coherent.ChangeType.insertion:
    case coherent.ChangeType.replacement:
      var F;
      for (F = 0; F < G.indexes.length; ++F) {
        E = G.indexes[F];
        D = I[E];
        D.text = G.newValue[F]
      }
      break;
    default:
      console.log("Unknown change type: " + G.changeType);
      break
    }
  },
  observeSelectedValueChange: function(I, K, B) {
    var E = this.widget();
    var L = E.options;
    var H = L.length;
    var A = I.newValue;
    var J = -1;
    if (this.__initialising && (null === A || "undefined" === typeof(A))) {
      if ( - 1 == E.selectedIndex) {
        return
      }
      A = L[E.selectedIndex].value;
      this.bindings.selectedValue.setValue(E.value);
      return
    }
    E.disabled = "undefined" === typeof(A) || coherent.Markers.MultipleValues === A || coherent.Markers.NoSelection === A;
    var G = [];
    for (var F = 0; F < H; ++F) {
      if (L[F].value == A) {
        G.push(J = F);
        break
      }
    }
    E.selectedIndex = J;
    if (this.bindings.selectionIndexes) {
      this.bindings.selectionIndexes.setValue(G)
    }
    if (this.bindings.selectedIndex) {
      this.bindings.selectedIndex.setValue(G[0])
    }
    if (this.bindings.selectedObject && this.bindings.content) {
      var D = G[0];
      var C = (this.bindings.content.value() || [])[D];
      this.bindings.selectedObject.setValue(C)
    }
  }
});
coherent.TableHeaderWidget = Class.create(coherent.Widget, {
  __widget__: "TableHeader",
  exposedBindings: ["sortDescriptors"],
  init: function() {
    this.base();
    var F = this.widget();
    if (!F.rows.length) {
      return
    }
    var D = F.rows[0];
    var C = D.cells;
    var E = C.length;
    var B;
    this.__selectedColumn = -1;
    this.__sortKeyIndex = {};
    for (var A = 0; A < E; ++A) {
      B = C[A].getAttribute("sortKey");
      if (!B) {
        continue
      }
      this.__sortKeyIndex[B] = A
    }
    Event.observe(D, "click", this.columnClicked.bindAsEventListener(this))
  },
  selectedColumn: function() {
    return this.__selectedColumn
  },
  setSelectedColumn: function(B) {
    var F = this.widget();
    if (!F.rows.length) {
      return
    }
    if (this.__selectedColumn === B) {
      return
    }
    var D;
    var C = F.rows[0];
    if ( - 1 !== this.__selectedColumn) {
      D = C.cells[this.__selectedColumn];
      var A = D.__ascending ? coherent.Style.kAscendingClass: coherent.Style.kDescendingClass;
      Element.updateClass(D, [], [coherent.Style.kSelectedClass, A])
    }
    this.__selectedColumn = B;
    if ( - 1 !== this.__selectedColumn) {
      D = C.cells[this.__selectedColumn];
      var E = D.__ascending ? coherent.Style.kAscendingClass: coherent.Style.kDescendingClass;
      var G = D.__ascending ? coherent.Style.kDescendingClass: coherent.Style.kAscendingClass;
      Element.updateClass(D, [coherent.Style.kSelectedClass, E], G)
    }
  },
  columnClicked: function(D) {
    var F = this.widget();
    var A;
    var H = D.target || D.srcElement;
    while (H && !(A = H.getAttribute("sortKey"))) {
      if (H.parentNode == F) {
        return
      }
      H = H.parentNode
    }
    if (!H) {
      return
    }
    var C = this.__sortKeyIndex[A];
    if (this.__selectedColumn == C) {
      H.__ascending = H.__ascending ? false: true;
      var B = coherent.Style.kAscendingClass;
      var G = coherent.Style.kDescendingClass;
      if (H.__ascending) {
        Element.updateClass(H, B, G)
      } else {
        Element.updateClass(H, G, B)
      }
    } else {
      this.setSelectedColumn(C)
    }
    var E = new coherent.SortDescriptor(A, H.__ascending ? true: false);
    if (this.bindings.sortDescriptors) {
      this.bindings.sortDescriptors.setValue([E])
    }
  },
  observeSortDescriptorsChange: function(C) {
    var B = C.newValue;
    if (!B || !B.length || B.length > 1) {
      this.setSelectedColumn( - 1);
      return
    }
    var A = this.__sortKeyIndex[B[0].keyPath];
    if ("undefined" === typeof(A) || null === A) {
      A = -1
    }
    this.setSelectedColumn(A)
  }
});
coherent.ToggleButtonWidget = Class.create(coherent.InputWidget, {
  exposedBindings: ["checked", "selection"],
  __widget__: "ToggleButton",
  __widgetTagSpec__: ["input[type=checkbox]", "input[type=radio]"],
  init: function() {
    this.base();
    var A = this.widget();
    Event.observe(A, "click", this.elementClicked.bindAsEventListener(this))
  },
  elementClicked: function(B) {
    var C = this.widget();
    var A = C.checked;
    if (this.bindings.checked) {
      this.bindings.checked.setValue(A)
    }
    if (this.bindings.selection) {
      this.bindings.selection.setValue(C.value)
    }
  },
  observeCheckedChange: function(E, D, A) {
    var B = this.widget();
    if (this.__initialising && null === E.newValue) {
      this.bindings.checked.setValue(B.checked);
      return
    }
    var C = !!E.newValue;
    B.checked = C;
    if (this.bindings.selection) {
      this.bindings.selection.setValue(B.value)
    }
  },
  observeSelectionChange: function(F, E, A) {
    var D = this.widget();
    if (this.__initialising && null === F.newValue) {
      if (D.checked) {
        this.bindings.selection.setValue(D.value)
      }
      return
    }
    var C = D.value || (this.bindings.value ? this.bindings.value.value() : null);
    var B = (F.newValue === D.value);
    D.checked = B;
    if (this.bindings.checked) {
      this.bindings.checked.setValue(B)
    }
  }
});