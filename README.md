#Brackets Node.JS Debugger

Brackets-node-debugger is an extension for the [Brackets](http://brackets.io) editor.

It's an early stage step-by-step debugger for Node.js applications.

Install it
------

Use the built-in Brackets Extension Manager to install __Node.JS Debugger__
_or_ clone this repository into your Extension folder

You need to __restart__ (not just reload) Brackets after the installation!

How to use it
-------

Start your script with `node --debug-brk yor-script.js` _or_ `node --debug your-script.js`

Go into Brackets and click on `Debug -> Node.js Debugger` _or_ use `Ctrl-Shift-I`

Click on the red icon at the top left corner to activate the debugger and connect it to your script.

![alt ](https://github.com/TheBenji/brackets-node-debugger/raw/master/screenshots/disconnect.png "Click on the icon to connect the Debugger")

Use the Buttons to _Step over_, _Step in_, _Step out_ or to _continue_ the script execution.

![alt ](https://github.com/TheBenji/brackets-node-debugger/raw/master/screenshots/connected.png "Control the debugger")

Click on a line number to set/remove a Breakpoint and use the console to get an variable for the current scope.

![alt ](https://github.com/TheBenji/brackets-node-debugger/raw/master/screenshots/breakpoint.png "Breakpoint and the console")

Use the arrow keys to browse through the history.

Options
---------

Open the preferences file (`brackets.json`) and edit/add the entry.
All options use the `brackets-node-debugger.`-prefix

|Option                     |Default     | Description                           |
|---------------------------|------------|---------------------------------------|
|debugger-port              |5858        |Port the V8 Debugger is running on     |
|debugger-host              |localhost   |Host the V8 Debugger is running on     |
|showChangelogOnUpdate      |true        |Show Changelog Dialog when you update the Extension|
|autoConnectOnToggle|false|Connect to the debugger as soon as you open the Node.js Debugger Panel|
|autoConnect|false|Connect always to the debugger as soon as available, powerful if your node process restarts on file changes|
|removeBreakpointsOnDisconnect|false|Remove all Breakpoints when Debugger disconnects|
|lookupDepth|4|Defines how deep the lookup max goes if you evaluate something|

Bugs & Contributing
-----------

There are still a lot of featuers missing and probably a few bugs as well, so feel free to contribute in any way!

Send a pull request, open an issue if you found a bug or if you have an idea to make this tool even better...

License
-----

The Brackets Node.JS Debugger is licensed under the [MIT License](https://github.com/TheBenji/brackets-node-debugger/blob/master/LICENSE)

And thanks for the awesome Icons, [Ionicons](https://github.com/driftyco/ionicons)

