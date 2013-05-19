#!/bin/bash

THISDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

node_check()
{
  if [ -z $(which node) ]; then
    echo "ERROR: You need node.js installed for this application to work."
    echo
    exit 0;
  fi
}

case $1 in
'-h')
  echo "Usage: $0 [comma seperated list of channels] [message]"
  echo "Channels can be channel ids, names, or one of the available keywords (trending, popular)"
  echo
  ;;
*)
  node_check

  nohup node $THISDIR/../server.js $1 $2 > /dev/null 2>&1 &
  open "http://localhost:1981"
  ;;
esac

exit 0;