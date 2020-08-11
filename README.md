If you don't have the node modules installed, run "npm install" first.

Once all modules are installed, "npm start" to start server, then navigate to localhost:3000.

To use with ngrok, first [download ngrok](https://ngrok.com/download) and extract it to BoardViz-Prototype/ or the directory of your choice. Then run "./ngrok http 3000" from that directory.

The log output can be found at BoardViz-Prototype/test.log. To produce a cleaned version of test.log, run "./clean_log.sh <output file>" from BoardViz-Prototype/, where <output file> is the name of the cleaned log file that will be created (or overwritten if already present). Note: you may need to run "chmod +x clean_log.sh" before being able to execute it.

