#!/bin/bash

# Define the output zip file name
output_zip="text-redactor.zip"

rm -f "$output_zip"

zip -r "$output_zip" ./* -x ".*" -x "*.zip" -x ".git/*" -x "dist/"

echo "Files zipped successfully into $output_zip."
