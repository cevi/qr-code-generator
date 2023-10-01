
# Stage 1: Compile and Build angular codebase
# Use official node image as the base image
FROM node:20 as build

# Set the working directory
WORKDIR /usr/local/app

# Install app dependencies
COPY package*.json ./

# Install all the dependencies from package-lock.json
RUN npm ci

# Add the source code to app
COPY ./ /usr/local/app/

ARG configuration=development

# Generate the build of the application
RUN npm run build -- --configuration $configuration

# Stage 2: Serve app with nginx server
# Use official nginx image as the base image
FROM nginx:latest

# Copy the build output txo replace the default nginx contents.
COPY --from=build /usr/local/app/dist/QR-Code-Generator /usr/share/nginx/html

# Expose port 80
EXPOSE 80
