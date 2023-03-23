FROM node:18

# Create a directory for the app and copy the package.json file
RUN mkdir -p /app

COPY package.json /app

# Install dependencies
RUN cd /app && npm install
#RUN npm install -g serve

# Copy the rest of the app's code
COPY . /app
WORKDIR /app


# Expose port 3000 and run the app
EXPOSE 3000
CMD ["npm", "run", "dev"]