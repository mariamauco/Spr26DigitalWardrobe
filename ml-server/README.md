### ML-Server for AI wardrobe project
This folder contains the Flask-based Machine Learning server for the Digital Wardrobe application.

The ML server is responsible for heavy AI processing including:

🖼️ Background removal

🔍 Image embeddings (style understanding)

🤖 AI stylist responses (RAG-based agent)

🧪 Future virtual try-on experiments

This server works alongside the MERN backend and React frontend as part of the system architecture described in the project documentation

# How to run app:

1. **Update package manager**
    `sudo apt update`
    Updates the list of available packages and their versions.

2. **Create virtual environment**
    `python3 -m venv env`
    Creates an isolated Python environment to manage project dependencies.

3. **Activate virtual environment**
    `source env/bin/activate`
    Activates the virtual environment so packages install locally to this project.

4. **Install Flask**
    `pip install Flask`
    Installs the Flask web framework for building the application.

5. **Install Flask CORS**
    `pip install flask-cors`
    Installs Flask extension to handle Cross-Origin Resource Sharing requests.

6. **Start the server**
    `flask run`
    Launches the Flask development server.

7. **Access the application**
    Open your browser and go to `http://127.0.0.1:5000`
