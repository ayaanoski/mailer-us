FROM alpine:3.21

RUN apk add --no-cache postfix ca-certificates

COPY main.cf /etc/postfix/main.cf
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 25

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
