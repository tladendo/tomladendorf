---
layout: post
title:  "Writing a Scheme Interpreter in Javascript"
date:   2013-07-18 03:14:15
categories: javascript scheme
about: "writing a Scheme interpreter in Javascript"
---

One thing that excites me about Javascript its amenability to functional
programming concepts. This, in conjunction with the similarity between
Javascript's arrays and Lisp's lists, got me thinking about writing a tiny
interpreter in Javascript. The inspiration for this came from [Dan
Friedman](http://www.cs.indiana.edu/~dfried/)'s
[Programming Languages class](https://cgi.soic.indiana.edu/~c311/doku.php) at
IU, which I took last year. In the class, we wrote several tiny Scheme
interpreters in Scheme, one of which was only three lines. This is the
interpreter I decided to translate to Javascript.

## The Three-Line Interpreter

{% highlight scheme %}
(define value-of
  (lambda (exp env)
    (pmatch
      [(lambda (,x) ,body) (lambda (a) (value-of body (lambda (y) (if (eq? y x) a (env y)))))]
      [(,rator ,rand) ((value-of rator env) (value-of rand env))]
      [,x (env exp)])))
{% endhighlight %}

In three lines, we have an interpreter that can handle lambdas, lambda
applications, and variables. There's not a whole lot you can do with this, but
it's an extremely terse foundation for an interpreter that proffers a lot of
learning opportunities. In Dan's class, for instance, we used this interpreter
to explore and understand [lexical
scoping](https://en.wikipedia.org/wiki/Lexical_scope#Lexical_scoping) and
different [evaluation strategies](https://en.wikipedia.org/wiki/Evaluation_strategy). 
To understand it, we first need to know a little bit about how pmatch works
(pmatch is written by Oleg Kiselyov, and can be found
[here](http://www.cs.indiana.edu/cgi-pub/c311/lib/exe/fetch.php?media=pmatch.scm).
In short, pmatch matches on a pattern that is in the form of a list or a symbol
and gives you access to any of the variables you have preceded with a comma
(`,`). So, on the first line of the `pmatch` expression above, `(lambda (,x)
,body)` will match any list that satisfies these three constraints:

1. Its first element is the symbol `'lambda`.
2. Its second element is a list.
3. It contains 3 elements.

If these three conditions are satisfied, then the second half of that line of
the pmatch will evaluate (to the exclusion of the other lines) and we will have
access to the variables `x` and `body`, which will refer to the symbols/lists
that `,x` and `,body` matched.




{% highlight scheme %}

(define empty-env (lambda (y) "Error: undefined variable refrence"))
(value-of '(lambda (x) x) empty-env)
;; => the identity function
(value-of '((lambda (x) x) (lambda (x) x)) empty-env)
;; => the identity function, again
(define cool-env (lambda (y)
                   (if (eq? y 'add1)
                       add1
                       (lambda (y)
                         (if (eq? y 'x)
                             10
                             (lambda (y) (eq? y 'y) 20 empty-env))))))
(value-of '((lambda (x) (add1 (add1 (add1 x)))) x) cool-env)
;; => 13
(value-of '(add1 y) cool-env)
;; => 21

{% endhighlight %}

Over the course of eight weeks, we extended this interpreter to handle primitives,
lists, variable definitions, built-in procedures, and continuations. We also
made it adopt four different calling conventions: call-by-value (which is
Scheme's calling convention), call-by-reference, call-by-name, and call-by-need.
Building these toy interpreters helped me understand programming languages
better, but more importantly, they were fun to build. This is why I decided to
build one in Javascript.

## In Javascript

In writing the Javascript version of this interpreter, I sought to take
advantage of two features Javascript provides: 1. you can write functional
programs in Javascript; and 2. you can treat Javascript arrays like Scheme's
lists (and thus use them to represent programs). To illustrate the second point,
here is the identity function in Scheme represented as a Javascript array:
`['lambda', ['x'], 'x']`. Anyway, with this under my belt, I started hacking
away, and came up with this translation of the interpreter:

{% highlight javascript %}

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

{% endhighlight %}
