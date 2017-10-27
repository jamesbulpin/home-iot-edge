#!/bin/bash
#
# Runs the service in a loop to ensure it's kept running
# 

svcname=azure-iot-gateway
if [ -d /tmp/iotlogs ]; then
  LOGDIR=/tmp/iotlogs
else
  LOGDIR=/tmp
fi

while true; do
  logger -t homeauto "Starting service '$svcname'"
  if [ -e $LOGDIR/${svcname}.log ]; then
    rm -f $LOGDIR/${svcname}.log.1
    mv $LOGDIR/${svcname}.log $LOGDIR/${svcname}.log.1
  fi
  # azure-iot-gateway loops on getchar fron stdin waiting got a \r or \n
  # to quit. If we EOF stdin (i.e. </dev/null) then this is a tight loop
  # consuming cycles. The ( sleep | echo ) avoids this can causes a periodic
  # reconnect
  ( sleep 3600 ; echo) | azure-iot-gateway gw.config.json > $LOGDIR/${svcname}.log 2>&1
done

