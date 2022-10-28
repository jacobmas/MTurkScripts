#!/bin/bash

mv $JACOB/Downloads/$1 $JACOB/Software/MTurkScripts/$2
cd $JACOB/Software/MTurkScripts
git add $2/*.js
git commit -m "update"
git push
