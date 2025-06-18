import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Google Generative AI
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

class AnaChatbot:
    def __init__(self, context):
        self.context = context
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Initialize the chat
        self.chat = self.model.start_chat(history=[])
        
        # Set up Ana's initial context and personality
        self.setup_context()
    
    def setup_context(self):
        system_prompt = f"""You are Ana, an AI assistant for the Grupo 11 Flujo project.
        Use the following context to answer questions about the project:
        
        {self.context}
        
        Guidelines for your responses:
        1. Be friendly and professional
        2. If you're not sure about something, say so
        3. Keep responses concise but informative
        4. Use markdown formatting when appropriate
        5. When discussing database tables, use their exact names
        6. If asked about something not in the context, say you can only answer questions about the Grupo 11 Flujo project
        """
        
        self.chat.send_message(system_prompt, stream=False)
    
    async def get_response(self, user_message):
        try:
            response = self.chat.send_message(user_message, stream=False)
            return response.text
        except Exception as e:
            print(f"Error getting response: {e}")
            return "I apologize, but I encountered an error. Please try asking your question again." 