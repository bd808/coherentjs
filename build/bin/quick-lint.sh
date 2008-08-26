#!/bin/sh
MACHTYPE=`uname -p`
JSL_CONF=$TM_BUNDLE_SUPPORT/conf/jsl.conf
JSL=$TM_BUNDLE_SUPPORT/bin/$MACHTYPE/jsl
# get config from regular places
if [ -e $TM_PROJECT_DIRECTORY/jsl.conf ]; then
	JSL_CONF=$TM_PROJECT_DIRECTORY/jsl.conf
fi
if [ -e $TM_DIRECTORY/jsl.conf ]; then
	JSL_CONF=$TM_DIRECTORY/jsl.conf
fi

cd "$TM_DIRECTORY"
"$JSL" conf "$JSL_CONF" process "$TM_FILENAME"| sed -n '$p'
