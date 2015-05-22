# Mucow-Example-Compiler
Compile MuCOW files from XML to HTML, pulling out comments to be side by side

This tool is simply a recreation of the original tool which was likely lost.
It uses a very simple format and is based on NodeJS.

## Install
Copy down the repo, and install NodeJS onto your machine. From there, `cd`
into the directory and run the following command

    npm install

## Use
To use, simply provide the file name you want to process, and where you want
to output the HTML file

    node processor.js MyExample.mucow html/MyExample.mucow.html
