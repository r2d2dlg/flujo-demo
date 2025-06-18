# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables to prevent bytecode files and buffer output
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Copy the backend requirements file
COPY backend/requirements.txt .

# Upgrade pip and install the dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This includes the backend app, the martamaria module, and credentials
COPY backend/ ./backend/
COPY martamaria/ ./martamaria/

# Expose the port the app runs on. Google Cloud Run automatically uses port 8080.
EXPOSE 8080

# Define the command to run the app.
# We specify the app's location within the container's file system.
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]