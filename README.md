If you don't have the node modules installed, run "npm install" first.

Once all modules are installed, "npm start" to start server, then navigate to localhost:3000.

To use with ngrok, first [download ngrok](https://ngrok.com/download) and extract it to BoardViz-Prototype/ or the directory of your choice. Then run "./ngrok http 3000" from that directory.

The log output can be found at BoardViz-Prototype/test.log. To produce a cleaned version of a log file, run "./clean_log.sh <input file> <output file>". If no output file is specified, it defaults to outfile.log and if no input file is specified either, it defaults to reading test.log. The output file will be overwritten if it already exists. Note: you may need to run "chmod +x clean_log.sh" before being able to execute it.

