#Brackets Node Debugger

Brackets-node-debugger is an extension for the [Brackets](http://brackets.io) editor.

It's an early stage step-by-step debugger for Node applications.

Install it
------

You need to clone this repo into the extension folder (i.e Brackets/extensions/user)
At the current state it's not available in the extension manager because it's still under heavy development.

How to use it
-------

Start your script with `node --debug-brk yor-script.js`

Go into Brackets and click on `Debug -> Node.js Debugger`

Click now on `Activate` and wait until the Debugger is connected.
Now you can click on `next` to get started


Features
------

At the moment there are a lot of important features missing but on the other hand there are probably a few more bugs :)

- Step next
- Step in
- Step out
- get variables from current frame

Next steps
----

Following the next top priority steps:

 - Breakpoints
 - Better gui
 - Make it clearer what's happening
