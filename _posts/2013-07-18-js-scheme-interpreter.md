---
layout: post
title:  "Writing a Scheme Interpreter in Javascript"
date:   2013-07-18 03:14:15
categories: javascript scheme
about: "writing a Scheme interpreter in Javascript"
---

Even at my school, where it serves as a sort of lingua franca for CS students,
the [Scheme](https://en.wikipedia.org/wiki/Scheme_%28programming_language%29)
programming language is often denigrated as being useless, ugly, or hard to
read. Those of us on the other side of the fence, myself included, find it
instructive, aesthetically pleasing, and occasionally of practical use. This post,
however, is *not* about a practical use of Scheme. It's about writing a tiny
Lisp interpreter for fun. It seems like everyone is doing this right now, but my
inspiration for this interpreter does not come from another interpreter on the
web; rather, it comes from the first interpreter I wrote for [Dan
Friedman](http://www.cs.indiana.edu/~dfried/)'s
[Programming Languages class](https://cgi.soic.indiana.edu/~c311/doku.php) at IU.

## In Scheme

When Professor Friedman lectures, he makes a concerted effort to blow the minds
of his students. The novelty of having a small epiphany every lecture is
something that gradually wore off for me, but when I first saw the "3 line"
Scheme interpreter, I was floored. Suddenly, the real power of Scheme's (Lisp's)
lists clicked.

{% highlight scheme %}
(define value-of
  (lambda (exp env)
    (pmatch
      [(lambda (,x) ,body) (lambda (a) (value-of body (lambda (y) (if (eq? y x) a (env y)))))]
      [(,rator ,rand) ((value-of rator env) (value-of rand env))]
      [,x (env exp)])))
{% endhighlight %}

(pmatch is written by Oleg Kiselyov, and can be found
[here](http://www.cs.indiana.edu/cgi-pub/c311/lib/exe/fetch.php?media=pmatch.scm).
It's a simple pattern matcher that behaves in a really intuitive way.)

Utility-wise, this interpreter can't do much. It can only evaluate
single-argument lambdas, applications of these lambdas, and variables that
exist in the environment. But it can do all of this in a mere three lines, and
each line you add to it will extend this functionality further. This interpreter
can be written so concisely because Scheme (Lisp) is
[homoiconic](https://en.wikipedia.org/wiki/Homoiconic); i.e., its
programs can be represented by one of its data structures (lists), and
vice-versa. With the help of pmatch, parsing code represented by these data
structures is fairly straightforward. Here are some examples of programs the
interpreter can run:

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
