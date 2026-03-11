#!/bin/bash
nohup node --env-file=.env.local sync_images.mjs > sync_images.log 2>&1 &
echo "Background sync started. PID: $!"
