

var valueOf = function(exp, env) {
  if (!(exp instanceof Array)) {
    return env(exp);
  } else if (exp[0] == 'lambda') {
    return function(a) {
      return valueOf(exp[2], function(y) {
        if (y === exp[1][0])
          return a;
        else return env(y)
      });
    };
  } else {
    return (valueOf(exp[0], env))(valueOf(exp[1], env));
  }
}
