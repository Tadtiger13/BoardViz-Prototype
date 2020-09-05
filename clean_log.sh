#!/bin/bash
logfile="$1"
outfile="$2"

if [ -z "$2" ]; then
  echo "Usage: ./clean_log.sh <input file> <output file>"
  exit 1
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
