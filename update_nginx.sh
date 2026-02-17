#!/bin/bash
# Script to add uploads location to Nginx config

# Backup the current config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak2

# Use awk to insert the uploads location block
awk '
/server_name tmcng.net www.tmcng.net;/ {
    in_tmcng_block = 1
}

in_tmcng_block && /location \/\.well-known\/acme-challenge\// {
    print
    getline
    print
    print ""
    print "    location /uploads/ {"
    print "        alias /var/www/tmcportal/uploads/;"
    print "        expires 30d;"
    print "        add_header Cache-Control \"public, immutable\";"
    print "        access_log off;"
    print "    }"
    in_tmcng_block = 0
    next
}

{print}
' /etc/nginx/sites-available/default | sudo tee /etc/nginx/sites-available/default.new >/dev/null

# Replace the original with the new one
sudo mv /etc/nginx/sites-available/default.new /etc/nginx/sites-available/default

# Test the configuration
sudo nginx -t
