FROM nginx:1.27-alpine

# Suppression de la configuration par defaut
RUN rm /etc/nginx/conf.d/default.conf

# Copie de la configuration personnalisee (reverse-proxy vers les microservices)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques du frontend
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
