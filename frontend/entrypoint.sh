#!/bin/sh
set -e

# Replace only ${PORT} with the value of the PORT environment variable.
# The single quotes around '${PORT}' are crucial to prevent the shell from
# interpreting other variables in the template.
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx in the foreground
exec nginx -g 'daemon off;' 