#!/bin/bash
nohup node --env-file=.env.local sync_images_optimized.mjs > sync_optimized.log 2>&1 &
echo "Optimized background sync started. PID: $!"
