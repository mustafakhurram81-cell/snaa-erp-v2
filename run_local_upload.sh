#!/bin/bash
nohup node --env-file=.env.local upload_local_images.mjs > sync_local_images.log 2>&1 &
echo "Local background sync started. PID: $!"
