#!/bin/bash
logfile="test.log"
outfile="$1"

if [ -z "$1" ]; then
  echo "No output file specified, writing to outputlog.txt"
  outfile="outputlog.txt"
fi

> "$outfile"

expat=".*: (Disc|C)onnected .*"

while IFS= read -r line; do
  if [[ ! $line =~ $expat ]]; then
    echo "$line" >> "$outfile"
  fi
done < "$logfile"

sed -i '' -e 's/.\"message\":\"//g' "$outfile"
sed -i '' -e 's/\",\"level.*//g' "$outfile"
